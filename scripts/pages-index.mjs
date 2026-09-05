/**
 * After a GitHub Pages SPA build, ensure 404.html exists for client routes.
 * Prefers dist/client (SPA / nitro:false) over leftover .output/public.
 *
 * Usage: node scripts/pages-index.mjs
 */
import { copyFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function publicBase() {
  const fromEnv = process.env["VITE_BASE_PATH"];
  if (fromEnv) return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  if (process.env["GITHUB_PAGES"] === "true" && process.env["GITHUB_REPOSITORY"]) {
    const repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
    if (repo) return `/${repo}/`;
  }
  return "/";
}

function pickPublicDir() {
  const ranked = [
    join(process.cwd(), "dist", "client"),
    join(process.cwd(), ".output", "public"),
    join(process.cwd(), "dist"),
  ];
  // Prefer a directory that already has a TanStack SPA shell (contains $_TSR).
  for (const dir of ranked) {
    const indexPath = join(dir, "index.html");
    if (existsSync(indexPath)) return dir;
  }
  return ranked.find((dir) => existsSync(dir));
}

const publicDir = pickPublicDir();
if (!publicDir) {
  console.error("No static output directory found (dist/client or .output/public).");
  process.exit(1);
}

const indexPath = join(publicDir, "index.html");
const shellPath = join(publicDir, "_shell.html");
const fourOhFourPath = join(publicDir, "404.html");

if (existsSync(indexPath)) {
  copyFileSync(indexPath, fourOhFourPath);
  console.log(`Using SPA shell in ${publicDir}; wrote 404.html`);
  process.exit(0);
}

if (existsSync(shellPath)) {
  copyFileSync(shellPath, indexPath);
  copyFileSync(shellPath, fourOhFourPath);
  console.log(`Copied _shell.html → index.html + 404.html in ${publicDir}`);
  process.exit(0);
}

const assetsDir = join(publicDir, "assets");
if (!existsSync(assetsDir)) {
  console.error(`Missing assets in ${publicDir}`);
  process.exit(1);
}

const files = readdirSync(assetsDir);
const indexJs = files.find((f) => /^index-.*\.js$/.test(f));
const stylesCss = files.find((f) => /^styles-.*\.css$/.test(f));
const sealWebp = files.find((f) => /^wax-seal-.*\.webp$/.test(f));
const publicFavicon = existsSync(join(publicDir, "favicon.webp"))
  ? `${publicBase()}favicon.webp`
  : null;

if (!indexJs || !stylesCss) {
  console.error("No SPA shell and could not find hashed assets.", { indexJs, stylesCss });
  process.exit(1);
}

const base = publicBase();
const iconHref =
  publicFavicon ||
  (sealWebp ? `${base}assets/${sealWebp}` : `${base}favicon.ico`);
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Joy &amp; Sid — Wedding Invitation</title>
    <base href="${base}" />
    <link rel="icon" href="${iconHref}" type="image/webp" />
    <link rel="apple-touch-icon" href="${iconHref}" />
    <link rel="stylesheet" crossorigin href="${base}assets/${stylesCss}" />
  </head>
  <body>
    <script type="module" crossorigin src="${base}assets/${indexJs}"></script>
  </body>
</html>
`;

writeFileSync(indexPath, html);
writeFileSync(fourOhFourPath, html);
console.log(`Wrote fallback index.html + 404.html in ${publicDir} (base=${base})`);
