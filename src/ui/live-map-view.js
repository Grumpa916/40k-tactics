import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
import { getLiveUnitPosition } from '../rules/spatial-context.js';
import { renderBattlefieldMap } from './battlefield-map.js';
import { applyApprovedLiveMapSymbols } from './live-map-symbols.js';
import { applyLiveMapStatusBadges } from './live-map-status-badges.js';
import { renderShootingCoverageOverlay } from './shooting-coverage-overlay.js';
import { BOARD_HEIGHT, BOARD_WIDTH, baseDimensions, planningVisibility } from './map-planning-geometry.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const MAP_PREFERENCES_KEY = 'fortyk-tactics-live-map-v1';

function loadMapPreferences() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(MAP_PREFERENCES_KEY) ?? 'null');
    return {
      topDown: parsed?.topDown !== false,
      grid: parsed?.grid === true,
      bases: parsed?.bases !== false,
      sight: parsed?.sight === true,
      baseSizes: parsed?.baseSizes && typeof parsed.baseSizes === 'object' ? parsed.baseSizes : {},
      sightModels: parsed?.sightModels && typeof parsed.sightModels === 'object' ? parsed.sightModels : {}
    };
  } catch {
    return { topDown: true, grid: false, bases: true, sight: false, baseSizes: {}, sightModels: {} };
  }
}

function saveMapPreferences(preferences) {
  try { globalThis.localStorage?.setItem(MAP_PREFERENCES_KEY, JSON.stringify(preferences)); } catch {}
}

function sizeKey(unit) {
  return unit?.metadata?.datasheetId || unit?.datasheetId || unit?.id;
}

function mapGridPath() {
  const lines = [];
  for (let x = 1; x < BOARD_WIDTH; x += 1) lines.push(`M${x} 0V${BOARD_HEIGHT}`);
  for (let y = 1; y < BOARD_HEIGHT; y += 1) lines.push(`M0 ${y}H${BOARD_WIDTH}`);
  return lines.join('');
}

function unitModelsForMap(unit) {
  const models = Array.isArray(unit?.models) ? unit.models.filter(model =>
    Number.isFinite(model?.position?.x) && Number.isFinite(model?.position?.y)) : [];
  if (models.length) return models;
  const position = unit?.position;
  return Number.isFinite(position?.x) && Number.isFinite(position?.y)
    ? [{ id: unit.id, position }]
    : [];
}

function mapPoint(position) {
  return `${Number(position.x).toFixed(4)},${(BOARD_HEIGHT - Number(position.y)).toFixed(4)}`;
}

function terrainFootprints(board) {
  return Array.from(board.querySelectorAll('polygon[data-terrain]'), polygon => {
    const points = polygon.getAttribute('points').trim().split(/\s+/).map(pair => {
      const [x, svgY] = pair.split(',').map(Number);
      return { x, y: BOARD_HEIGHT - svgY };
    });
    return { name: polygon.getAttribute('data-terrain'), points };
  }).filter(shape => shape.points.length >= 3 && shape.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
}

function addPrecisionOverlay(map) {
  const grid = mapGridPath();
  const overlay = `<svg class="live-map__precision-overlay" data-live-map-precision viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}" preserveAspectRatio="none" aria-label="Optional one inch grid, model bases and potential line of sight">
    <path class="live-map__precision-grid" data-live-map-grid d="${grid}" fill="none" />
    <polygon class="live-map__precision-sight" data-live-map-sight points=""></polygon>
    <g data-live-map-bases></g></svg>`;
  const boardStart = map.indexOf('<div class="battlefield-map__board"');
  const boardEnd = map.indexOf('>', boardStart);
  return boardStart >= 0 && boardEnd >= 0 ? map.slice(0, boardEnd + 1) + overlay + map.slice(boardEnd + 1) : map;
}

function liveTools(state, options, preferences) {
  const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
  const key = sizeKey(unit);
  const dimensions = key ? preferences.baseSizes[key] : null;
  const models = unit ? unitModelsForMap(unit) : [];
  const selectedModelId = key ? preferences.sightModels[key] : null;
  const selectedModelIndex = Math.max(0, models.findIndex(model => model.id === selectedModelId));
  const modelPicker = models.length > 1 ? `<label class="live-map__sight-model">Sight from <select data-live-map-sight-model>${models.map((model, index) => `<option value="${index}"${index === selectedModelIndex ? ' selected' : ''}>Model ${index + 1}</option>`).join('')}</select></label>` : '';
  const controls = `<nav class="live-map__tools" aria-label="Map tools">
    <button type="button" data-live-map-style aria-pressed="${preferences.topDown}">${preferences.topDown ? 'Top-down map' : 'Standard map'}</button>
    <button type="button" data-live-map-grid-toggle aria-pressed="${preferences.grid}">1″ grid</button>
    <button type="button" data-live-map-bases-toggle aria-pressed="${preferences.bases}">Model bases</button>
    <button type="button" data-live-map-sight-toggle aria-pressed="${preferences.sight}">Potential sight</button>
    ${preferences.topDown ? `<details class="live-map__base-editor"${unit ? '' : ' data-disabled="true"'}><summary>Base size${unit ? ` · ${esc(unit.name ?? unit.id)}` : ''}</summary>
      <div><label>Width (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" data-live-map-base-width value="${esc(dimensions?.width ?? '')}"${unit ? '' : ' disabled'}></label>
      <label>Length (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" placeholder="Round" data-live-map-base-length value="${esc(dimensions?.length ?? '')}"${unit ? '' : ' disabled'}></label>
      <button type="button" data-live-map-base-apply${unit ? '' : ' disabled'}>Save size</button></div>
      ${modelPicker}<small>Saved on this device for this unit type. Blank length uses a round base.</small></details>` : ''}
    ${options?.showZoomControls !== false ? `<button type="button" data-map-zoom="out" aria-label="Zoom out">−</button><span data-map-zoom-value>100%</span><button type="button" data-map-zoom="in" aria-label="Zoom in">+</button><button type="button" data-map-zoom="fit">Fit</button>` : ''}
    ${options?.showThreatCoverage !== false ? `<button type="button" data-map-threat-toggle aria-pressed="false">Threat view</button><small data-map-threat-note hidden>Longest confirmed enemy weapon ranges · terrain shadows are approximate; verify line of sight on the table.</small>` : ''}
  </nav>`;
  return { controls, key, unit, models, selectedModelIndex };
}

function drawPrecision(container, state, options, preferences, selectedModelIndex) {
  const board = container.querySelector('[data-battlefield-map-board]');
  const overlay = container.querySelector('[data-live-map-precision]');
  if (!board || !overlay) return;
  const grid = overlay.querySelector('[data-live-map-grid]');
  const bases = overlay.querySelector('[data-live-map-bases]');
  const sight = overlay.querySelector('[data-live-map-sight]');
  grid.style.display = preferences.topDown && preferences.grid ? '' : 'none';
  bases.style.display = preferences.topDown && preferences.bases ? '' : 'none';
  sight.style.display = preferences.topDown && preferences.sight ? '' : 'none';
  bases.innerHTML = (state.units ?? []).filter(unit => unit.status === 'deployed').map(unit => {
    const size = baseDimensions(preferences.baseSizes[sizeKey(unit)]?.width, preferences.baseSizes[sizeKey(unit)]?.length);
    if (!size) return '';
    const models = unitModelsForMap(unit);
    return models.map((model, index) => {
      const position = model.position ?? getLiveUnitPosition(state, unit);
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return '';
      const selected = unit.id === options?.selectedUnitId && index === selectedModelIndex;
      const angle = Number.isFinite(model.angle) ? model.angle : 0;
      const owner = unit.ownerId === (options?.perspectivePlayerId ?? state?.activePlayer) ? 'friendly' : 'opponent';
      return `<ellipse class="live-map__model-base is-${owner}${selected ? ' is-selected' : ''}" data-live-map-model="${esc(model.id ?? unit.id)}" cx="${Number(position.x).toFixed(4)}" cy="${(BOARD_HEIGHT - Number(position.y)).toFixed(4)}" rx="${(size.width / 2).toFixed(4)}" ry="${(size.length / 2).toFixed(4)}" transform="rotate(${angle} ${Number(position.x).toFixed(4)} ${(BOARD_HEIGHT - Number(position.y)).toFixed(4)})"><title>${esc(unit.name ?? unit.id)} · model ${index + 1}</title></ellipse>`;
    }).join('');
  }).join('');
  if (!preferences.sight || !preferences.topDown) { sight.setAttribute('points', ''); return; }
  const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
  const models = unit ? unitModelsForMap(unit) : [];
  const model = models[selectedModelIndex] ?? models[0];
  if (!model?.position) { sight.setAttribute('points', ''); return; }
  const footprints = terrainFootprints(board);
  if (!footprints.length) { sight.setAttribute('points', ''); return; }
  const result = planningVisibility(model.position, footprints);
  sight.setAttribute('points', result.points.map(mapPoint).join(' '));
}

// Zoom changes presentation only. Stored unit coordinates are never changed.
export function createLiveMapView() {
  let zoom = 1, left = 0, top = 0;
  const preferences = loadMapPreferences();
  return {
    render(state, options) {
      const stylesheet = new URL('./styles/live-map.css', import.meta.url);
      stylesheet.searchParams.set('v', 'topdown-live-map-1');
      const href = stylesheet.href;
      const symbolsStylesheet = new URL('./styles/live-map-symbols.css', import.meta.url);
      symbolsStylesheet.searchParams.set('v', 'approved-symbols-2');
      const symbolsHref = symbolsStylesheet.href;
      const controls = liveTools(state, options, preferences);
      let map = renderBattlefieldMap(state, { ...options, compactMarkers:true, showMeasurements:false, activationForUnit:id => getUnitActivationPresentation(state,id) });
      map = applyApprovedLiveMapSymbols(map, state);
      map = applyLiveMapStatusBadges(map, state);
      if (preferences.topDown) map = addPrecisionOverlay(map);
      if (options?.showThreatCoverage !== false) {
        const overlay = renderShootingCoverageOverlay(map, state, options?.perspectivePlayerId ?? state?.activePlayer ?? null);
        if (overlay) {
          const boardStart = map.indexOf('<div class="battlefield-map__board"');
          const boardEnd = map.indexOf('>', boardStart);
          if (boardStart >= 0 && boardEnd >= 0) map = map.slice(0, boardEnd + 1) + overlay + map.slice(boardEnd + 1);
        }
      }
      map = map.replace('<div class="battlefield-map__board"', `<div class="live-map__viewport${preferences.topDown ? ' is-top-down' : ''}" data-live-map-viewport><div class="live-map__canvas" data-live-map-canvas style="width:${zoom*100}%;height:${preferences.topDown ? 'auto' : zoom*100+'%'}"><div class="battlefield-map__board"`);
      map = map.replace('<!-- battlefield-map-board-end -->', '</div></div>');
      return `<link rel="stylesheet" href="${esc(href)}"><link rel="stylesheet" href="${esc(symbolsHref)}"><div class="live-map${preferences.topDown ? ' is-top-down' : ' is-standard'}" data-live-map-style="${preferences.topDown ? 'top-down' : 'standard'}">${controls.controls}${map}</div>`;
    },
    bind(container, state = {}, options = {}) {
      const viewport = container.querySelector('[data-live-map-viewport]');
      const canvas = container.querySelector('[data-live-map-canvas]');
      if (viewport) {
        viewport.scrollLeft = left; viewport.scrollTop = top;
        viewport.addEventListener('scroll', () => { left = viewport.scrollLeft; top = viewport.scrollTop; });
      }
      let selectedModelIndex = liveTools(state, options, preferences).selectedModelIndex;
      drawPrecision(container, state, options, preferences, selectedModelIndex);
      const updatePressed = (selector, value) => container.querySelector(selector)?.setAttribute('aria-pressed', String(value));
      const updateMapStyle = () => {
        container.querySelector('.live-map')?.classList.toggle('is-top-down', preferences.topDown);
        container.querySelector('.live-map')?.classList.toggle('is-standard', !preferences.topDown);
        container.querySelector('.live-map')?.setAttribute('data-live-map-style', preferences.topDown ? 'top-down' : 'standard');
        container.querySelector('[data-live-map-viewport]')?.classList.toggle('is-top-down', preferences.topDown);
        updatePressed('[data-live-map-style]', preferences.topDown);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      };
      container.querySelector('[data-live-map-style]')?.addEventListener('click', () => {
        preferences.topDown = !preferences.topDown;
        saveMapPreferences(preferences);
        updateMapStyle();
      });
      container.querySelector('[data-live-map-grid-toggle]')?.addEventListener('click', () => {
        preferences.grid = !preferences.grid; saveMapPreferences(preferences);
        updatePressed('[data-live-map-grid-toggle]', preferences.grid);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-bases-toggle]')?.addEventListener('click', () => {
        preferences.bases = !preferences.bases; saveMapPreferences(preferences);
        updatePressed('[data-live-map-bases-toggle]', preferences.bases);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-sight-toggle]')?.addEventListener('click', () => {
        preferences.sight = !preferences.sight; saveMapPreferences(preferences);
        updatePressed('[data-live-map-sight-toggle]', preferences.sight);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-sight-model]')?.addEventListener('change', event => {
        selectedModelIndex = Number(event.currentTarget.value) || 0;
        const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
        const model = unitModelsForMap(unit)[selectedModelIndex];
        if (unit && model) preferences.sightModels[sizeKey(unit)] = model.id;
        saveMapPreferences(preferences);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-base-apply]')?.addEventListener('click', () => {
        const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
        const key = sizeKey(unit);
        if (!key) return;
        const width = container.querySelector('[data-live-map-base-width]')?.value ?? '';
        const length = container.querySelector('[data-live-map-base-length]')?.value ?? '';
        const status = container.querySelector('[data-map-game-status]');
        if (!width && !length) delete preferences.baseSizes[key];
        else if (baseDimensions(width, length)) preferences.baseSizes[key] = { width, length };
        else {
          if (status) status.textContent = 'Base width must be 1–400 mm; length is optional and uses the same limits.';
          return;
        }
        saveMapPreferences(preferences);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-map-threat-toggle]')?.addEventListener('click', (event) => {
        const button = event.currentTarget;
        const overlay = container.querySelector('[data-live-map-threat-overlay]');
        const note = container.querySelector('[data-map-threat-note]');
        const enabled = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(enabled));
        if (overlay) overlay.style.visibility = enabled ? 'visible' : 'hidden';
        if (note) note.hidden = !enabled;
      });
      container.querySelectorAll?.('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
        const old = zoom;
        zoom = button.getAttribute('data-map-zoom') === 'fit' ? 1 : Math.max(1,Math.min(3,zoom+(button.getAttribute('data-map-zoom') === 'in' ? .5 : -.5)));
        if (canvas?.style) {
          canvas.style.width = zoom*100+'%';
          canvas.style.height = preferences.topDown ? 'auto' : zoom*100+'%';
        }
        if (viewport) {
          viewport.scrollLeft = zoom === 1 ? 0 : (left+(viewport.clientWidth??0)/2)*zoom/old-(viewport.clientWidth??0)/2;
          viewport.scrollTop = zoom === 1 ? 0 : (top+(viewport.clientHeight??0)/2)*zoom/old-(viewport.clientHeight??0)/2;
          left = viewport.scrollLeft; top = viewport.scrollTop;
        }
        const value = container.querySelector('[data-map-zoom-value]');
        if (value) value.textContent = Math.round(zoom*100)+'%';
      }));
    }
  };
}
