import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadPages } from "./pages.mjs";

const root = process.cwd();
const outDir = path.join(root, "dist");
// CampusPress drafts now use the full-width template, matching the published home page.
const themeUrl = "https://electricboat.umd.edu/";

const { pages } = await loadPages(root);
const response = await fetch(themeUrl);
if (!response.ok) {
  throw new Error(`Cannot load CampusPress theme from ${themeUrl}: ${response.status}`);
}
const theme = await response.text();
const previewRoutes = new Set(pages.map((page) => page.route));
const articleStart = theme.indexOf("<article ");
const articleEnd = theme.indexOf("</article>", articleStart) + "</article>".length;
const shellEndTag = "</div><!-- #page .hfeed .site -->";
const shellEnd = theme.indexOf(shellEndTag, articleEnd) + shellEndTag.length;
const umdHeaderScript = theme.match(/<script src="https:\/\/umd-header\.umd\.edu\/build\/bundle\.js\?[^" ]+"><\/script>/)?.[0];
if (articleStart < 0 || articleEnd < "</article>".length || shellEnd < shellEndTag.length) {
  throw new Error(`CampusPress changed its page markup at ${themeUrl}`);
}
if (!umdHeaderScript) {
  throw new Error(`CampusPress no longer includes the UMD header script at ${themeUrl}`);
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

if (existsSync(outDir)) {
  await rm(outDir, { recursive: true, force: true });
}

for (const page of pages) {
  const fragment = await readFile(path.join(root, page.source), "utf8");
  const head = theme.slice(0, articleStart)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)} | Terrapin Works Electric Boat Team</title>`)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b[^>]*rel=['"](?:canonical|alternate|EditURI)['"][^>]*>/gi, "")
    .replace(/<link\b[^>]*id=['"](?:admin-bar-css|dashicons-css)['"][^>]*>/gi, "")
    .replace(/<link\b[^>]*id=['"]superheros-carrois-gothic-css['"][^>]*>/gi, "")
    .replace(/<style id=['"]admin-bar-inline-css['"][\s\S]*?<\/style>/gi, "")
    .replace(/<meta name=['"]robots['"][^>]*>/gi, "")
    .replace("</head>", '<meta name="robots" content="noindex,nofollow">\n</head>')
    .replace("admin-bar no-customize-support ", "")
    .replace(/ current_page_item/g, "")
    .replace(/ aria-current="page"/g, "");
  const article = `<article class="page type-page status-draft hentry">
    <header class="entry-header"><h1 class="entry-title">${escapeHtml(page.title)}</h1></header>
    <div class="entry-content">${fragment}</div>
  </article>`;
  const html = (head + article + theme.slice(articleEnd, shellEnd) + `\n${umdHeaderScript}\n</body>\n</html>\n`)
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
