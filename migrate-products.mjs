import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'a4f3nfat',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const COLLECTION_PATH = path.join(__dirname, 'src', 'assets', 'Collection');
const DEFAULT_CATEGORY = 'T-Shirts';
const TARGET_CATEGORY = process.argv.includes('--all')
  ? null
  : (process.argv.find((arg) => arg.startsWith('--category='))?.split('=')[1] || DEFAULT_CATEGORY);

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFilename(filename) {
  const cleanName = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const prefixedMatch = cleanName.match(/^(\d+)\.\s*(.+?)\s*\((front|back|Front|Back)\)(?:\s*\(([^,]+)\s*,\s*([^)]+)\))?/i);

  if (prefixedMatch) {
    return {
      serial: prefixedMatch[1],
      name: prefixedMatch[2].trim(),
      variant: prefixedMatch[3].toLowerCase(),
      priceINR: prefixedMatch[4] ? parseFloat(prefixedMatch[4].trim()) : null,
      priceNPR: prefixedMatch[5] ? parseFloat(prefixedMatch[5].trim()) : null,
      hasPrice: Boolean(prefixedMatch[4] && prefixedMatch[5]),
    };
  }

  const fallbackMatch = cleanName.match(/^(\d+)\.\s*(.+?)\s*\(([^)]+)\)(?:\s*\(([^,]+)\s*,\s*([^)]+)\))?/i);

  if (fallbackMatch) {
    return {
      serial: fallbackMatch[1],
      name: fallbackMatch[2].trim(),
      variant: fallbackMatch[3].toLowerCase(),
      priceINR: fallbackMatch[4] ? parseFloat(fallbackMatch[4].trim()) : null,
      priceNPR: fallbackMatch[5] ? parseFloat(fallbackMatch[5].trim()) : null,
      hasPrice: Boolean(fallbackMatch[4] && fallbackMatch[5]),
    };
  }

  return null;
}

async function uploadImage(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const asset = await client.assets.upload('image', imageBuffer, { filename });

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

async function fetchExistingProducts(category) {
  const products = await client.fetch(
    `*[_type == "product" && category == $category] {
      _id,
      title,
      priceINR,
      priceNPR,
      description,
      sizes,
      colors,
      featured,
      inStock,
      stock
    }`,
    { category }
  );

  return Array.isArray(products) ? products : [];
}

async function deleteExistingProducts(category) {
  const existingProducts = await fetchExistingProducts(category);

  if (existingProducts.length === 0) {
    console.log(`No existing ${category} products found to delete.`);
    return new Map();
  }

  console.log(`Deleting ${existingProducts.length} existing ${category} products...`);
  for (const product of existingProducts) {
    await client.delete(product._id);
  }

  return new Map(existingProducts.map((product) => [normalizeTitle(product.title), product]));
}

function buildProductDefaults(category, title, existingProduct) {
  const fallbackDescription = `${title} - Premium quality ${category.toLowerCase()} from Faisan Kaka.`;

  return {
    title,
    category,
    priceINR: Number(existingProduct?.priceINR ?? 0),
    priceNPR: Number(existingProduct?.priceNPR ?? 0),
    description: existingProduct?.description || fallbackDescription,
    sizes: Array.isArray(existingProduct?.sizes) && existingProduct.sizes.length > 0 ? existingProduct.sizes : ['S', 'M', 'L', 'XL'],
    colors: Array.isArray(existingProduct?.colors) && existingProduct.colors.length > 0 ? existingProduct.colors : ['#111111', '#2f2f2f', '#d9d9d9', '#1e3a8a'],
    featured: Boolean(existingProduct?.featured),
    inStock: existingProduct?.inStock !== false,
    stock: Number.isFinite(existingProduct?.stock) ? existingProduct.stock : 0,
  };
}

async function migrateProducts() {
  const categories = TARGET_CATEGORY ? [TARGET_CATEGORY] : ['T-Shirts', 'Hoodies', 'Pants'];
  const products = {};

  const existingByCategory = new Map();

  for (const category of categories) {
    existingByCategory.set(
      category,
      TARGET_CATEGORY
        ? await deleteExistingProducts(category)
        : new Map((await fetchExistingProducts(category)).map((product) => [normalizeTitle(product.title), product]))
    );
  }

  for (const category of categories) {
    const categoryPath = path.join(COLLECTION_PATH, category);

    if (!fs.existsSync(categoryPath)) {
      console.log(`Category folder not found: ${categoryPath}`);
      continue;
    }

    const files = fs.readdirSync(categoryPath).filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const info = parseFilename(file);

      if (!info) {
        console.log(`Could not parse: ${file}`);
        continue;
      }

      const productKey = `${category}:${info.name}`;
      const existingProduct = existingByCategory.get(category)?.get(normalizeTitle(info.name));

      if (!products[productKey]) {
        products[productKey] = {
          ...buildProductDefaults(category, info.name, existingProduct),
          mainImage: null,
          images: [],
        };
      }

      if (info.hasPrice) {
        products[productKey].priceINR = info.priceINR;
        products[productKey].priceNPR = info.priceNPR;
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
  }

  console.log('\nCreating products...\n');

  for (const product of Object.values(products)) {
    if (!product.mainImage && product.images.length === 0) {
      console.log(`Skipping ${product.title} - no images`);
      continue;
    }

    const slug = slugify(product.title);

    try {
      await client.create({
        _type: 'product',
        title: product.title,
        slug: { _type: 'slug', current: slug },
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

  console.log('\nMigration complete!');
}

migrateProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
