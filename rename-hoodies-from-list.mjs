import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env.local');

  if (!fs.existsSync(envPath)) return;

  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
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

const CATEGORIES = ['Hoodies', 'Hoodie'];
const LIST_PATH = path.join(__dirname, 'src', 'assets', 'hoodie_product_details.txt');
const isRollback = process.argv.includes('--rollback') || process.argv.includes('--undo');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseRenameLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const firstColonIndex = trimmed.indexOf(':');
  if (firstColonIndex === -1) return null;
  const currentTitle = trimmed.slice(0, firstColonIndex).trim();
  const rest = trimmed.slice(firstColonIndex + 1).trim();
  const descriptionMatch = rest.match(/\((.*)\)\s*$/);
  if (!currentTitle || !descriptionMatch) return null;
  const beforeDescription = rest.slice(0, descriptionMatch.index).trim();
  const secondOpenParenIndex = beforeDescription.lastIndexOf('(');
  const newTitle = secondOpenParenIndex === -1 ? beforeDescription : beforeDescription.slice(0, secondOpenParenIndex).trim();
  const description = descriptionMatch[1].trim();
  if (!newTitle || !description) return null;
  return { currentTitle, newTitle, description };
}

function buildOriginalDescription(currentTitle) {
  return `Hoodie ${currentTitle} - Premium quality hoodies from Faisan Kaka.`;
}

function stripDraftPrefix(documentId) {
  return documentId.startsWith('drafts.') ? documentId.slice('drafts.'.length) : documentId;
}

function isDraftId(documentId) {
  return documentId.startsWith('drafts.');
}

function loadRenameList() {
  if (!fs.existsSync(LIST_PATH)) throw new Error(`Rename list not found: ${LIST_PATH}`);
  return fs.readFileSync(LIST_PATH, 'utf8').split(/\r?\n/).map(parseRenameLine).filter(Boolean);
}

async function fetchProductsByCategory() {
  const products = await client.fetch(
    `*[_type == "product" && category in $categories] {
      _id,
      title,
      slug,
      description,
      mainImage,
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
    { categories: CATEGORIES }
  );
  return Array.isArray(products) ? products : [];
}

async function updateProduct(productId, title, description) {
  await client.patch(productId).set({
    title,
    slug: { _type: 'slug', current: slugify(title) },
    description,
  }).commit();
}

function buildPublishedDocument(sourceDocument, title, description) {
  return {
    _id: stripDraftPrefix(sourceDocument._id),
    _type: 'product',
    title,
    slug: { _type: 'slug', current: slugify(title) },
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

async function renameHoodies() {
  const renameList = loadRenameList();
  if (renameList.length === 0) {
    console.log(`No valid rename entries found in ${LIST_PATH}`);
    return;
  }

  const products = await fetchProductsByCategory();
  if (process.argv.includes('--list')) {
    console.log(`\nFound ${products.length} Hoodie products:`);
    for (const p of products) {
      console.log(`- id: ${p._id} | title: ${p.title} | slug: ${p.slug?.current || '<no-slug>'}`);
    }
    return;
  }
  if (process.argv.includes('--find')) {
    // search across all products (any category) for tokens from the rename list
    const allProducts = await client.fetch(`*[_type == "product"]{_id,title,slug,category}`);
    const lookupNormsAll = loadRenameList().map((e) => normalizeForMatch(e.currentTitle));
    const found = [];

    for (const p of allProducts) {
      const titleNorm = normalizeForMatch(p.title);
      const slugNorm = normalizeForMatch(p.slug?.current);
      for (const lt of lookupNormsAll) {
        if (!lt) continue;
        if (titleNorm === lt || titleNorm.includes(lt) || slugNorm.includes(lt)) {
          found.push({ _id: p._id, title: p.title, slug: p.slug?.current, category: p.category });
          break;
        }
      }
    }

    console.log(`\nFound ${found.length} products across all categories matching hoodie mapping tokens:`);
    for (const f of found) console.log(`- id: ${f._id} | title: ${f.title} | slug: ${f.slug || '<no-slug>'} | category: ${f.category}`);
    return;
  }
  console.log(`Loaded ${renameList.length} rename entries from the list.`);

  for (const entry of renameList) {
    const lookupTitles = isRollback ? [entry.newTitle, entry.currentTitle] : [entry.currentTitle, entry.newTitle];
    const targetTitle = isRollback ? entry.currentTitle : entry.newTitle;
    const targetDescription = isRollback ? buildOriginalDescription(entry.currentTitle) : entry.description;

    const lookupNorms = lookupTitles.map(normalizeForMatch);
    function matchesLookup(product) {
      const titleNorm = normalizeForMatch(product.title);
      const slugNorm = normalizeForMatch(product.slug?.current);

      for (const lt of lookupNorms) {
        if (!lt) continue;

        if (titleNorm === lt) return true;
        if (titleNorm.split(' ').includes(lt)) return true;
        if (titleNorm.includes(` ${lt} `)) return true;
        if (titleNorm.startsWith(`${lt} `) || titleNorm.endsWith(` ${lt}`)) return true;
        if (slugNorm && slugNorm.includes(lt)) return true;
      }

      return false;
    }

    const matches = products.filter(matchesLookup);

    if (matches.length === 0) {
      console.log(`No product found for: ${lookupTitles[0]}`);
      continue;
    }

    if (matches.length > 1) {
      console.log(`Multiple products found for ${lookupTitles[0]}; updating every matching Hoodie document.`);
    }

    const groups = new Map();
    for (const product of matches) {
      const baseId = stripDraftPrefix(product._id);
      if (!groups.has(baseId)) groups.set(baseId, { published: null, draft: null });
      const group = groups.get(baseId);
      if (isDraftId(product._id)) group.draft = product; else group.published = product;
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
      } catch (error) {
        console.error(`Failed to update ${baseId}:`, error.message);
      }
    }

    if (isRollback) console.log(`Restored: ${entry.newTitle} -> ${entry.currentTitle}`);
    else console.log(`Renamed: ${entry.currentTitle} -> ${entry.newTitle}`);
  }

  console.log(isRollback ? '\nHoodie rename rollback complete!' : '\nHoodie rename migration complete!');
}

renameHoodies().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
