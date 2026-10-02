import { readFile } from "node:fs/promises";

const { baseUrl } = JSON.parse(await readFile("campuspress.json", "utf8"));
const username = process.env.CAMPUSPRESS_USERNAME;
const password = process.env.CAMPUSPRESS_APP_PASSWORD;
if (!username || !password) throw new Error("Missing CampusPress credentials");

const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const api = `${baseUrl}/wp-json/wp/v2`;

async function jsonRequest(route, method = "GET", body) {
  const response = await fetch(`${api}${route}`, {
    method,
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${route} failed: ${response.status}`);
  return response.json();
}

const images = [
  { file: "hydrofoil-reference.jpg", slug: "twebt-hydrofoil-reference", alt: "Hydrofoil reference craft sailing over the water" },
  { file: "hull-infusion.jpg", slug: "twebt-hull-infusion", alt: "Composite catamaran hull during fabrication" },
  { file: "catamaran-concept.jpg", slug: "twebt-catamaran-concept", alt: "Concept rendering of a catamaran hull" },
  { file: "hull-on-shore.jpg", slug: "twebt-hull-on-shore", alt: "Catamaran hull resting on shore" },
];

for (const image of process.env.TEMPLATES_ONLY ? [] : images) {
  const matches = await jsonRequest(`/media?context=edit&slug=${image.slug}`);
  if (!Array.isArray(matches) || matches.length > 1) throw new Error(`Ambiguous media match for ${image.slug}`);
  let media = matches[0];
  if (!media) {
    const response = await fetch(`${api}/media`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${image.slug}.jpg"`,
      },
      body: await readFile(`public/assets/${image.file}`),
    });
    if (!response.ok) throw new Error(`Upload ${image.file} failed: ${response.status}`);
    media = await response.json();
  }
  if (media.slug !== image.slug) throw new Error(`Unexpected media slug for ${image.file}: ${media.slug}`);
  await jsonRequest(`/media/${media.id}`, "POST", { alt_text: image.alt });
  console.log(`${image.slug}: ${media.source_url} (ID ${media.id})`);
}

for (const id of [57, 58, 59, 60]) {
  const page = await jsonRequest(`/pages/${id}?context=edit`);
  if (page.status !== "draft") throw new Error(`Page ${id} is not a draft; template unchanged`);
  if (page.template === "page-full-width.php") {
    console.log(`Page ${id}: already full-width`);
    continue;
  }
  await jsonRequest(`/pages/${id}`, "POST", { template: "page-full-width.php" });
  const updated = await jsonRequest(`/pages/${id}?context=edit`);
  if (updated.template !== "page-full-width.php" || updated.status !== "draft") {
    throw new Error(`Page ${id} did not keep the full-width draft template`);
  }
  console.log(`Page ${id}: full-width template confirmed`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
