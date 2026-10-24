import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('deployment bundle includes install metadata and every referenced app icon', t => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), '40k-pwa-build-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  mkdirSync(join(fixture, 'scripts'));
  for (const path of ['scripts/build.mjs', 'index.html', 'battle.html', 'account.html', 'charge.html', 'shooting.html', 'supabase-cloud-check.html', 'terrain-preview.html', '_headers', 'manifest.webmanifest', 'icons', 'src']) {
    cpSync(join(root, path), join(fixture, path), { recursive: true });
  }
  const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  const dist = join(fixture, 'dist');
  const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'));
  // Resolve relative URLs at the real GitHub Pages subdirectory, not the domain root.
  const manifestUrl = new URL('https://grumpa916.github.io/40k-tactics/manifest.webmanifest');
  const launch = new URL(manifest.start_url, manifestUrl);
  assert.equal(launch.pathname, '/40k-tactics/battle.html');
  assert.equal(launch.searchParams.get('ui'), 'tabletop');
  assert.equal(manifest.display, 'standalone');
  assert.equal(new URL(manifest.scope, manifestUrl).pathname, '/40k-tactics/');
  assert.ok(existsSync(join(dist, launch.pathname.replace('/40k-tactics/', ''))));
  for (const icon of manifest.icons) {
    const bytes = readFileSync(join(dist, icon.src));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', icon.src);
  }
  assert.ok(existsSync(join(dist, 'icons/apple-touch-icon.png')));
  assert.ok(existsSync(join(dist, 'src/ui/styles/pwa.css')));
});
