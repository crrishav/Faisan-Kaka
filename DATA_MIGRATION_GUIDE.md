# 📊 Sanity.io Data Migration - Complete Step-by-Step Guide

## Your Project ID: `a4f3nfat`

This guide walks you through migrating from your current file-based product system to Sanity CMS.

---

## PHASE 1: Setup & Configuration ✅

### Step 1: Verify Environment Variables
Your `.env.local` is already configured:
```env
SANITY_STUDIO_PROJECT_ID=a4f3nfat
SANITY_STUDIO_DATASET=production
VITE_SANITY_PROJECT_ID=a4f3nfat
VITE_SANITY_DATASET=production
```

### Step 2: Install Dependencies (In Progress)
The following packages are being installed:
- `sanity` - Core CMS framework
- `@sanity/client` - Fetch API for React
- `@sanity/vision` - GROQ query testing tool
- `@sanity/cli` - Command-line tools

Wait for: `npm install` to complete in your terminal.

### Step 3: Verify Schema Files
✅ These files are ready:
- `sanity/schemaTypes/product.js` - Product schema with defineType/defineField
- `sanity/schemaTypes/index.js` - Schema exports
- `sanity/sanity.config.ts` - Studio configuration
- `src/lib/sanityClient.js` - GROQ queries for React

---

## PHASE 2: Launch Sanity Studio & Add Products

### Step 4: Start Sanity Studio
Once npm install completes, run:
```bash
npm run studio
```

This opens Sanity Studio at: **http://localhost:3333/studio**

You should see:
- ✅ Your Sanity project loaded
- ✅ "Products" section in the left sidebar
- ✅ A "+ Create" button to add new products

### Step 5: Manually Add Your Products to Sanity

For each product in your current collection, you'll create an entry in Sanity:

#### Example: Adding "Classic Tee (T-Shirt)"

**Action:** Click **Products → Create**

**Fill in these fields:**

| Field | Value | Notes |
|-------|-------|-------|
| **Title** | Classic Tee | Product name (usually from filename) |
| **Slug** | classic-tee | Auto-generated from title |
| **Category** | T-Shirts | Select from dropdown |
| **Description** | (Optional) | Brief description |
| **Main Image** | (Upload) | Primary product image (front view recommended) |
| **Additional Images** | (Upload) | Back view, lifestyle shots, detail shots |
| **Price (INR)** | 499 | Extract from current filename |
| **Price (NPR)** | 600 | Extract from current filename |
| **Sizes** | S, M, L, XL | Check available sizes |
| **Colors** | Black, White | List available colors |
| **In Stock** | ✓ Checked | Toggle availability |
| **Featured** | (optional) | Check to show on homepage |

**Action:** Click **Publish**

---

## PHASE 3: Extract Data from Your Current Files

### Your Current Product Structure
Products are stored as image files with naming convention:
```
filename format: "ProductName (variant) (priceINR, priceNPR).ext"
```

#### Example Files to Migrate

**T-Shirts** (`/src/assets/Collection/T-Shirts/`):
- `1. Classic Tee (front) (499, 600).png` → Title: "Classic Tee", Price: INR 499 / NPR 600
- `2. Retro Logo (back) (599, 750).jpg` → Title: "Retro Logo", Price: INR 599 / NPR 750

**Hoodies** (`/src/assets/Collection/Hoodies/`):
- `1. Comfort Hoodie (front) (1299, 1500).png`
- `2. Street Vibes (back) (1399, 1600).jpg`

**Pants** (`/src/assets/Collection/Pants/`):
- `1. Classic Chino (front) (899, 1200).png`
- `2. Cargo Pants (back) (999, 1400).jpg`

### How to Extract Data Efficiently

1. **Open your assets folder:** `src/assets/Collection/`
2. **For each category (T-Shirts, Hoodies, Pants):**
   - List all product filenames
   - Extract: Title, Price (INR), Price (NPR), Images
   - Upload images to Sanity
   - Create product entries

**Pro tip:** Create a simple spreadsheet to track what you've uploaded:
```
| Title | Category | File | INR Price | NPR Price | Images | Status |
|-------|----------|------|-----------|-----------|--------|--------|
| Classic Tee | T-Shirts | 1. Classic Tee (front) (499, 600).png | 499 | 600 | uploaded | ✓ Complete |
```

---

## PHASE 4: Test Sanity Queries

### Step 6: Use Vision Tool to Test GROQ Queries

In Sanity Studio:
1. Go to **Vision** tab (bottom of left sidebar)
2. Try these queries to verify your data:

**Query 1: Get all products**
```groq
*[_type == "product"] {
  title,
  category,
  priceINR,
  priceNPR
}
```

**Query 2: Get T-Shirts category**
```groq
*[_type == "product" && category == "T-Shirts"] {
  title,
  priceINR,
  mainImage {
    asset -> {
      url
    }
  }
}
```

**Query 3: Get featured products**
```groq
*[_type == "product" && featured == true] {
  title,
  category,
  mainImage {
    asset -> {
      url
    }
  }
}
```

If queries return your data, you're ready for the next phase! ✅

---

## PHASE 5: Update React Components

### Step 7: Replace Your Hooks

I've prepared updated component files in your project:

**File: `src/Components/useProducts.NEW.jsx`**
- ✅ Fetches from Sanity instead of local files
- ✅ Handles loading & error states
- ✅ Transforms Sanity data to match current component structure
- ✅ Drop-in replacement

**To apply:**
1. Backup current: `cp src/Components/useProducts.jsx src/Components/useProducts.BACKUP.jsx`
2. Replace: `cp src/Components/useProducts.NEW.jsx src/Components/useProducts.jsx`
3. Delete temp file: `rm src/Components/useProducts.NEW.jsx`

**File: `src/Components/productSection.NEW.jsx`**
- ✅ Handles loading states with spinner message
- ✅ Shows error messages
- ✅ Shows "no products" message
- ✅ Uses updated useProducts hook
- ✅ Uses `_id` as key (more reliable from Sanity)

**To apply:**
1. Backup current: `cp src/Components/productSection.jsx src/Components/productSection.BACKUP.jsx`
2. Replace: `cp src/Components/productSection.NEW.jsx src/Components/productSection.jsx`
3. Delete temp file: `rm src/Components/productSection.NEW.jsx`

### Step 8: Verify ProductCard Compatibility

Your current `productCard.jsx` should work without changes. It expects:
- `title` ✅ (from Sanity: `product.title`)
- `price` ✅ (formatted in productSection)
- `frontImage` ✅ (from Sanity: `mainImage.asset.url`)
- `backImage` ✅ (from Sanity: `images[0].asset.url`)
- `slug` ✅ (from Sanity: `slug.current`)

**No changes needed!** ✅

---

## PHASE 6: Switch from Local Assets to Sanity

### Step 9: Test with Sanity Data Active

1. **Run your app:**
```bash
npm run dev
```

2. **Check browser console** for any errors related to Sanity fetching

3. **Verify products display** with correct:
   - ✅ Images from Sanity CDN (not local files)
   - ✅ Prices (INR/NPR)
   - ✅ Product titles
   - ✅ Category filtering (T-Shirts, Hoodies, Pants)

### Step 10: Optional - Remove Local Asset Files

Once everything works perfectly with Sanity:
```bash
# Remove old image files (after verified with Sanity)
rm -r src/assets/Collection
```

**⚠️ Only delete if:**
- ✅ All products are in Sanity
- ✅ Images are visible in your app
- ✅ Tests pass
- ✅ You have a backup

---

## PHASE 7: Advanced - Sync with Product Details Page

### Step 11: Update productDetailsPage.jsx

Your product details page might also fetch products. Update it:

```javascript
import { getProductBySlug } from '../lib/sanityClient';

const ProductDetailsPage = ({ slug }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    };
    loadProduct();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h1>{product.title}</h1>
      <img src={product.mainImage.asset.url} alt={product.title} />
      <p>₹{product.priceINR} / ₨{product.priceNPR}</p>
      <p>{product.description}</p>
    </div>
  );
};
```

---

## 🎯 Checklist - Migration Progress

- [ ] Project ID verified (`a4f3nfat`)
- [ ] Environment variables set in `.env.local`
- [ ] Dependencies installed (`npm install` complete)
- [ ] Sanity Studio launched (`npm run studio`)
- [ ] First product added to Sanity
- [ ] All T-Shirts added to Sanity
- [ ] All Hoodies added to Sanity
- [ ] All Pants added to Sanity
- [ ] GROQ queries tested in Vision tool
- [ ] `useProducts.jsx` updated (replaced with .NEW version)
- [ ] `productSection.jsx` updated (replaced with .NEW version)
- [ ] `npm run dev` started successfully
- [ ] Products visible in browser
- [ ] Images loading from Sanity CDN
- [ ] Prices correct (INR/NPR formatting works)
- [ ] Category filtering works
- [ ] Local assets removed (optional)

---

## 🚀 Running in Production

### Before Going Live

1. **Set environment variables** on your hosting:
   - `VITE_SANITY_PROJECT_ID=a4f3nfat`
   - `VITE_SANITY_DATASET=production`

2. **Test in production with same environment variables**

3. **Enable CORS** in Sanity dashboard (usually auto-enabled for public datasets)

4. **Enable CDN** in sanityClient.js for faster image delivery (already configured with `useCdn: true`)

---

## ⚠️ Troubleshooting

### Products not loading?
**Check:**
1. Project ID correct in `.env.local`? → `a4f3nfat`
2. Products published in Sanity Studio?
3. Network tab shows requests to `cdn.sanity.io`?
4. Console shows GROQ errors? → Check query in Vision tool

### Images broken?
**Check:**
1. Images uploaded to Sanity (not local)?
2. Image URLs start with `https://cdn.sanity.io`?
3. Try direct URL in browser

### Old useProducts hook still running?
**Check:**
1. Did you properly replace the file? (Not just creating new)
2. Reload browser: `Ctrl+Shift+R` (hard refresh)
3. Check file timestamp: `ls -l src/Components/useProducts.jsx`

---

## 📞 When Sanity Studio is Ready

Once you've added products to Sanity, you can:
- ✅ Invite your **partner** to edit products
- ✅ Give them login access to Sanity
- ✅ They make changes → Live on your site instantly (with real-time preview)
- ✅ No more deploying code to change products!

---

## 🎨 Next Steps After Migration

1. **Set up webhooks** - Auto-rebuild site when products change
2. **Add inventory tracking** - Real-time stock management
3. **Create variants** - Extend schema for sizes/colors as distinct SKUs
4. **Add analytics** - Track which products are viewed most
5. **Setup SEO** - Optimize meta tags for each product

---

**Questions? Check:**
- Sanity Docs: https://www.sanity.io/docs
- GROQ Guide: https://www.sanity.io/docs/groq
- Your setup guide: `SANITY_SETUP_GUIDE.md`

**You've got this! 🚀**
