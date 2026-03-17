# Faisan Kaka

Faisan Kaka is a React storefront for a fashion brand, built with Vite and backed by Sanity CMS. It includes the customer-facing site, product and order schemas, and the Sanity Studio used to manage catalog content.

## What It Includes

- Homepage, collections, product details, checkout, print studio, order tracking, and policy pages
- Product data fetched from Sanity with GROQ queries
- Local cart persistence and INR or NPR currency handling
- Animated transitions, smooth scrolling, and responsive layouts
- Sanity Studio mounted at `/studio` for content editing
- Product migration tooling for importing local collection assets into Sanity

## Technologies Used

### Frontend

- React 19 for the UI layer
- React DOM 19 for app rendering
- React Router DOM 7 for client-side routing
- Vite 7 for development and production builds
- ES modules across app and tooling code

### Styling and Interaction

- Tailwind CSS 4 for utility-first styling
- Custom CSS for component-specific presentation
- Framer Motion for transitions and animated UI states
- Lenis for smooth scrolling
- Lucide React for icons
- Colord for print studio color parsing and normalization

### CMS and Data

- Sanity for content management
- @sanity/client for frontend data fetching
- @sanity/cli for Studio workflows
- @sanity/vision for GROQ query testing
- GROQ for querying products and related content

### State, Testing, and Tooling

- React Context API for cart, currency, and print state
- Local Storage for cart and currency persistence
- Vitest, Testing Library, and JSDOM for tests
- ESLint 9 for linting
- Concurrently for running app and Studio together
- Vercel rewrite support for SPA deployment

## Project Structure

```text
.
├── public/
├── sanity/
│   └── schemaTypes/
├── src/
│   ├── Components/
│   ├── Pages/
│   ├── assets/
│   ├── lib/
│   ├── App.jsx
│   ├── homePage.jsx
│   ├── index.css
│   └── main.jsx
├── migrate-products.mjs
├── sanity.config.ts
├── vite.config.js
└── vercel.json
```

## Main Routes

- `/`
- `/collections`
- `/product/:slug`
- `/checkout`
- `/print`
- `/track-order`
- `/shipping-returns`
- `/sizing-guide`
- `/terms-of-service`
- `/studio/*`

## Sanity Setup

The CMS layer includes:

- `product` schema for title, slug, category, description, images, INR and NPR pricing, stock, sizes, colors, featured flag, and publish date
- `order` schema for customer details, cart items, payment fields, fulfillment status, tracking, and internal notes
- Sanity Studio configured with `structureTool()` and `visionTool()`

## Environment Variables

Create `.env.local` in the project root:

```env
VITE_SANITY_PROJECT_ID=a4f3nfat
VITE_SANITY_DATASET=production
SANITY_STUDIO_PROJECT_ID=a4f3nfat
SANITY_STUDIO_DATASET=production
SANITY_API_TOKEN=your_token_if_running_migration_scripts
```

`SANITY_API_TOKEN` is only needed for authenticated write operations such as migration uploads.

## Getting Started

```bash
npm install
npm run dev
```

### Useful Scripts

```bash
npm run dev          # Frontend
npm run studio       # Sanity Studio
npm run dev:all      # Frontend + Studio
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Lint
npm run test         # Tests
npm run studio:build # Build Sanity Studio
```

## Notes

- The storefront reads live product data from Sanity through `src/lib/sanityClient.js`.
- Cart, currency, and print customization state are mounted from providers in `src/main.jsx`.
- The order tracking page currently uses a mock async flow and has a clear backend integration point for later.
- `migrate-products.mjs` can import collection assets from `src/assets/Collection` into Sanity.

## Additional Docs

- `QUICK_START.md`
- `SANITY_SETUP_GUIDE.md`
- `DATA_MIGRATION_GUIDE.md`
- `INTEGRATION_SUMMARY.md`
