import { access, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'standalone');
const assets = path.join(root, 'public/independent');
const destination = path.join(root, 'dist');
const pages = ['index.html', 'styles.css', 'script.js'];
const images = ['logo.png', 'workshop.jpg', 'workshop-detail.jpg', 'team.jpg', 'hull.jpg', 'rudder.jpg', 'foil.jpg', 'bow.jpg'];

// Validate inputs before replacing a previously successful build.
const required = [...pages.map(file => path.join(source, file)), ...images.map(file => path.join(assets, file))];
const missing = [];
for (const file of required) {
  try {
    await access(file);
  } catch {
    missing.push(path.relative(root, file));
  }
}
if (missing.length) {
  throw new Error(`Independent build is missing required files:\n${missing.join('\n')}\nPlace the supplied photographs and logo in public/independent/.`);
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of pages) {
  await cp(path.join(source, file), path.join(destination, file));
}
await cp(assets, path.join(destination, 'assets'), { recursive: true });
console.log('Built independent site in dist/ (no network requests).');
