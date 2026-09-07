# Connor Love — Experience

An interactive 3D desk portfolio with a macOS-style desktop, résumé, projects, and music. Built with Vite, React, TypeScript, and Three.js for **experience.connorlove.com**.

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

The browser app embeds `connorlove.com`; that site's headers must allow embedding from `experience.connorlove.com`.

## Check

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
```
