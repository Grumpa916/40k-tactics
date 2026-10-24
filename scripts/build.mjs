import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(repoRoot, 'dist');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const name of ['index.html', 'account.html', 'battle.html', 'charge.html', 'shooting.html', 'supabase-cloud-check.html', 'terrain-preview.html', '_headers', 'manifest.webmanifest']) {
  await cp(join(repoRoot, name), join(outDir, name));
}

async function copyTree(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (entry.name.endsWith('.test.js')) continue;
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else await cp(from, to);
  }
}

await copyTree(join(repoRoot, 'src'), join(outDir, 'src'));
await copyTree(join(repoRoot, 'icons'), join(outDir, 'icons'));
console.log('Built static Cloudflare Pages bundle in dist/');
