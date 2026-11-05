import { getCombatFormationMembers, getCombatFormationRootId } from '../rules/battle-unit-reference.js';
import { getEquippedWeaponReferences } from '../rules/saved-roster-combat-profile.js';
import { getLiveUnitPosition } from '../rules/spatial-context.js';

const WIDTH = 60;
const HEIGHT = 44;
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function convexHull(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const point of sorted) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (const point of sorted.reverse()) {
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function clipToBoard(polygon) {
  let points = polygon;
  const edges = [
    { inside: point => point.x >= 0, intersect: (a, b) => ({ x: 0, y: a.y + (b.y - a.y) * (0 - a.x) / (b.x - a.x) }) },
    { inside: point => point.x <= WIDTH, intersect: (a, b) => ({ x: WIDTH, y: a.y + (b.y - a.y) * (WIDTH - a.x) / (b.x - a.x) }) },
    { inside: point => point.y >= 0, intersect: (a, b) => ({ x: a.x + (b.x - a.x) * (0 - a.y) / (b.y - a.y), y: 0 }) },
    { inside: point => point.y <= HEIGHT, intersect: (a, b) => ({ x: a.x + (b.x - a.x) * (HEIGHT - a.y) / (b.y - a.y), y: HEIGHT }) }
  ];
  for (const edge of edges) {
    const input = points;
    points = [];
    if (!input.length) break;
    let previous = input.at(-1);
    for (const current of input) {
      const previousInside = edge.inside(previous);
      const currentInside = edge.inside(current);
      if (currentInside) {
        if (!previousInside) points.push(edge.intersect(previous, current));
        points.push(current);
      } else if (previousInside) {
        points.push(edge.intersect(previous, current));
      }
      previous = current;
    }
  }
  return points;
}

function terrainShapes(mapHtml) {
  return [...mapHtml.matchAll(/<polygon class="battlefield-map__terrain"[^>]*data-terrain="([^"]+)"[^>]*points="([^"]+)"/g)]
    .map((match) => ({
      name: match[1],
      points: match[2].trim().split(/\s+/).map((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    }))
    .filter((shape) => shape.points.length >= 3);
}

function confirmedRange(state, unit) {
  const members = getCombatFormationMembers(state, unit);
  const ranges = members.flatMap((member) => getEquippedWeaponReferences(state, member)
    .filter((item) => item.activeQuantity == null || item.activeQuantity > 0)
    .map((item) => Number(item.weapon?.range ?? item.weapon?.characteristics?.range)))
    .filter((range) => Number.isFinite(range) && range > 0);
  return ranges.length ? Math.max(...ranges) : null;
}

export function renderShootingCoverageOverlay(mapHtml, state, perspectivePlayerId) {
  if (perspectivePlayerId == null) return '<svg class="live-map__threat-overlay" data-live-map-threat-overlay hidden viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="Active player perspective is not recorded"><text class="live-map__threat-empty" x="30" y="22" text-anchor="middle">Active player perspective not recorded</text></svg>';
  const units = Array.isArray(state?.units) ? state.units : [];
  const seen = new Set();
  const sources = [];
  for (const unit of units) {
    if (unit?.status !== 'deployed' || unit.ownerId === perspectivePlayerId) continue;
    const rootId = getCombatFormationRootId(state, unit);
    if (!rootId || seen.has(rootId)) continue;
    seen.add(rootId);
    const root = units.find((candidate) => candidate.id === rootId);
    if (!root || root.status !== 'deployed') continue;
    const position = getLiveUnitPosition(state, root);
    const range = confirmedRange(state, root);
    if (!position || range == null) continue;
    sources.push({ unit: root, position: { x: position.x, y: HEIGHT - position.y }, range });
  }
  if (!sources.length) return '<svg class="live-map__threat-overlay" data-live-map-threat-overlay hidden viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="No confirmed enemy ranged profiles"><text class="live-map__threat-empty" x="30" y="22" text-anchor="middle">No confirmed enemy ranged profiles</text></svg>';

  const terrains = terrainShapes(mapHtml);
  const coverage = sources.map(({ unit, position, range }) =>
    '<circle class="live-map__threat-range" cx="' + position.x + '" cy="' + position.y + '" r="' + range + '"><title>' +
    esc((unit.name ?? 'Opponent unit') + ': longest confirmed equipped ranged profile, ' + range + ' inches') +
    '</title></circle>'
  ).join('');
  const shadows = [];
  for (const source of sources) {
    for (const terrain of terrains) {
      const center = terrain.points.reduce((sum, point) => ({ x: sum.x + point.x / terrain.points.length, y: sum.y + point.y / terrain.points.length }), { x: 0, y: 0 });
      const dx = center.x - source.position.x;
      const dy = center.y - source.position.y;
      const distance = Math.hypot(dx, dy);
      if (!distance || distance > source.range) continue;
      const extension = 72;
      const projected = terrain.points.map((point) => ({ x: point.x + dx / distance * extension, y: point.y + dy / distance * extension }));
      const hull = clipToBoard(convexHull([...terrain.points, ...projected]))
        .map((point) => point.x.toFixed(3) + ',' + point.y.toFixed(3))
        .join(' ');
      if (hull) shadows.push('<g class="live-map__terrain-shadow"><title>' + esc('Approximate shadow behind ' + terrain.name + ' from ' + (source.unit.name ?? 'opponent unit')) + '</title><polygon points="' + hull + '"/></g>');
    }
  }
  const shadowPolygons = shadows.join('');
  return '<svg class="live-map__threat-overlay" data-live-map-threat-overlay hidden viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="Approximate current-position shooting ranges and terrain shadows">' +
    shadowPolygons + coverage + '</svg>';
}
