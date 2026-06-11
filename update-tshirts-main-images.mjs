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
const ASSETS_ROOT = path.join(__dirname, 'src', 'assets', 'main pics');
const IGNORED_DIR_NAMES = new Set(['.venv']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'a4f3nfat',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function isImageFile(fileName) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function isIgnoredFile(fileName) {
  return fileName.toLowerCase().endsWith('.py');
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findProductFolderNames() {
  if (!fs.existsSync(ASSETS_ROOT)) {
    throw new Error(`Assets folder not found: ${ASSETS_ROOT}`);
  }

  return fs
    .readdirSync(ASSETS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIR_NAMES.has(entry.name))
    .map((entry) => entry.name);
}

function collectImageFiles(folderPath, rootName) {
  const files = [];

  if (!fs.existsSync(folderPath)) {
    return files;
  }

  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || isIgnoredFile(entry.name)) {
      continue;
    }

    const entryPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'main pic') {
        continue;
      }

      files.push(...collectImageFiles(entryPath, rootName));
      continue;
    }

    if (!isImageFile(entry.name)) {
      continue;
    }

    files.push(entryPath);
  }

  return files.sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));
}

function findMainPicFile(folderPath) {
  const mainPicPath = path.join(folderPath, 'main pic');

  if (!fs.existsSync(mainPicPath)) {
    return null;
  }

  const mainPicFile = fs
    .readdirSync(mainPicPath)
    .find((fileName) => isImageFile(fileName) && !isIgnoredFile(fileName));

  return mainPicFile ? path.join(mainPicPath, mainPicFile) : null;
}

function makeImageAssetRef(assetId) {
  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetId,
    },
  };
}

async function uploadImage(filePath) {
  const filename = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload('image', buffer, { filename });

  return makeImageAssetRef(asset._id);
}

async function fetchTShirtProducts() {
  const products = await client.fetch(
    `*[_type == "product" && category == $category] {
      _id,
      title,
      slug,
      mainImage,
      images
    }`,
    { category: CATEGORY }
  );

  return Array.isArray(products) ? products : [];
}

async function updateMainImages() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error('Missing SANITY_API_TOKEN. Add it to your environment or .env.local.');
  }

  const folders = findProductFolderNames();
  const products = await fetchTShirtProducts();
  const productMap = new Map(products.map((product) => [normalizeName(product.title), product]));

  if (folders.length === 0) {
    console.log(`No product folders found in ${ASSETS_ROOT}`);
    return;
  }

  console.log(`Found ${folders.length} folders under ${ASSETS_ROOT}. Processing T-Shirts...`);

  let updatedCount = 0;

  for (const folderName of folders) {
    const normalizedFolderName = normalizeName(folderName);
    const product = productMap.get(normalizedFolderName);

    if (!product) {
      console.log(`Skipping folder with no matching product: ${folderName}`);
      continue;
    }

    const folderPath = path.join(ASSETS_ROOT, folderName);
    const mainPicFile = findMainPicFile(folderPath);
    const galleryFiles = collectImageFiles(folderPath).filter((filePath) => !mainPicFile || path.resolve(filePath) !== path.resolve(mainPicFile));

    if (!mainPicFile) {
      console.log(`Skipping ${product.title} - no main pic found in ${folderName}/main pic`);
      continue;
    }

    try {
      const mainImage = await uploadImage(mainPicFile);
      const images = [];

      for (const filePath of galleryFiles) {
        images.push(await uploadImage(filePath));
      }

      await client
        .patch(product._id)
        .set({
          mainImage,
          images,
        })
        .commit({ autoGenerateArrayKeys: true });

      updatedCount += 1;
      console.log(`Updated: ${product.title}`);
    } catch (error) {
      console.error(`Failed: ${product.title} - ${error.message}`);
    }
  }

  console.log(`\nDone. Updated ${updatedCount}/${folders.length} folders.`);
}

updateMainImages().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
