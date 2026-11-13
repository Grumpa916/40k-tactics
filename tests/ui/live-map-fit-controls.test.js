import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveMapView } from '../../src/ui/live-map-view.js';

const css = readFileSync(new URL('../../src/ui/styles/live-map.css', import.meta.url), 'utf8');
const battle = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
const state = { units: [], objectives: [], players: [], battle: { status:'active', round:1, activePlayerId:'p1' }, activePlayer:'p1', phase:'command' };

test('live battlefield keeps zoom at hand and groups display tools and selected model controls', () => {
  const markup = createLiveMapView().render(state, { perspectivePlayerId:'p1', showZoomControls:false, showMapPlanner:true });
  const nav = markup.match(/<nav class="live-map__tools"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  assert.match(nav, /data-live-map-style/);
  assert.match(nav, /Standard map/);
  assert.doesNotMatch(nav, /Threat view|data-map-threat-toggle|data-live-map-bases-toggle/);
  assert.match(nav, /data-live-map-zoom[^>]*>2× zoom<\/button>\s*<button[^>]*data-live-map-style[^>]*>Standard map<\/button>\s*<details[^>]+>\s*<summary>Map tools/);
  assert.match(nav, /data-live-map-grid-toggle/);
  assert.match(nav, /data-live-map-sight-toggle/);
  assert.match(nav, /data-live-map-marker-size/);
  assert.match(nav, /<summary>Map tools<\/summary>[\s\S]*data-open-map-planning/);
  assert.doesNotMatch(nav, /data-live-map-base-apply/);
  const unit = { id:'guard', name:'Guard', ownerId:'p1', status:'deployed', currentStrength:2, position:{ x:22, y:16 } };
  const selected = createLiveMapView().render({ ...state, units:[unit] }, { selectedUnitId:unit.id });
  const modelMenu = selected.match(/<details class="live-map__more-tools live-map__model-tools"[\s\S]*?<\/details>/)?.[0];
  assert.match(modelMenu, /Models for Guard/);
  assert.match(modelMenu, /data-live-map-squad-toggle/);
  assert.match(modelMenu, /data-live-map-base-apply/);
  assert.match(markup, /--live-marker-size:18px/);
  assert.doesNotMatch(markup, /data-live-map-threat-overlay|data-map-threat-note/);
  assert.match(markup, /is-top-down is-planner-view/);
  assert.match(css, /\.live-map\.is-standard \.battlefield-map__board/);
  assert.match(css, /\.live-map\.is-standard \.battlefield-map__objective/);
  assert.match(markup, /data-live-map-major-grid/);
  assert.match(css, /\.live-map\.is-planner-view \.battlefield-map__objective/);
  assert.match(css, /\.live-map\.is-top-down \.live-map__precision-major-grid/);
});

test('tabletop map fits 60 by 44 board inside its viewport without map scrolling', () => {
  assert.match(css, /\.live-map__viewport\s*\{[\s\S]*?place-items:center;[\s\S]*?overflow:hidden !important;[\s\S]*?container-type:size;/);
  assert.match(css, /\.live-map__canvas\s*\{[\s\S]*?width:min\(100cqw, 136\.363636cqh\) !important;[\s\S]*?aspect-ratio:60 \/ 44;/);
  assert.match(css, /\.battlefield-map__board\s*\{[\s\S]*?height:100% !important;[\s\S]*?aspect-ratio:60 \/ 44 !important;/);
  assert.match(battle, /live-map\.css\?v=compact-map-tools-4/);
  for (const [availableWidth, availableHeight] of [[820,460],[920,545],[700,490],[480,290]]) {
    const boardWidth = Math.min(availableWidth, availableHeight*60/44);
    const boardHeight = boardWidth*44/60;
    assert.ok(boardWidth <= availableWidth && boardHeight <= availableHeight + 1e-9);
    assert.ok(Math.abs(boardWidth/boardHeight - 60/44) < 1e-9);
  }
});

test('1-inch and 5-inch grid markings scale with battlefield like Map Planner', () => {
  const markup = createLiveMapView().render(state, {perspectivePlayerId:'p1'});
  const minorPath = markup.match(/data-live-map-grid d="([^"]+)"/)?.[1];
  const majorPath = markup.match(/data-live-map-major-grid d="([^"]+)"/)?.[1];
  assert.ok(minorPath && majorPath, 'Both grid layers are drawn');
  assert.equal((minorPath.match(/V44/g) ?? []).length, 59, '59 vertical 1-inch divisions');
  assert.equal((minorPath.match(/H60/g) ?? []).length, 43, '43 horizontal 1-inch divisions');
  assert.equal((majorPath.match(/V44/g) ?? []).length, 11, '11 vertical 5-inch lines');
  assert.equal((majorPath.match(/H60/g) ?? []).length, 8, '8 horizontal 5-inch lines');
  const minorRules = css.slice(css.lastIndexOf('/* Match the Map Planner grid.'));
  assert.match(minorRules, /\.live-map__precision-grid\s*\{[\s\S]*?stroke-opacity:\.24;[\s\S]*?stroke-width:\.07;[\s\S]*?vector-effect:none;/);
  assert.match(minorRules, /\.live-map__precision-major-grid\s*\{[\s\S]*?stroke-opacity:\.42;[\s\S]*?stroke-width:\.07;[\s\S]*?vector-effect:none;/);
  assert.match(minorRules, /\.live-map__precision-overlay\s*\{[\s\S]*?pointer-events:none;/);
  assert.match(markup, /data-live-map-grid[^>]*stroke-width="\.07"/);
  assert.match(markup, /data-live-map-major-grid[^>]*stroke-opacity="\.42"/);
});
