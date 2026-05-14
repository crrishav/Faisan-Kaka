Setup guide: UploadThing (quick) — temporary bachelor showcase

1) Create an UploadThing account and app
   - Sign in at https://uploadthing.com and create a new project.
   - Create an upload endpoint or obtain a public upload URL/SDK for simple file POSTs.

2) (Optional) Create a listing endpoint
   - If UploadThing provides a listing API for your files, note the list URL (returns JSON array).

3) Add environment variables to your Vite env (.env.local)
   - VITE_UPLOADTHING_UPLOAD_URL=https://your-upload-endpoint
   - VITE_UPLOADTHING_LIST_URL=https://your-listing-endpoint
   - VITE_UPLOADTHING_API_KEY=your_api_key_if_required

Notes on security
  - This setup intentionally uses a public or project-scoped API key in the frontend for a temporary demo.
  - Do NOT use the same keys in production; instead implement a server-side signed upload or webhook.

How the app uses these variables
  - When a customer checks out, the order JSON is saved to localStorage and (if configured) uploaded
    as a JSON file to `VITE_UPLOADTHING_UPLOAD_URL` using `multipart/form-data`.
  - The admin page will attempt to GET `VITE_UPLOADTHING_LIST_URL` to show uploaded orders. If
    that is not configured or fails, it falls back to reading locally saved orders from the browser.

Development
  - After adding `.env.local`, restart Vite and open the admin page (`/admin`) in your browser.
  - Place some orders via checkout and then open the admin to see them load.

If you want, I can also scaffold a tiny serverless route to proxy uploads securely.
