import { pointInTerrainPolygon } from '../rules/death-trap-state.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function segmentDistanceSquared(point, first, second) {
  const dx = second.x - first.x, dy = second.y - first.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - first.x) * dx + (point.y - first.y) * dy) / length)) : 0;
  return (point.x - first.x - t * dx) ** 2 + (point.y - first.y - t * dy) ** 2;
}

/** Find an interior label location, including in narrow or concave L-shaped terrain. */
export function getTerrainLabelAnchor(points) {
  if (!Array.isArray(points) || points.length < 3 || !points.every(p => Number.isFinite(p?.x) && Number.isFinite(p?.y))) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const center = { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  const candidates = [center];
  // A grid search is deliberately bounded: 169 candidates per polygon.
  // Unlike vertex averages, the returned point is guaranteed to lie on the
  // same footprint polygon that Locate and Deny uses for marker eligibility.
  for (let yi = 0; yi < 13; yi++) for (let xi = 0; xi < 13; xi++) {
    candidates.push({ x: minX + (xi + 0.5) * (maxX - minX) / 13,
      y: minY + (yi + 0.5) * (maxY - minY) / 13 });
  }
  let best = null, score = -Infinity;
  for (const point of candidates) {
    if (!pointInTerrainPolygon(point, points)) continue;
    const clearance = Math.min(...points.map((p, i) =>
      segmentDistanceSquared(point, p, points[(i + 1) % points.length])));
    const tieBreak = ((point.x - center.x) ** 2 + (point.y - center.y) ** 2) * 0.0001;
    if (clearance - tieBreak > score) { best = point; score = clearance - tieBreak; }
  }
  return best;
}

/** These IDs are exactly the source terrainGeometry keys; no visual re-numbering. */
export function renderMissionTerrainMapLabels(terrainOptions, selectedIds = []) {
  const selected = new Set(selectedIds);
  return (terrainOptions ?? []).map(item => {
    const position = getTerrainLabelAnchor(item.points);
    if (!position) return '';
    const id = String(item.terrainAreaId);
    const eligible = item.eligible === true;
    const active = selected.has(id);
    const status = eligible ? (active ? 'selected' : 'available') : 'ineligible';
    return `<button type="button" class="mission-terrain-map-label${active ? ' is-selected' : ''}"
      data-locate-map-terrain="${esc(id)}" data-terrain-area-id="${esc(id)}"
      style="left:${(100 * position.x / 60).toFixed(5)}%;top:${(100 * (44 - position.y) / 44).toFixed(5)}%"
      aria-label="Terrain area ${esc(item.label ?? id)} · ${status}"
      aria-pressed="${active}" title="Terrain ${esc(item.label ?? id)} · ${status}"
      ${eligible ? '' : 'disabled'}>${esc(item.label ?? id)}</button>`;
  }).join('');
}
