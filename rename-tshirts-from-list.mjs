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

const CATEGORY = 'T-Shirts';
const LIST_PATH = path.join(__dirname, 'src', 'assets', 'namings for tees.txt');
const isRollback = process.argv.includes('--rollback') || process.argv.includes('--undo');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseRenameLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const firstColonIndex = trimmed.indexOf(':');

  if (firstColonIndex === -1) {
    return null;
  }

  const currentTitle = trimmed.slice(0, firstColonIndex).trim();
  const rest = trimmed.slice(firstColonIndex + 1).trim();
  const descriptionMatch = rest.match(/\((.*)\)\s*$/);

  if (!currentTitle || !descriptionMatch) {
    return null;
  }

  const beforeDescription = rest.slice(0, descriptionMatch.index).trim();
  const secondOpenParenIndex = beforeDescription.lastIndexOf('(');
  const newTitle = secondOpenParenIndex === -1 ? beforeDescription : beforeDescription.slice(0, secondOpenParenIndex).trim();
  const description = descriptionMatch[1].trim();

  if (!newTitle || !description) {
    return null;
  }

  return {
    currentTitle,
    newTitle,
    description,
  };
}

function buildOriginalDescription(currentTitle) {
  return `T-Shirt ${currentTitle} - Premium quality T-Shirts from Faisan Kaka.`;
}

function stripDraftPrefix(documentId) {
  return documentId.startsWith('drafts.') ? documentId.slice('drafts.'.length) : documentId;
}

function isDraftId(documentId) {
  return documentId.startsWith('drafts.');
}

function loadRenameList() {
  if (!fs.existsSync(LIST_PATH)) {
    throw new Error(`Rename list not found: ${LIST_PATH}`);
  }

  return fs
    .readFileSync(LIST_PATH, 'utf8')
    .split(/\r?\n/)
    .map(parseRenameLine)
    .filter(Boolean);
}

async function fetchProductsByCategory() {
  const products = await client.fetch(
    `*[_type == "product" && category == $category] {
      _id,
      title,
      slug,
      category,
      description
      ,mainImage,
      images,
      priceINR,
      priceNPR,
      stock,
      sizes,
      colors,
      inStock,
      featured,
      publishedAt
    }`,
    {
      category: CATEGORY,
    }
  );

  return Array.isArray(products) ? products : [];
}

async function updateProduct(productId, title, description) {
  await client.patch(productId).set({
    title,
    slug: {
      _type: 'slug',
      current: slugify(title),
    },
    description,
  }).commit();
}

function buildPublishedDocument(sourceDocument, title, description) {
  return {
    _id: stripDraftPrefix(sourceDocument._id),
    _type: 'product',
    title,
    slug: {
      _type: 'slug',
      current: slugify(title),
    },
    category: CATEGORY,
    description,
    mainImage: sourceDocument.mainImage,
    images: sourceDocument.images || [],
    priceINR: sourceDocument.priceINR,
    priceNPR: sourceDocument.priceNPR,
    stock: sourceDocument.stock,
    sizes: sourceDocument.sizes || [],
    colors: sourceDocument.colors || [],
    inStock: sourceDocument.inStock,
    featured: sourceDocument.featured,
    publishedAt: sourceDocument.publishedAt,
  };
}

async function publishProductFromDraft(draftDocument, title, description) {
  await client.createOrReplace(buildPublishedDocument(draftDocument, title, description));
  await client.delete(draftDocument._id);
}

async function renameProducts() {
  const renameList = loadRenameList();
  const products = await fetchProductsByCategory();

  if (renameList.length === 0) {
    console.log(`No valid rename entries found in ${LIST_PATH}`);
    return;
  }

  console.log(`Loaded ${renameList.length} rename entries from the list.`);

  for (const entry of renameList) {
    const lookupTitles = isRollback ? [entry.newTitle, entry.currentTitle] : [entry.currentTitle, entry.newTitle];
    const targetTitle = isRollback ? entry.currentTitle : entry.newTitle;
    const targetDescription = isRollback ? buildOriginalDescription(entry.currentTitle) : entry.description;
    const matches = products.filter((product) => lookupTitles.includes(product.title));

    if (matches.length === 0) {
      console.log(`No product found for: ${lookupTitles[0]}`);
      continue;
    }

    if (matches.length > 1) {
      console.log(`Multiple products found for ${lookupTitles[0]}; updating every matching T-Shirt document.`);
    }

    const groups = new Map();
    for (const product of matches) {
      const baseId = stripDraftPrefix(product._id);

      if (!groups.has(baseId)) {
        groups.set(baseId, { published: null, draft: null });
      }

      const group = groups.get(baseId);
      if (isDraftId(product._id)) {
        group.draft = product;
      } else {
        group.published = product;
      }
    }

    for (const [baseId, group] of groups.entries()) {
      try {
        if (group.published) {
          await updateProduct(group.published._id, targetTitle, targetDescription);
        }

        if (group.draft) {
          if (group.published) {
            await client.delete(group.draft._id);
          } else {
            await publishProductFromDraft(group.draft, targetTitle, targetDescription);
          }
        }

        if (!group.published && !group.draft) {
          console.log(`No publishable document found for base id: ${baseId}`);
        }
      } catch (error) {
        console.error(`Failed to update ${baseId}:`, error.message);
      }
    }

    if (isRollback) {
      console.log(`Restored: ${entry.newTitle} -> ${entry.currentTitle}`);
    } else {
      console.log(`Renamed: ${entry.currentTitle} -> ${entry.newTitle}`);
    }
  }

  console.log(isRollback ? '\nT-shirt rename rollback complete!' : '\nT-shirt rename migration complete!');
}

renameProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});