# Weekly invoice

Static Astro site. Phone-first form that builds the weekly invoice text and copies it to the clipboard. No backend, no database; his name, locations and rates are remembered in the browser (localStorage).

## Run locally

    npm install
    npm run dev        # http://localhost:4321 (also on your LAN, so you can open it on a phone)

## Deploy (Netlify)

Push to a git repo and import it in Netlify. `netlify.toml` already sets the build command and publish dir (`dist`). Or: `npm run build` and drag `dist/` into Netlify.

## Password

Set `PUBLIC_INVOICE_PASSWORD` (see `.env.example`). Default is `invoice`. It is checked in the browser and is visible in the shipped JS, so treat it as a courtesy gate only.

## Where things are

- `src/pages/index.astro` markup
- `src/styles/global.css` all styling (dark theme, mobile first)
- `src/scripts/app.js` form state, maths, invoice text, copy
