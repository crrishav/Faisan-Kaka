# 🎨 Faisan Kaka Sanity.io Integration Guide

## ✅ COMPLETED: Steps 1 & 2

### Step 1: Project Setup
Your Sanity Studio folder structure has been created:
```
sanity/
├── schemaTypes/
│   ├── product.js      (✅ Created)
│   └── index.js        (✅ Created)
├── sanity.config.ts    (✅ Created)
└── package.json        (✅ Updated with studio scripts)
```

### Step 2: Schema Design
**Product Schema** (`sanity/schemaTypes/product.js`) includes:

**Core Fields:**
- `title` (string, required) - Product name
- `slug` (auto-generated from title) - URL identifier
- `category` (dropdown) - T-Shirts, Hoodies, Pants
- `description` (text, 500 chars) - Product details
- `mainImage` (image, required) - Primary product photo
- `images` (image array) - Gallery photos

**Pricing Fields:**
- `priceINR` (number, required) - Indian Rupee price
- `priceNPR` (number, required) - Nepalese Rupee price

**Metadata Fields:**
- `sizes` (array) - XS to XXL
- `colors` (array) - Available colors
- `inStock` (boolean) - Availability toggle
- `featured` (boolean) - Homepage feature flag
- `publishedAt` (datetime) - Publication timestamp

**Smart Features:**
- Image hotspot support for better cropping
- Validation rules on all critical fields
- Visual preview in studio (title + category + image)

---

## 📋 NEXT STEPS

### Step 3: Sanity Project Creation & Configuration

#### 3.1 Create Your Sanity Project
1. Go to **https://sanity.io**
2. Sign up / Log in
3. Create a new project:
   - Project name: `Faisan Kaka`
   - Deployment region: Your preference
   - API access level: Public (to fetch from React)
4. **Copy your Project ID** from the dashboard

#### 3.2 Update Environment Variables
Edit `.env.local` and add your Project ID:
```env
SANITY_STUDIO_PROJECT_ID=your_actual_project_id
VITE_SANITY_PROJECT_ID=your_actual_project_id
```

#### 3.3 Install Dependencies (if not already done)
```bash
npm install --save-dev @sanity/vision sanity
npm install --save @sanity/client
```

#### 3.4 Update .gitignore
Add these lines to your `.gitignore`:
```
.env.local
.env*.local
sanity/dist
node_modules
dist
```

---

### Step 4: Configuration (READY - Review Below)

Your **sanity.config.ts** is pre-configured with:
- ✅ Schema integration (your product schema)
- ✅ Structure tool (content organization)
- ✅ Vision tool (GROQ query testing)
- ✅ Custom preview display
- ✅ Disabled unpublish action (content safety)

**The config is optimized for your team** - your partner can manage products directly in the studio UI.

---

### Step 5: Client Setup (READY - Review Below)

Your **src/lib/sanityClient.js** includes:

**Pre-built GROQ queries:**
- `getProductsByCategory(category)` - Fetch products by category
- `getProductBySlug(slug)` - Get single product details
- `getFeaturedProducts()` - Get featured items
- `getCategories()` - Get all categories
- `subscribeToProducts()` - Real-time updates (optional)

**Example usage in your React components:**
```javascript
import { getProductsByCategory } from '@/lib/sanityClient';

const products = await getProductsByCategory('T-Shirts');
```

---

## 🚀 Running Your Project

### Option 1: Run App Only
```bash
npm run dev    # Starts on http://localhost:5173
```

### Option 2: Run App + Studio
```bash
npm run studio  # Starts Sanity Studio on http://localhost:3333/studio
npm run dev     # Starts React app (in separate terminal)
```

### Option 3: Run Both Simultaneously
```bash
npm run dev:all  # Runs both with concurrently package
```

---

## 📊 Data Migration Plan (Step 5)

### Current State
Products defined in filename format:
```
1. Classic Tee (front) (499, 600).png
```

### Target State
Products stored in Sanity CMS, fetched via GROQ queries.

### Migration Steps

#### 5.1 Add Your Products to Sanity Studio
1. Start the studio: `npm run studio`
2. Navigate to **Products** section
3. Click **Create** and fill in:
   - Title: `Classic Tee`
   - Category: `T-Shirts`
   - Main Image: upload from your assets folder
   - Price INR: `499`
   - Price NPR: `600`
   - Sizes: Select available sizes
   - Colors: Add colors
4. Click **Publish**

**Repeat for all products in your:**
- `/src/assets/Collection/T-Shirts/`
- `/src/assets/Collection/Hoodies/`
- `/src/assets/Collection/Pants/`

#### 5.2 Update useProducts.jsx Hook
Replace the current file-reading logic with Sanity queries:

```javascript
import { useEffect, useState } from 'react';
import { getProductsByCategory } from '../lib/sanityClient';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const tshirts = await getProductsByCategory('T-Shirts');
        const hoodies = await getProductsByCategory('Hoodies');
        const pants = await getProductsByCategory('Pants');
        
        setProducts([...tshirts, ...hoodies, ...pants]);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
};

export default useProducts;
```

#### 5.3 Update ProductSection Component
Update to handle loading state:

```javascript
const ProductSection = ({ title }) => {
  const { products, loading } = useProducts();
  const categoryProducts = products.filter(p => p.category === title);

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="product-grid">
      {categoryProducts.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
```

#### 5.4 Update ProductCard Component
Update to use Sanity image URLs:

```javascript
const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img 
        src={product.mainImage.asset.url} 
        alt={product.title}
        className="w-full h-60 object-cover"
      />
      <h3>{product.title}</h3>
      <p className="price">₹{product.priceINR} / ₨{product.priceNPR}</p>
      {/* ... rest of card */}
    </div>
  );
};
```

---

## 🔐 Security Notes

✅ **Public read access** - Your React app can fetch without authentication
❌ **Protected write access** - Only authenticated users can edit in Sanity Studio
🔑 **CORS** - Sanity CDN automatically handles cross-origin requests

---

## 📦 File Structure Summary

```
Faisan Kaka/
├── sanity/                 # CMS Studio
│   ├── schemaTypes/
│   │   ├── product.js      # ✅ Product schema
│   │   └── index.js        # ✅ Schema export
│   ├── sanity.config.ts    # ✅ Studio config
│   └── ...
├── src/
│   ├── lib/
│   │   └── sanityClient.js # ✅ Fetch queries
│   ├── Components/
│   │   ├── useProducts.jsx # ← Needs update (Step 5.2)
│   │   ├── productSection.jsx
│   │   └── productCard.jsx # ← Needs update (Step 5.4)
│   └── ...
├── .env.local              # ✅ Environment vars
├── package.json            # ✅ Updated scripts
└── sanity.json            # ✅ Studio config
```

---

## 🎯 Quick Checklist

- [ ] Create Sanity project & get Project ID
- [ ] Update `.env.local` with Project ID
- [ ] Run `npm install` to get dependencies
- [ ] Start studio: `npm run studio`
- [ ] Add your products in Sanity
- [ ] Test GROQ queries in Vision tool
- [ ] Update `useProducts.jsx` to fetch from Sanity
- [ ] Update `productCard.jsx` for Sanity image URLs
- [ ] Test React app with live data

---

## 🛠️ Troubleshooting

**Studio won't start?**
- Check Project ID is correct in `.env.local`
- Run: `npm install sanity @sanity/cli @sanity/vision --save-dev`

**Images not loading?**
- Confirm images are uploaded to Sanity (not local files)
- Test URL directly: `https://cdn.sanity.io/images/{projectId}/{dataset}/{imageId}`

**GROQ queries failing?**
- Use Vision tool in studio to test queries
- Check field names match your schema exactly
- Ensure `slug.current` is generated for products

**Type errors?**
- Install types: `npm install --save-dev @types/sanity`

---

## 📚 Helpful Resources

- [Sanity Docs](https://www.sanity.io/docs)
- [GROQ Cheatsheet](https://www.sanity.io/docs/groq)
- [React Client Guide](https://www.sanity.io/docs/sanity-client)
- [Vision Tool Guide](https://www.sanity.io/docs/vision)

---

**Ready? Let's build something awesome! 🚀**
