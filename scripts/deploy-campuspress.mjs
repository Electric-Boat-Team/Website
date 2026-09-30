import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "campuspress.json"), "utf8"));

const baseUrl = (process.env.CAMPUSPRESS_BASE_URL || config.baseUrl || "").replace(/\/+$/, "");
const username = process.env.CAMPUSPRESS_USERNAME;
const appPassword = process.env.CAMPUSPRESS_APP_PASSWORD;
const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");
const draftOnly = process.env.CAMPUSPRESS_DRAFT_ONLY !== "false";

if (!baseUrl) {
  throw new Error("Set CAMPUSPRESS_BASE_URL or add baseUrl to campuspress.json");
}

const pages = config.pages.filter((page) => page.wordpressId);

if (pages.length === 0) {
  console.log("No pages have a wordpressId set; nothing to deploy.");
  process.exit(0);
}

if (!dryRun && (!username || !appPassword)) {
  throw new Error("Set CAMPUSPRESS_USERNAME and CAMPUSPRESS_APP_PASSWORD (application password)");
}

const auth = "Basic " + Buffer.from(`${username}:${appPassword}`).toString("base64");

for (const page of pages) {
  const content = await readFile(path.join(root, page.source), "utf8");
  const url = `${baseUrl}/wp-json/wp/v2/pages/${page.wordpressId}`;

  if (dryRun) {
    console.log(`[dry-run] POST ${url}  <-  ${page.source} (${content.length} bytes, draft-only: ${draftOnly})`);
    continue;
  }

  if (draftOnly) {
    const current = await fetch(`${url}?context=edit`, {
      headers: { Authorization: auth },
    });
    if (!current.ok) {
      throw new Error(`Cannot verify page ${page.wordpressId} is a draft: ${current.status} ${current.statusText}`);
    }
    const existing = await current.json();
    if (existing.id !== page.wordpressId || existing.status !== "draft") {
      throw new Error(`Refusing to update page ${page.wordpressId}: WordPress reports status ${existing.status} for ID ${existing.id}`);
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    console.error(`FAILED ${page.source} -> page ${page.wordpressId}: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exitCode = 1;
    continue;
  }

  const json = await res.json();
  console.log(`updated page ${page.wordpressId} from ${page.source} (modified ${json.modified})`);
}
