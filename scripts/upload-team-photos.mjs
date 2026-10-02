import { readFile } from "node:fs/promises";

const { baseUrl } = JSON.parse(await readFile("campuspress.json", "utf8"));
const username = process.env.CAMPUSPRESS_USERNAME;
const password = process.env.CAMPUSPRESS_APP_PASSWORD;
if (!username || !password) throw new Error("Missing CampusPress credentials");
const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const api = `${baseUrl}/wp-json/wp/v2`;

const photos = [
  { file: "team-meeting-1.jpg", slug: "twebt-team-meeting-1", alt: "Terrapin Works Electric Boat Team meeting" },
  { file: "team-meeting-2.jpg", slug: "twebt-team-meeting-2", alt: "The TWEBT team during a design session" },
  { file: "team-meeting-3.jpg", slug: "twebt-team-meeting-3", alt: "TWEBT students reviewing boat components" },
  { file: "team-bts-1.jpg", slug: "twebt-bts-meeting-1", alt: "Behind the scenes at the TWEBT September meeting" },
  { file: "team-bts-2.jpg", slug: "twebt-bts-meeting-2", alt: "Behind the scenes at TWEBT general meeting" },
  { file: "logo-team.png", slug: "twebt-logo-hires", alt: "Terrapin Works Electric Boat Team logo" },
  { file: "umd-logo.png", slug: "umd-logo", alt: "University of Maryland logo" },
];

for (const p of photos) {
  const matches = await (await fetch(`${api}/media?context=edit&slug=${p.slug}`, { headers: { Authorization: authorization } })).json();
  if (matches && matches.length) {
    console.log(`${p.slug}: already exists (ID ${matches[0].id}) — reusing`);
    continue;
  }
  const ext = p.file.split('.').pop();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  try {
    const buffer = await readFile(`public/assets/${p.file}`);
    const result = await fetch(`${api}/media`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${p.slug}.${ext}"`,
      },
      body: buffer,
    });
    if (!result.ok) throw new Error(`${result.status}`);
    const media = await result.json();
    console.log(`${p.slug}: ${media.source_url} (ID ${media.id})`);
  } catch (e) {
    console.log(`${p.file}: upload failed — ${e.message}`);
  }
}