import { inject } from "@vercel/analytics";

// The 3D monitor embeds the desktop; only count top-level page visits.
if (window.self === window.top) {
  inject({ mode: import.meta.env.PROD ? "production" : "development" });
}
