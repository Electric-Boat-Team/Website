import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = (process.env.CAMPUSPRESS_BASE_URL || 'https://blog.umd.edu/electricboat').replace(/\/+$/, '');
const { CAMPUSPRESS_USERNAME: username, CAMPUSPRESS_APP_PASSWORD: password } = process.env;
if (!username || !password) throw new Error('CampusPress credentials are required');
const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
const publish = process.env.PUBLISH_APPROVED === 'true';
const plans = [
  { slug: 'home', title: 'Home', liveId: 8, draftId: 57, approvedHash: '65d5b574bb938d59c4916a43e8555975360f62d744edc7cb30f416d3ddb4d047' },
  { slug: 'join-the-team', title: 'Join the Team', liveId: 28, draftId: 100, approvedHash: '8dadaa2ce68979ba594be581501c81fc18520a46972f98dd71a2f55597493b8c' },
  { slug: 'team-overview', title: 'Team', draftId: 58, approvedHash: '1f4c6e4ab84d4a745e9099a371e7474fde31e6b18b530fbe147e5cb4a266c22e' },
  { slug: 'sponsors', title: 'Sponsors', draftId: 59, approvedHash: '1d341a4326c716aba644602c83b7ba150cc06f462281aa71ccde6fda4f9c73d1' },
  { slug: 'about', title: 'About', draftId: 60, approvedHash: '371d1a01bc3927c0afab4a0e7f60ac4326c345569a6fe8b949f2b7a7f687df1b' },
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
  if (draft.id !== plan.draftId || hash(draft.content.raw) !== plan.approvedHash) throw new Error(`Approved draft changed: ${plan.slug}`);
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
if (!Array.isArray(backup.menus) || backup.menus.length || !Array.isArray(backup['menu-items']) || backup['menu-items'].length || backup['menu-locations']?.primary?.menu !== 0) {
  throw new Error('Navigation differs from inspected empty primary menu; refusing to write');
}
const text = html => html.replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
for (const page of backup.pages) {
  const source = await readFile(`content/${page.slug}.html`, 'utf8');
  if (text(source) !== text(page.draft.content.raw)) throw new Error(`Draft wording differs from main: ${page.slug}`);
}

const published = [];
// Publish the new destinations before exposing links to them on the homepage.
for (const page of [...backup.pages].sort((a, b) => Number(Boolean(a.liveId)) - Number(Boolean(b.liveId)))) {
  const fresh = await request(`pages/${page.draftId}?context=edit`);
  if (fresh.status !== 'draft' || fresh.slug !== `draft-${page.slug}` || hash(fresh.content.raw) !== page.approvedHash) throw new Error(`Draft changed before publication: ${page.slug}`);
  if (page.liveId) {
    const liveNow = await request(`pages/${page.liveId}?context=edit`);
    if (liveNow.modified_gmt !== page.live.modified_gmt || liveNow.content.raw !== page.live.content.raw) throw new Error(`Live page changed: ${page.slug}`);
  }
  const result = await request(`pages/${page.liveId || page.draftId}`, {
    content: fresh.content.raw,
    title: fresh.title.raw,
    template: fresh.template,
    featured_media: fresh.featured_media,
    ...(page.liveId ? {} : { status: 'publish', slug: page.slug }),
  });
  backup.changes.push({ type: 'page', slug: page.slug, id: result.id, status: result.status, link: result.link });
  await save();
  if (result.status !== 'publish' || (!page.liveId && result.slug !== page.slug)) throw new Error(`Unexpected publication result: ${page.slug}`);
  const verified = await request(`pages/${result.id}?context=edit`);
  if (hash(verified.content.raw) !== page.approvedHash) throw new Error(`Content changed during publication: ${page.slug}`);
  published.push({ ...page, id: result.id });
  console.log(`Published ${page.slug}: ${result.id} ${result.link}`);
}
const menu = await request('menus', { name: 'Primary navigation' });
backup.changes.push({ type: 'menu', id: menu.id });
await save();
for (const [index, slug] of ['home', 'team-overview', 'sponsors', 'about', 'join-the-team'].entries()) {
  const page = published.find(page => page.slug === slug);
  const item = await request('menu-items', {
    title: page.title, status: 'publish', type: 'post_type', object: 'page', object_id: page.id,
    menus: menu.id, menu_order: index + 1,
  });
  backup.changes.push({ type: 'menu-item', id: item.id, page: page.id });
  await save();
}
await request(`menus/${menu.id}`, { locations: ['primary'] });
const location = await request('menu-locations/primary?context=edit');
if (location.menu !== menu.id) throw new Error('Primary menu assignment did not persist');
backup.completed = new Date().toISOString();
await save();
console.log('Published all five pages and assigned primary navigation.');
