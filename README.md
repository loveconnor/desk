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

The browser app uses a native iframe for connorlove.com and Connor's project sites. Shortcuts open HonestUI and Tokenizer in the same desktop window. The address bar accepts HTTPS connorlove.com subdomains, honestui.com, and project names. There is no search engine or remote browser backend; the site deploys as static files again.

Embedded sites must permit this site's origin in their framing headers, including both the outer room and nested desktop origin. Add any new deployment or development origin to the portfolio's CSP `frame-ancestors` policy if needed. Project shortcuts live in `src/desktop/Browser.tsx`. Clove Colors currently sends `frame-ancestors 'none'` and `X-Frame-Options: DENY`, so it is not included as a shortcut until that project permits embedding.

## Check

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm run test:browser
```
