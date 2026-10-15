import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = (process.env.CAMPUSPRESS_BASE_URL || 'https://blog.umd.edu/electricboat').replace(/\/+$/, '');
const { CAMPUSPRESS_USERNAME: username, CAMPUSPRESS_APP_PASSWORD: password } = process.env;
if (!username || !password) throw new Error('CampusPress credentials are required');
const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
const publish = process.env.PUBLISH_APPROVED === 'true';
const plans = [
  { slug: 'home', title: 'Home', liveId: 8 },
  { slug: 'join-the-team', title: 'Join the Team', liveId: 28 },
  { slug: 'team-overview', title: 'Team' },
  { slug: 'sponsors', title: 'Sponsors' },
  { slug: 'about', title: 'About' },
];
const hash = text => createHash('sha256').update(text.trim().replaceAll('\r\n', '\n')).digest('hex');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let lastRequest = 0;
async function request(route, body) {
  await wait(Math.max(0, 3000 - (Date.now() - lastRequest)));
  lastRequest = Date.now();
  const res = await fetch(`${base}/wp-json/wp/v2/${route}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: auth, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`${route}: ${res.status} ${await res.text()}`);
  return res.json();
}

await mkdir('publication-backup', { recursive: true });
const backup = { base, mode: publish ? 'publish' : 'inspect', created: new Date().toISOString(), pages: [], changes: [] };
const save = () => writeFile('publication-backup/state.json', JSON.stringify(backup, null, 2));
for (const plan of plans) {
  const matches = await request(`pages?context=edit&status=any&slug=draft-${plan.slug}`);
  if (matches.length !== 1 || matches[0].slug !== `draft-${plan.slug}` || matches[0].status !== 'draft') {
    throw new Error(`Expected exactly one approved draft for ${plan.slug}`);
  }
  const draft = matches[0];
  const source = await readFile(`content/${plan.slug}.html`, 'utf8');
  const matchesSource = hash(source) === hash(draft.content.raw);
  const targets = plan.liveId ? [await request(`pages/${plan.liveId}?context=edit`)] : await request(`pages?context=edit&status=any&slug=${plan.slug}`);
  if (targets.length > 1) throw new Error(`Ambiguous publication target for ${plan.slug}`);
  console.log('Live target:', JSON.stringify(targets.map(page => ({ id: page.id, status: page.status, slug: page.slug, link: page.link }))));
  if (plan.liveId && (targets[0].status !== 'publish' || (plan.slug === 'home' ? !['/', `${new URL(base).pathname.replace(/\/$/, '')}/`].includes(new URL(targets[0].link).pathname) : targets[0].slug !== plan.slug))) {
    throw new Error(`Unexpected live page for ${plan.slug}`);
  }
  if (!plan.liveId && targets.length) throw new Error(`Clean slug already exists: ${plan.slug}; inspect before writing`);
  backup.pages.push({ ...plan, draft, live: targets[0] || null, matchesSource });
  await save();
  console.log(JSON.stringify({ slug: plan.slug, draftId: draft.id, liveId: targets[0]?.id, template: draft.template, bytes: draft.content.raw.length, matchesSource, draftTitle: draft.title.raw }));
}
for (const route of ['menus?context=edit&per_page=100', 'menu-locations?context=edit', 'menu-items?context=edit&per_page=100']) {
  try { backup[route.split('?')[0]] = await request(route); }
  catch (error) { backup[route.split('?')[0]] = { error: error.message }; }
}
await save();
console.log('Navigation:', JSON.stringify({ menus: backup.menus, locations: backup['menu-locations'], items: backup['menu-items'] }));
if (!publish) {
  console.log('Inspection only. No WordPress writes.');
  process.exit(0);
}
if (backup.pages.some(page => !page.matchesSource)) throw new Error('Approved drafts differ from checked-out main content; refusing to publish');
throw new Error('Publication writes require the inspected navigation plan');
