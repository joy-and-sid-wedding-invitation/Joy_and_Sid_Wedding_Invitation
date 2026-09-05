/**
 * TanStack Start + Nitro emit hashed assets under .output/public/assets
 * but no index.html (SSR is handled by the worker). GitHub Pages needs a
 * static entry — write index.html + 404.html that load the client bundle.
 *
 * Usage: node scripts/pages-index.mjs
 * Expects GITHUB_REPOSITORY (owner/name) or VITE_BASE_PATH for the base href.
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), ".output", "public");
const assetsDir = join(publicDir, "assets");

if (!existsSync(assetsDir)) {
  console.error("Missing .output/public/assets — run npm run build first.");
  process.exit(1);
}

const files = readdirSync(assetsDir);
const indexJs = files.find((f) => /^index-.*\.js$/.test(f));
const stylesCss = files.find((f) => /^styles-.*\.css$/.test(f));

if (!indexJs || !stylesCss) {
  console.error("Could not find index-*.js or styles-*.css in assets.", {
    indexJs,
    stylesCss,
  });
  process.exit(1);
}

function publicBase() {
  const fromEnv = process.env["VITE_BASE_PATH"];
  if (fromEnv) return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  if (process.env["GITHUB_PAGES"] === "true" && process.env["GITHUB_REPOSITORY"]) {
    const repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
    if (repo) return `/${repo}/`;
  }
  return "/";
}

const base = publicBase();
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Joy &amp; Sid — Wedding Invitation</title>
    <meta
      name="description"
      content="The wedding invitation of Joy &amp; Sid. Chiang Mai, 9 January 2027."
    />
    <base href="${base}" />
    <link rel="icon" href="${base}favicon.ico" />
    <link rel="stylesheet" crossorigin href="${base}assets/${stylesCss}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="${base}assets/${indexJs}"></script>
  </body>
</html>
`;

writeFileSync(join(publicDir, "index.html"), html);
writeFileSync(join(publicDir, "404.html"), html);
console.log(`Wrote index.html + 404.html (base=${base}, js=${indexJs}, css=${stylesCss})`);
