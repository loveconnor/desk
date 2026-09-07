# Connor Love — Experience

An interactive 3D desk portfolio with a macOS-style desktop, résumé, projects, and music. Built with Vite, React, TypeScript, and Three.js for **desk.connorlove.com**.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. For the desktop only, open `/desktop.html`.

## Build

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host. On Vercel, select the Vite preset.

## Edit

- `src/desktop/profile.ts` — personal details and links
- `src/desktop/Notes.tsx` — notes and projects
- `src/desktop/data/work-playlist.json` — playlist
- `src/Application/World/PersonalDesk.ts` — desk, chair, and mouse
- `public/resume/` — résumé PDF, LaTeX source, and preview image

The browser app loads the live portfolio inside the desktop window. Its address bar and home button navigate that embedded page.

Deploy the portfolio project's `next.config.js` header change alongside this app: replace `X-Frame-Options: SAMEORIGIN` with `Content-Security-Policy: frame-ancestors 'self' https://experience.connorlove.com https://desk.connorlove.com http://localhost:5173 http://127.0.0.1:5173 http://localhost:4173 http://127.0.0.1:4173`. Both the 3D page and the nested desktop must be permitted as frame ancestors. Other hosts need to be explicitly added before they can embed the portfolio.

## Check

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
```
