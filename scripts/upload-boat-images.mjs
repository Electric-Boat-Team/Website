import { readFile, readdir } from "node:fs/promises";

const { baseUrl } = JSON.parse(await readFile("campuspress.json", "utf8"));
const username = process.env.CAMPUSPRESS_USERNAME;
const password = process.env.CAMPUSPRESS_APP_PASSWORD;
if (!username || !password) throw new Error("Missing CampusPress credentials");
const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const api = `${baseUrl}/wp-json/wp/v2`;

async function get(url) {
  const r = await fetch(url, { headers: { Authorization: authorization } });
  if (!r.ok) throw new Error(`GET ${url}: ${r.status}`);
  return r.json();
}

async function post(url, body, contentType = "application/json") {
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": contentType },
    body,
  });
  if (!r.ok) throw new Error(`POST ${url}: ${r.status}`);
  return r.json();
}


const images = [
  { file: "boat-action.jpg", slug: "twebt-hydroplane-action", alt: "Electric hydroplane on the water" },
  { file: "boat-side.jpg", slug: "twebt-boat-side", alt: "Boat side view" },
  { file: "boat-stern.jpg", slug: "twebt-boat-stern", alt: "Boat stern view" },
];

for (const img of images) {
  const matches = await get(`${api}/media?context=edit&slug=${img.slug}`);
  if (matches.length) {
    console.log(`Skipping ${img.slug}: already exists (ID ${matches[0].id})`);
    continue;
  }
  try {
    const buffer = await readFile(`public/assets/${img.file}`);
    const result = await fetch(`${api}/media`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${img.slug}.jpg"`,
      },
      body: buffer,
    });
    if (!result.ok) throw new Error(`Upload ${img.file} failed: ${result.status}`);
    const media = await result.json();
    console.log(`${img.slug}: ${media.source_url} (ID ${media.id})`);
  } catch (e) {
    console.log(`${img.file}: error - ${e.message}`);
  }
}