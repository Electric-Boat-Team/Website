import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadPages } from "./pages.mjs";

const root = process.cwd();
const outDir = path.join(root, "dist");
const { pages } = await loadPages(root);
const previewRoutes = new Set(pages.map((page) => page.route));

const escapeHtml = (v) =>
  String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

if (existsSync(outDir)) await rm(outDir, { recursive: true, force: true });

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;line-height:1.5}
a{color:inherit}
img{max-width:100%;height:auto}
</style>
</head>
<body>
{{CONTENT}}
</body>
</html>`;

for (const page of pages) {
  const fragment = await readFile(path.join(root, page.source), "utf8");
  const html = shell.replace("{{CONTENT}}", fragment)
    .replace(/href=(['"])(https:\/\/electricboat\.umd\.edu(?:\/[^'"\s]*)?)\1/gi, (match, quote, href) => {
      const url = new URL(href);
      const route = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/$/, "")}/`;
      return !url.search && previewRoutes.has(route) ? `href=${quote}${route}${url.hash}${quote}` : match;
    });

  const destDir = page.route === "/" ? outDir : path.join(outDir, page.route);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, "index.html"), html);
  console.log(`built ${page.source} -> ${path.relative(root, path.join(destDir, "index.html"))}`);
}