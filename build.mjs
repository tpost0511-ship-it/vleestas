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
  'favicon.png',
  'logo.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
];

const libraryFiles = ['data.js', 'game.js', 'icons.js'];

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'lib'), { recursive: true });

for (const file of frontendFiles) {
  await cp(path.join(root, file), path.join(dist, file));
}

for (const file of libraryFiles) {
  await cp(path.join(root, 'lib', file), path.join(dist, 'lib', file));
}
