// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPages = process.env["GITHUB_PAGES"] === "true";

function publicBase(): string {
  const fromEnv = process.env["VITE_BASE_PATH"];
  if (fromEnv) {
    return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  }
  // GitHub Pages project site: https://user.github.io/Joy_and_Sid_Wedding_Invitation/
  if (isGitHubPages && process.env["GITHUB_REPOSITORY"]) {
    const repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
    if (repo) return `/${repo}/`;
  }
  return "/";
}

export default defineConfig({
  vite: {
    base: publicBase(),
  },
  // GitHub Pages is static-only. SPA mode prerenders a hydrateable shell so the
  // client bundle does not throw "Invariant failed" on a hand-written HTML file.
  // Local/Lovable deploys keep full SSR + Nitro.
  nitro: isGitHubPages ? false : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isGitHubPages
      ? {
          spa: {
            enabled: true,
            prerender: {
              // Emit a real index.html shell into the static output.
              outputPath: "/index",
              crawlLinks: false,
              retryCount: 0,
            },
          },
        }
      : {}),
  },
});
