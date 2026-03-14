# 🚀 Faisan Kaka - Sanity.io Integration Quick Start

## Your Setup Status ✅

| Component | Status | Location |
|-----------|--------|----------|
| **Project ID** | ✅ Configured | `a4f3nfat` |
| **Environment Variables** | ✅ Ready | `.env.local` |
| **Sanity Schema** | ✅ Generated | `sanity/schemaTypes/product.js` |
| **Sanity Config** | ✅ Created | `sanity/sanity.config.ts` |
| **Client Setup** | ✅ Ready | `src/lib/sanityClient.js` |
| **Dependencies** | ⏳ Installing | `npm install` (in background) |

---

## 🎯 Next Steps (In Order)

### 1️⃣ Wait for Dependencies (5-10 minutes)
```bash
# Monitor in terminal - watch for "added X packages" message
npm install
```

**Check when complete:**
```bash
npm list sanity
# Should show: sanity@3.45.0
```

---

### 2️⃣ Start Sanity Studio
Once `npm install` completes:
```bash
npm run studio
```

**Expected output:**
```
⠙  Initializing config...
✓ Listening on http://localhost:3333/studio
```

**Visit:** http://localhost:3333/studio (opens in browser)

---

### 3️⃣ Add Your First Product

In Sanity Studio:

1. **Click "Products"** in left sidebar (should be empty)
2. **Click "+ Create"** button
3. **Fill in fields:**
   - **Title:** "Classic Tee"
   - **Category:** "T-Shirts" (dropdown)
   - **Price INR:** 499
   - **Price NPR:** 600
   - **Main Image:** Upload from `src/assets/Collection/T-Shirts/`
4. **Click "Publish"** button

✅ **Your first product is live!**

---

### 4️⃣ Test GROQ Query

Still in Sanity Studio:

1. **Click "Vision"** tab (bottom or in Tools)
2. **Copy this query:**
```groq
*[_type == "product"] {
  title,
  category,
  priceINR,
  priceNPR
}
```
3. **Click Play/Execute** button
4. **Should see your product data** ✅

---

### 5️⃣ Add Remaining Products

Repeat Step 3 for each product:

**From your files:**
- `src/assets/Collection/T-Shirts/` → All products to Sanity
- `src/assets/Collection/Hoodies/` → All products to Sanity
- `src/assets/Collection/Pants/` → All products to Sanity

**Helpful spreadsheet to track:**
```
Product | Category | INR Price | NPR Price | Status
--------|----------|-----------|-----------|--------
Classic Tee | T-Shirts | 499 | 600 | ✅ Done
...
```

---

### 6️⃣ Update React Components

When ready to switch from local files to Sanity:

```bash
# Backup originals
cp src/Components/useProducts.jsx src/Components/useProducts.BACKUP.jsx
cp src/Components/productSection.jsx src/Components/productSection.BACKUP.jsx

# Apply new versions
cp src/Components/useProducts.NEW.jsx src/Components/useProducts.jsx
cp src/Components/productSection.NEW.jsx src/Components/productSection.jsx

# Remove temp files
rm src/Components/useProducts.NEW.jsx src/Components/productSection.NEW.jsx
```

---

### 7️⃣ Run Your App

In a **new terminal** (keep studio running):
```bash
npm run dev
```

**Visit:** http://localhost:5173

**Check:**
- ✅ Products load (should be from Sanity now)
- ✅ Images display correctly
- ✅ Prices show correct INR/NPR
- ✅ Category filtering works
- ✅ No errors in console

---

## 🎪 Run Everything at Once

If you want both running simultaneously (one terminal):
```bash
npm run dev:all
```

This requires `concurrently` package. To install:
```bash
npm install --save-dev concurrently
```

---

## 📁 File Structure Reference

```
Faisan Kaka/
├── sanity/                    # Your CMS Studio
│   ├── schemaTypes/
│   │   ├── product.js         # ✅ Product schema
│   │   └── index.js           # ✅ Schema exports
│   ├── sanity.config.ts       # ✅ Studio config
│   └── ...
│
├── src/
│   ├── lib/
│   │   └── sanityClient.js    # ✅ Fetch queries
│   ├── Components/
│   │   ├── useProducts.jsx    # → Replace with .NEW version
│   │   ├── productSection.jsx # → Replace with .NEW version
│   │   └── productCard.jsx    # ✅ No changes needed
│   └── ...
│
├── .env.local                 # ✅ Config (a4f3nfat)
├── package.json               # ✅ Scripts updated
├── SANITY_SETUP_GUIDE.md      # 📖 Detailed setup
└── DATA_MIGRATION_GUIDE.md    # 📖 Step-by-step migration
```

---

## 🆘 Troubleshooting

### npm install stuck?
```bash
# Check status
npm list sanity

# Force clear cache if needed
npm cache clean --force
npm install
```

### Studio won't start?
```bash
# Verify config
cat .env.local
# Should show: SANITY_STUDIO_PROJECT_ID=a4f3nfat

# Try again
npm run studio
```

### Products not showing in React?
1. Check console for errors
2. Verify products published in Sanity
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check Vision tool queries work

### Images broken?
1. Ensure images uploaded to Sanity (not local)
2. Check URL starts with `https://cdn.sanity.io`
3. Try URL directly in browser

---

## 📚 Cheat Sheet - Common Commands

```bash
# Start Sanity Studio (add products here)
npm run studio

# Run React app (view products here)
npm run dev

# Run both simultaneously (needs concurrently)
npm run dev:all

# Build for production
npm run build

# Check for lint errors
npm lint

# Preview production build
npm run preview
```

---

## 🎨 What Happens Next?

1. **Products live in Sanity** ✅
2. **React app fetches from Sanity** → Your site is a true headless CMS setup
3. **You can invite your partner** to Sanity to edit products
4. **Changes publish instantly** → No más código deployments for product changes
5. **Super scalable** → Easy to add categories, variants, inventory later

---

## 📞 Resources

- 📖 **Your Guides:**
  - `SANITY_SETUP_GUIDE.md` - Complete setup details
  - `DATA_MIGRATION_GUIDE.md` - Step-by-step migration

- 🌐 **Sanity Docs:**
  - https://www.sanity.io/docs/getting-started
  - https://www.sanity.io/docs/groq
  - https://www.sanity.io/docs/sanity-client

- 💬 **Need Help:**
  - Check Sanity GitHub discussions
  - Sanity community Slack

---

## ✨ Pro Tips

✅ **Hotshot Productivity:**
- Use Sanity's portable text field for rich product descriptions
- Add custom validation rules to prevent data entry mistakes
- Create content hooks for your partner to organize work

✅ **Performance:**
- Sanity CDN automatically caches images
- GROQ queries are super efficient
- Consider adding real-time subscriptions for inventory

✅ **Team Collaboration:**
- Share Sanity project with your partner
- They manage content, you manage code (perfect separation!)
- Built-in version history for all changes

---

**Happy coding! 🚀 Your Sanity journey starts now!**
