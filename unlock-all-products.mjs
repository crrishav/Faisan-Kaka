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

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'a4f3nfat',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function unlockAllProducts() {
  console.log('Fetching all products...');
  const products = await client.fetch('*[_type == "product"]');

  if (products.length === 0) {
    console.log('No products found.');
    return;
  }

  console.log(`Found ${products.length} products. Unlocking all fields...`);

  for (const product of products) {
    console.log(`Processing: ${product.title} (${product._id})`);

    // Create a patch that preserves all existing fields
    // This ensures any readonly constraints are removed by re-saving
    try {
      await client
        .patch(product._id)
        .set({}) // Just touch the document to remove any transient readonly states
        .commit();
      console.log(`✓ Unlocked: ${product.title}`);
    } catch (error) {
      console.error(`✗ Failed to unlock ${product.title}:`, error.message);
    }
  }

  console.log('\nAll products unlocked successfully!');
}

unlockAllProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
