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

async function restoreProducts() {
  console.log('=== RESTORING PRODUCTS FROM BACKUP ===');
  
  const backupPath = path.join(__dirname, 'products-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('ERROR: products-backup.json not found!');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`Found ${products.length} products in backup.`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n[${i + 1}/${products.length}] Restoring: ${product.title} (${product._id})`);

    try {
      // First, try to delete any existing draft or published version
      try {
        await client.delete(`drafts.${product._id}`);
        console.log('  - Deleted existing draft');
      } catch (e) { /* ignore if doesn't exist */ }
      
      try {
        await client.delete(product._id);
        console.log('  - Deleted existing published version');
      } catch (e) { /* ignore if doesn't exist */ }

      // Now recreate the product from backup
      await client.createOrReplace(product);
      console.log(`✓ RESTORED: ${product.title}`);
    } catch (error) {
      console.error(`✗ FAILED TO RESTORE: ${product.title}`);
      console.error('  Error:', error.message);
    }
  }

  console.log('\n=== RESTORATION COMPLETE ===');
}

restoreProducts().catch((error) => {
  console.error('\n=== FATAL ERROR ===');
  console.error(error);
  process.exitCode = 1;
});
