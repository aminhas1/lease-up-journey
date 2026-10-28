// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The app is published as static files under a single path on abeerminhas.com
// (see README). BASE_PATH is that path; dev and build both use it so links and
// assets resolve the same way everywhere.
export const BASE_PATH = "/harmony-review";

export default defineConfig({
  // Static output only: no server runtime, no Cloudflare worker.
  nitro: false,
  vite: { base: `${BASE_PATH}/` },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    router: { basepath: BASE_PATH },
    prerender: {
      enabled: true,
      crawlLinks: true,
      autoSubfolderIndex: true,
      // ?step=N links on the batch page all render the map's page; render it once.
      filter: (page: { path: string }) => !page.path.includes("?"),
    },
  },
});
