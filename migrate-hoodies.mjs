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

const HOODIE_PATH = path.join(__dirname, 'src', 'assets', 'Hoodie designs');
const CATEGORY = 'Hoodies';
const PRICE_INR = 1000;
const PRICE_NPR = 2000;

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFilename(filename) {
  const cleanName = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const match = cleanName.match(/^(\d+)\s+(front|back)$/i);

  if (!match) {
    return null;
  }

  return {
    serial: match[1],
    variant: match[2].toLowerCase(),
  };
}

async function uploadImage(filePath) {
  const filename = path.basename(filePath);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const asset = await client.assets.upload('image', imageBuffer, { filename });

      return {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      };
    } catch (error) {
      if (attempt === 2) {
        console.error(`Failed to upload ${filePath}:`, error.message);
        return null;
      }

      console.log(`Retrying upload for ${filename}...`);
    }
  }
}

async function deleteExistingProducts() {
  const existingProducts = await client.fetch(
    `*[_type == "product" && category == $category] { _id }`,
    { category: CATEGORY }
  );

  if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
    console.log(`No existing ${CATEGORY} products found to delete.`);
    return;
  }

  console.log(`Deleting ${existingProducts.length} existing ${CATEGORY} products...`);
  for (const product of existingProducts) {
    await client.delete(product._id);
  }
}

async function migrateHoodies() {
  await deleteExistingProducts();

  if (!fs.existsSync(HOODIE_PATH)) {
    console.log(`Category folder not found: ${HOODIE_PATH}`);
    return;
  }

  const files = fs
    .readdirSync(HOODIE_PATH)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));

  const products = {};

  for (const file of files) {
    const info = parseFilename(file);

    if (!info) {
      console.log(`Could not parse: ${file}`);
      continue;
    }

    const filePath = path.join(HOODIE_PATH, file);
    const productKey = info.serial;

    if (!products[productKey]) {
      products[productKey] = {
        title: info.serial,
        category: CATEGORY,
        priceINR: PRICE_INR,
        priceNPR: PRICE_NPR,
        description: `Hoodie ${info.serial} - Premium quality hoodies from Faisan Kaka.`,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['#111111', '#2f2f2f', '#d9d9d9', '#1e3a8a'],
        featured: false,
        inStock: true,
        stock: 0,
        mainImage: null,
        images: [],
      };
    }

    console.log(`Uploading ${file}...`);
    const imageAsset = await uploadImage(filePath);

    if (!imageAsset) {
      continue;
    }

    if (info.variant === 'front' && !products[productKey].mainImage) {
      products[productKey].mainImage = imageAsset;
    } else {
      products[productKey].images.push(imageAsset);
    }

    if (!products[productKey].mainImage && products[productKey].images.length > 0) {
      products[productKey].mainImage = products[productKey].images[0];
      products[productKey].images = products[productKey].images.slice(1);
    }
  }

  console.log('\nCreating products...\n');

  for (const product of Object.values(products)) {
    if (!product.mainImage && product.images.length === 0) {
      console.log(`Skipping ${product.title} - no images`);
      continue;
    }

    try {
      await client.create({
        _type: 'product',
        title: product.title,
        slug: { _type: 'slug', current: slugify(product.title) },
        category: product.category,
        description: product.description,
        priceINR: product.priceINR,
        priceNPR: product.priceNPR,
        mainImage: product.mainImage,
        images: product.images,
        sizes: product.sizes,
        colors: product.colors,
        stock: product.stock,
        inStock: product.inStock,
        featured: product.featured,
      });

      console.log(`Created: ${product.title}`);
    } catch (error) {
      console.error(`Failed to save ${product.title}:`, error.message);
    }
  }

  console.log('\nHoodie migration complete!');
}

migrateHoodies().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
