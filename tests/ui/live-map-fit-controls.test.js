import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveMapView } from '../../src/ui/live-map-view.js';

const css = readFileSync(new URL('../../src/ui/styles/live-map.css', import.meta.url), 'utf8');
const battle = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
const state = { units: [], objectives: [], players: [], battle: { status:'active', round:1, activePlayerId:'p1' }, activePlayer:'p1', phase:'command' };

test('live map defaults to a compact one-row toolbar with secondary options in a popover', () => {
  const markup = createLiveMapView().render(state, { perspectivePlayerId:'p1', showZoomControls:false });
  const nav = markup.match(/<nav class="live-map__tools"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  assert.match(nav, /data-live-map-style/);
  assert.match(nav, /data-map-threat-toggle/);
  assert.match(nav, /<details class="live-map__more-tools"><summary>Map tools<\/summary>/);
  assert.match(nav, /data-live-map-grid-toggle/);
  assert.match(nav, /data-live-map-bases-toggle/);
  assert.match(nav, /data-live-map-sight-toggle/);
  assert.match(nav, /data-live-map-base-apply/);
  assert.doesNotMatch(nav, /data-map-zoom="in"/);
  assert.ok(nav.indexOf('live-map__more-tools-content') < nav.indexOf('data-live-map-grid-toggle'));
  assert.match(css, /\.live-map__more-tools-content\s*\{[\s\S]*?position:absolute/);
});

test('tabletop map fits 60 by 44 board inside its viewport without map scrolling', () => {
  assert.match(css, /\.live-map__viewport\s*\{[\s\S]*?place-items:center;[\s\S]*?overflow:hidden !important;[\s\S]*?container-type:size;/);
  assert.match(css, /\.live-map__canvas\s*\{[\s\S]*?width:min\(100cqw, 136\.363636cqh\) !important;[\s\S]*?aspect-ratio:60 \/ 44;/);
  assert.match(css, /\.battlefield-map__board\s*\{[\s\S]*?height:100% !important;[\s\S]*?aspect-ratio:60 \/ 44 !important;/);
  assert.match(battle, /live-map\.css\?v=map-first-fit-1/);
  for (const [availableWidth, availableHeight] of [[820,460],[920,545],[700,490],[480,290]]) {
    const boardWidth = Math.min(availableWidth, availableHeight*60/44);
    const boardHeight = boardWidth*44/60;
    assert.ok(boardWidth <= availableWidth && boardHeight <= availableHeight + 1e-9);
    assert.ok(Math.abs(boardWidth/boardHeight - 60/44) < 1e-9);
  }
});
