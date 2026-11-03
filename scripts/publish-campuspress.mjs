import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPages } from './pages.mjs';

const { config, pages } = await loadPages(process.cwd());
const selected = (process.env.CAMPUSPRESS_PAGES || '').split(',').map(s => s.trim()).filter(Boolean);
if (!selected.length || new Set(selected).size !== selected.length) throw new Error('Specify unique page names in CAMPUSPRESS_PAGES.');
const targets = selected.map(slug => {
  const page = pages.find(p => p.slug === slug);
  const target = config.livePages?.[slug];
  if (!page || !target || !Number.isInteger(target.id) || !target.slug) throw new Error(`No configured live page for ${slug}`);
  return { ...page, ...target };
});
const baseUrl = (process.env.CAMPUSPRESS_BASE_URL || config.baseUrl || '').replace(/\/+$/, '');
const { CAMPUSPRESS_USERNAME: username, CAMPUSPRESS_APP_PASSWORD: password } = process.env;
if (!baseUrl || !username || !password) throw new Error('CampusPress URL and credentials are required.');
const endpoint = `${baseUrl}/wp-json/wp/v2/pages`;
const headers = { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') };

// Check every target before writing anything, and update content only.
for (const target of targets) {
  const res = await fetch(`${endpoint}/${target.id}?context=edit`, { headers });
  if (!res.ok) throw new Error(`Cannot inspect ${target.source}: HTTP ${res.status}`);
  const current = await res.json();
  if (current.id !== target.id || current.slug !== target.slug || current.status !== 'publish') {
    throw new Error(`Live page identity or status mismatch for ${target.source}; no pages updated.`);
  }
  target.content = await readFile(path.join(process.cwd(), target.source), 'utf8');
}
for (const target of targets) {
  const res = await fetch(`${endpoint}/${target.id}`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: target.content }),
  });
  if (!res.ok) throw new Error(`Failed to update ${target.source}: HTTP ${res.status}. Earlier pages may have been updated.`);
  const updated = await res.json();
  if (updated.id !== target.id || updated.slug !== target.slug || updated.status !== 'publish') {
    throw new Error(`Unexpected response after updating ${target.source}; check the live site.`);
  }
  console.log(`Updated published ${target.source} (page ${target.id})`);
}
