import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist");

const config = JSON.parse(await readFile(path.join(root, "campuspress.json"), "utf8"));
const template = await readFile(path.join(root, "site/template.html"), "utf8");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const relPrefix = (route) => {
  const depth = route.split("/").filter(Boolean).length;
  return depth === 0 ? "./" : "../".repeat(depth);
};

const renderNav = (pages, current, prefix) =>
  pages
    .map((page) => {
      const href = prefix + (page.route === "/" ? "" : page.route.replace(/^\//, ""));
      const current_ = page === current ? ' aria-current="page"' : "";
      return `      <a href="${href}"${current_}>${escapeHtml(page.nav ?? page.title)}</a>`;
    })
    .join("\n");

if (existsSync(outDir)) {
  await rm(outDir, { recursive: true, force: true });
}

for (const page of config.pages) {
  const fragment = await readFile(path.join(root, page.source), "utf8");
  const prefix = relPrefix(page.route);

  const html = template
    .replaceAll("{{title}}", escapeHtml(page.title))
    .replaceAll("{{description}}", escapeHtml(page.description ?? ""))
    .replaceAll("{{base}}", prefix)
    .replaceAll("{{nav}}", renderNav(config.pages, page, prefix))
    .replaceAll("{{content}}", fragment)
    .replaceAll("{{year}}", String(new Date().getFullYear()));

  const destDir = page.route === "/" ? outDir : path.join(outDir, page.route);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, "index.html"), html);
  console.log(`built ${page.source} -> ${path.relative(root, path.join(destDir, "index.html"))}`);
}

await cp(path.join(root, "site/styles.css"), path.join(outDir, "styles.css"));
await cp(path.join(root, "public/assets"), path.join(outDir, "assets"), { recursive: true });
console.log("copied site/styles.css and public/assets/");
