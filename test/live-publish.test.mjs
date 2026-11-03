import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../scripts/publish-campuspress.mjs', import.meta.url));

test('updates only selected published pages and rejects identity mismatches before writing', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'boat-live-'));
  let mismatch = false;
  const writes = [];
  const server = createServer(async (req, res) => {
    const id = Number(req.url.match(/pages\/(\d+)/)?.[1]);
    const record = { id, slug: id === 8 ? 'front' : (mismatch ? 'wrong' : 'sponsors'), status: 'publish' };
    res.setHeader('content-type', 'application/json');
    if (req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      writes.push({ id, body: JSON.parse(body) });
    }
    res.end(JSON.stringify(record));
  });
  try {
    await mkdir(path.join(root, 'content'));
    await writeFile(path.join(root, 'content/home.html'), '<p>Home</p>');
    await writeFile(path.join(root, 'content/sponsors.html'), '<p>Sponsors</p>');
    await writeFile(path.join(root, 'campuspress.json'), JSON.stringify({ livePages: { home: { id: 8, slug: 'front' }, sponsors: { id: 59, slug: 'sponsors' } } }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const run = () => new Promise(resolve => {
      const child = spawn(process.execPath, [script], { cwd: root, env: { ...process.env, CAMPUSPRESS_BASE_URL: `http://127.0.0.1:${server.address().port}`, CAMPUSPRESS_USERNAME: 'user', CAMPUSPRESS_APP_PASSWORD: 'pass', CAMPUSPRESS_PAGES: 'home,sponsors' } });
      child.stderr.resume(); child.on('close', resolve);
    });
    mismatch = true; assert.notEqual(await run(), 0); assert.equal(writes.length, 0);
    mismatch = false; assert.equal(await run(), 0);
    assert.deepEqual(writes, [{ id: 8, body: { content: '<p>Home</p>' } }, { id: 59, body: { content: '<p>Sponsors</p>' } }]);
  } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});
