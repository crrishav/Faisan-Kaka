import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env.local');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, 'utf8');

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const CATEGORY = 'T-Shirts';
const TARGET_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'a4f3nfat',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function fetchTShirtProducts() {
  const products = await client.fetch(
    `*[_type == "product" && category == $category] { _id, title, sizes }`,
    { category: CATEGORY }
  );

  return Array.isArray(products) ? products : [];
}

async function updateSizes() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error('Missing SANITY_API_TOKEN. Add it to your environment or .env.local.');
  }

  const products = await fetchTShirtProducts();

  if (products.length === 0) {
    console.log(`No ${CATEGORY} products found.`);
    return;
  }

  console.log(`Found ${products.length} ${CATEGORY} products. Updating sizes...`);

  let updatedCount = 0;

  for (const product of products) {
    try {
      await client
        .patch(product._id)
        .set({
          sizes: TARGET_SIZES,
        })
        .commit({ autoGenerateArrayKeys: true });

      updatedCount += 1;
      console.log(`Updated: ${product.title || product._id}`);
    } catch (error) {
      console.error(`Failed: ${product.title || product._id} - ${error.message}`);
    }
  }

  console.log(`\nDone. Updated ${updatedCount}/${products.length} products.`);
}

updateSizes().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
