import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const frontendFiles = [
  'index.html',
  'App.js',
  'main.js',
  'styles.css',
  'config.js',
  'manifest.webmanifest',
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
];

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'lib'), { recursive: true });

for (const file of frontendFiles) {
  await cp(path.join(root, file), path.join(dist, file));
}

await cp(path.join(root, 'lib'), path.join(dist, 'lib'), {
  recursive: true,
  filter: (source) => !source.endsWith('.sql'),
});
