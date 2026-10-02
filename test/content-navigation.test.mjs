import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadPages } from "../scripts/pages.mjs";

test("every page links to every other page", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const { pages } = await loadPages(root);
  assert.deepEqual(new Set(pages.map((page) => page.slug)), new Set([
    "home", "team-overview", "sponsors", "about", "join-the-team",
  ]));

  for (const page of pages) {
    const html = await readFile(new URL(`../${page.source}`, import.meta.url), "utf8");
    for (const target of pages) {
      assert.ok(html.includes(`href="https://electricboat.umd.edu${target.route}"`),
        `${page.source} does not link to ${target.route}`);
    }
    assert.doesNotMatch(html, /has-large-font-size|<h1\b/, page.source);
  }
});
