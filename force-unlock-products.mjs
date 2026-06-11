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

async function forceUnlockProducts() {
  console.log('=== FORCE UNLOCK ALL PRODUCTS ===');
  console.log('Fetching all products...');
  const products = await client.fetch('*[_type == "product"]');

  if (products.length === 0) {
    console.log('No products found.');
    return;
  }

  console.log(`Found ${products.length} products.`);
  console.log('Backing up all products to products-backup.json...');
  fs.writeFileSync('products-backup.json', JSON.stringify(products, null, 2));
  console.log('Backup created at products-backup.json');

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n[${i + 1}/${products.length}] Processing: ${product.title} (${product._id})`);

    try {
      const { _id, _rev, _type, ...productData } = product;
      
      console.log('  - Performing full replace...');
      
      const transaction = client.transaction();
      transaction.delete(_id);
      transaction.create({
        _id,
        _type: 'product',
        ...productData,
      });
      
      await transaction.commit();
      
      console.log(`✓ SUCCESS: ${product.title} is now unlocked!`);
    } catch (error) {
      console.error(`✗ FAILED: ${product.title}`);
      console.error('  Error:', error.message);
      console.error('  Full error:', JSON.stringify(error, null, 2));
    }
  }

  console.log('\n=== DONE ===');
}

forceUnlockProducts().catch((error) => {
  console.error('\n=== FATAL ERROR ===');
  console.error(error);
  process.exitCode = 1;
});
