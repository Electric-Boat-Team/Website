import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadPages } from "../scripts/pages.mjs";

test("content files have no h1 or has-large-font-size", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const { pages } = await loadPages(root);
  for (const page of pages) {
    const html = await readFile(new URL(`../${page.source}`, import.meta.url), "utf8");
    if (html.match(/has-large-font-size|<h1\b/)) {
      throw new Error(`${page.source} contains h1 or has-large-font-size`);
    }
  }
});