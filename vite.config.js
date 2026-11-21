import { defineConfig } from "vite";

// På GitHub Pages ligger sidan under /trakt-sajt-v2/ (repots namn).
// Lokalt (npm run dev) ligger den som vanligt direkt under /.
// (npm run preview visar den byggda sidan precis som på GitHub.)
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/trakt-sajt-v2/" : "/",
}));
