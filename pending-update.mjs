import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const UPDATE_VERSION = 'pwa-tabletop-start-v3';
console.log('UPDATE_VERSION ' + UPDATE_VERSION);
const root = process.cwd();

const oldManifest = `{
  "name": "40K Tactics — Battle Table",
  "short_name": "40K Tactics",
  "id": "./battle.html",
  "start_url": "./battle.html?source=pwa",
  "scope": "./",
  "display": "standalone",
  "display_override": [
    "standalone"
  ],
  "orientation": "landscape",
  "background_color": "#0b1115",
  "theme_color": "#0b1115",
  "description": "Landscape tabletop battle companion for Warhammer 40,000.",
  "categories": [
    "games",
    "utilities"
  ],
  "icons": [
    {
      "src": "./icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
`;

const newManifest = oldManifest.replace(
  '"start_url": "./battle.html?source=pwa"',
  '"start_url": "./battle.html?ui=tabletop&source=pwa"'
);

function target(path) {
  const p = resolve(root, path);
  if (!p.startsWith(root + sep)) throw new Error('Invalid update path: ' + path);
  return p;
}

const manifestPath = target('manifest.webmanifest');
if (!existsSync(manifestPath)) {
  throw new Error('Refusing update: manifest.webmanifest is missing. Apply the PWA shell update first. No files were changed.');
}

const current = readFileSync(manifestPath, 'utf8');
if (current === newManifest) {
  console.log('PWA manifest already launches the Tabletop UI. No changes needed.');
} else if (current === oldManifest) {
  writeFileSync(manifestPath, newManifest);
  console.log('Updated PWA start_url to battle.html?ui=tabletop&source=pwa');
} else {
  throw new Error('Refusing update: manifest.webmanifest differs from the audited PWA v2 manifest. No files were changed.');
}

console.log('PWA launch target now defaults to the authoritative Tabletop interface.');
