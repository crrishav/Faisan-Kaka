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

async function convertToEditable() {
  console.log('=== CONVERTING PRODUCTS TO EDITABLE ===');
  console.log('Fetching published products...');
  
  // Fetch all published products (without draft ID prefix)
  const publishedProducts = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))]`
  );

  if (publishedProducts.length === 0) {
    console.log('No published products found to convert.');
    return;
  }

  console.log(`Found ${publishedProducts.length} published products to convert.`);
  console.log('Backing up all products to products-backup.json...');
  fs.writeFileSync('products-backup.json', JSON.stringify(publishedProducts, null, 2));
  console.log('Backup created at products-backup.json');

  for (let i = 0; i < publishedProducts.length; i++) {
    const product = publishedProducts[i];
    console.log(`\n[${i + 1}/${publishedProducts.length}] Processing: ${product.title} (${product._id})`);

    try {
      const draftId = `drafts.${product._id}`;

      console.log('  - Creating editable draft...');
      await client.createIfNotExists({
        ...product,
        _id: draftId,
      });

      console.log('  - Deleting old locked published document...');
      await client.delete(product._id);

      console.log('  - Publishing new editable version...');
      await client
        .patch(draftId)
        .commit()
        .then(() => client.mutate([
          {
            id: draftId,
            action: 'publish',
          },
        ]));

      console.log(`✓ SUCCESS: ${product.title} is now editable!`);
    } catch (error) {
      console.error(`✗ FAILED: ${product.title}`);
      console.error('  Error:', error.message);
    }
  }

  console.log('\n=== DONE ===');
  console.log('All products should now be editable in Sanity Studio!');
}

convertToEditable().catch((error) => {
  console.error('\n=== FATAL ERROR ===');
  console.error(error);
  process.exitCode = 1;
});
