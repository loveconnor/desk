# Connor Love — Interactive Portfolio

A standalone **Vite + React + TypeScript + Three.js** recreation of the retro-computer experience at yoshik-pc.vercel.app, personalized for Connor Love. Builds to ordinary static files. No ChatGPT Sites tooling or hosting dependency.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Press **START**, then click to approach the desk. Move the pointer over the screen to zoom into the interactive desktop. The sound and free-camera controls appear in the top-left overlay. Double-click desktop icons or single-click dock icons to launch apps.

`/desktop.html` opens the desktop directly and provides a usable mobile / non-WebGL alternative.

## Production

```sh
npm run build
npm run preview
```

Deploy the contents of `dist/` to a static host. With Vercel, use the Vite preset, `npm run build`, and output directory `dist`. Both `/` and `/desktop.html` are real build entries; no SPA rewrite is required. All scene assets, wallpaper, font, icons, and project images are served locally. External portfolio, social, and scheduling links open in new tabs. The contact form opens a prefilled email draft in the visitor's mail client.

The deployment domain for this project is `experience.connorlove.com`. The browser app displays the actual `https://www.connorlove.com` site inside an iframe. The main portfolio must deploy its updated `Content-Security-Policy: frame-ancestors` header allowing `https://experience.connorlove.com` and the local Vite preview (`http://localhost:5173`). The matching change is prepared in `../Standalone Projects/portfolio/next.config.js`; until deployed, the live main site still sends `X-Frame-Options: SAMEORIGIN`, which blocks embedding. This project has not been deployed and does not change the existing main website.

## Personalization

- `src/desktop/profile.ts`: contact details, social links, skills, project cards.
- `src/desktop/main.tsx`: desktop applications and biography.
- `src/desktop/style.css`: Ubuntu desktop styling and responsive layout.
- `src/Application/UI/components/InfoOverlay.tsx`: name and role over the 3D scene.
- `src/Application/UI/components/LoadingScreen.tsx`: BIOS startup text.
- `src/Application/Camera/CameraKeyframes.ts`: camera framing and motion.
- `public/connor/`: personal images and locally served font.

The macOS-style desktop adapts the MIT-licensed [MacOS-Web-Simulator](https://github.com/LikhithSP/MacOS-Web-Simulator) visual conventions and assets. Styling is in `src/desktop/macos.css`; attribution is in `NOTICE.md`.

The desktop includes draggable/resizable windows, minimize/maximize/close, app search, functional calculator, terminal commands, contact draft, project links, audio player, wallpaper persistence, brightness settings, and keyboard-dismissible lock screen.

## Checks

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Browser tests run against the production preview on port 4173. The 3D renderer retains its upstream Three.js version to preserve its material/color behavior. See `NOTICE.md` and `licenses/` for source attribution.
