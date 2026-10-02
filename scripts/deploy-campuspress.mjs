import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadPages } from "./pages.mjs";

const root = process.cwd();
const { config, pages } = await loadPages(root);

const baseUrl = (process.env.CAMPUSPRESS_BASE_URL || config.baseUrl || "").replace(/\/+$/, "");
const username = process.env.CAMPUSPRESS_USERNAME;
const appPassword = process.env.CAMPUSPRESS_APP_PASSWORD;
const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

if (!baseUrl) {
  throw new Error("Set CAMPUSPRESS_BASE_URL or add baseUrl to campuspress.json");
}

if (pages.length === 0) {
  console.log("No HTML pages found in content/; nothing to deploy.");
  process.exit(0);
}

if (!dryRun && (!username || !appPassword)) {
  throw new Error("Set CAMPUSPRESS_USERNAME and CAMPUSPRESS_APP_PASSWORD (application password)");
}

const auth = dryRun ? "" : "Basic " + Buffer.from(`${username}:${appPassword}`).toString("base64");
const endpoint = `${baseUrl}/wp-json/wp/v2/pages`;

for (const page of pages) {
  const content = await readFile(path.join(root, page.source), "utf8");
  const slug = `draft-${page.slug}`;

  if (dryRun) {
    console.log(`[dry-run] sync ${slug}  <-  ${page.source} (${content.length} bytes, draft only)`);
    continue;
  }

  const lookup = await fetch(`${endpoint}?context=edit&status=any&slug=${encodeURIComponent(slug)}`, {
    headers: { Authorization: auth },
  });
  if (!lookup.ok) {
    throw new Error(`Cannot look up ${slug}: ${lookup.status} ${lookup.statusText}`);
  }
  const matches = await lookup.json();
  if (!Array.isArray(matches) || matches.length > 1 || matches.some((item) => item.slug !== slug)) {
    throw new Error(`Ambiguous WordPress result for ${slug}; refusing to write`);
  }
  const existing = matches[0];
  if (existing && existing.status !== "draft") {
    throw new Error(`Refusing to update ${slug}: WordPress reports status ${existing.status}`);
  }
  if (existing) {
    const current = await fetch(`${endpoint}/${existing.id}?context=edit`, {
      headers: { Authorization: auth },
    });
    if (!current.ok) {
      throw new Error(`Cannot verify ${slug}: ${current.status} ${current.statusText}`);
    }
    const pageNow = await current.json();
    if (pageNow.id !== existing.id || pageNow.slug !== slug || pageNow.status !== "draft") {
      throw new Error(`Refusing to update ${slug}: it is no longer the expected draft`);
    }
  }

  // Throttle to avoid WordPress API rate limits
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await wait(2500);

  // WordPress does not make the draft check and content update atomic.
  const pageTitle = "\u00a0";

  const res = await fetch(existing ? `${endpoint}/${existing.id}` : endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(existing ? { content, title: pageTitle } : { content, slug, title: pageTitle, status: "draft" }),
  });

  if (!res.ok) {
    throw new Error(`Failed to sync ${slug}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.status !== "draft" || json.slug !== slug) {
    throw new Error(`WordPress did not preserve draft status and slug for ${slug} (ID ${json.id})`);
  }
  console.log(`${existing ? "updated" : "created"} draft ${slug} (ID ${json.id}) from ${page.source}`);
}
