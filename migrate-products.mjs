import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sanity client
const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'a4f3nfat',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const COLLECTION_PATH = path.join(__dirname, 'src', 'assets', 'Collection');

// Parse filename to extract product info
// Format: "S.N. {name} ({back or front}) ({price in INR} , {price in NPR}).png"
function parseFilename(filename) {
  const cleanName = filename.replace(/\.\.(png|jpg|jpeg|webp)$/i, '');
  
  // Regex to match: S.N. Name (back/front) (priceINR , priceNPR)
  const rx = /^(\d+)\.\s*(.+?)\s*\((front|back|Front|Back)\)\s*\(([^,]+)\s*,\s*([^)]+)\)/i;
  const m = cleanName.match(rx);
  
  if (m) {
    return {
      serial: m[1],
      name: m[2].trim(),
      variant: m[3].toLowerCase(),
      priceINR: parseFloat(m[4].trim()),
      priceNPR: parseFloat(m[5].trim()),
      hasPrice: true
    };
  }
  
  // Fallback for files without prices (like side views)
  const fallbackRx = /^(\d+)\.\s*(.+?)\s*\(([^)]+)\)/i;
  const fm = cleanName.match(fallbackRx);
  if (fm) {
    return {
      serial: fm[1],
      name: fm[2].trim(),
      variant: fm[3].toLowerCase(),
      priceINR: null,
      priceNPR: null,
      hasPrice: false
    };
  }
  
  return null;
}

// Upload image to Sanity
async function uploadImage(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename,
    });
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      }
    };
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

// Process all products
async function migrateProducts() {
  const categories = ['T-Shirts', 'Hoodies', 'Pants'];
  const products = {}; // Group by product name

  // Scan all categories
  for (const category of categories) {
    const categoryPath = path.join(COLLECTION_PATH, category);
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`Category folder not found: ${categoryPath}`);
      continue;
    }
    
    const files = fs.readdirSync(categoryPath).filter(f => 
      /\.(png|jpg|jpeg|webp)$/i.test(f)
    );
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const info = parseFilename(file);
      
      if (!info) {
        console.log(`Could not parse: ${file}`);
        continue;
      }
      
      const productKey = `${category}:${info.name}`;
      
      if (!products[productKey]) {
        products[productKey] = {
          title: info.name,
          category: category,
          priceINR: info.hasPrice ? info.priceINR : 0,
          priceNPR: info.hasPrice ? info.priceNPR : 0,
          mainImage: null,
          images: [],
          inStock: true,
          description: `${info.name} - Premium quality ${category.toLowerCase()} from Faisan Kaka.`,
        };
      }
      
      // Upload image
      console.log(`Uploading ${file}...`);
      const imageAsset = await uploadImage(filePath);
      
      if (imageAsset) {
        if (info.variant === 'front') {
          products[productKey].mainImage = imageAsset;
        } else if (info.variant === 'back') {
          products[productKey].images.push(imageAsset);
        } else {
          // Side or other views - add to images array
          products[productKey].images.push(imageAsset);
        }
        
        // Use first available image as main if no front
        if (!products[productKey].mainImage && products[productKey].images.length > 0) {
          products[productKey].mainImage = products[productKey].images[0];
          products[productKey].images = products[productKey].images.slice(1);
        }
      }
    }
  }
  
  // Create or update products in Sanity
  console.log('\nCreating products...\n');
  
  for (const [key, product] of Object.entries(products)) {
    if (!product.mainImage && product.images.length === 0) {
      console.log(`Skipping ${product.title} - no images`);
      continue;
    }
    
    const slug = product.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const doc = {
      _type: 'product',
      title: product.title,
      slug: { _type: 'slug', current: slug },
      category: product.category,
      description: product.description,
      priceINR: product.priceINR,
      priceNPR: product.priceNPR,
      mainImage: product.mainImage,
      images: product.images,
      inStock: true,
      featured: false,
    };
    
    try {
      // Check if product exists
      const existing = await client.fetch(`*[_type == "product" && slug.current == $slug][0]`, { slug });
      
      if (existing) {
        // Update existing
        const updated = await client.patch(existing._id).set(doc).commit();
        console.log(`Updated: ${product.title}`);
      } else {
        // Create new
        const created = await client.create(doc);
        console.log(`Created: ${product.title}`);
      }
    } catch (error) {
      console.error(`Failed to save ${product.title}:`, error.message);
    }
  }
  
  console.log('\nMigration complete!');
}

// Run migration
migrateProducts().catch(console.error);
