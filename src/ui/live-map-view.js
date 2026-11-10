import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
import { mapObjectiveMarkerLabel } from '../rules/objective-display-labels.js';
import { getLiveUnitPosition } from '../rules/spatial-context.js';
import { renderBattlefieldMap } from './battlefield-map.js';
import { applyApprovedLiveMapSymbols, liveUnitSymbolLabels } from './live-map-symbols.js';
import { applyLiveMapStatusBadges } from './live-map-status-badges.js';
import { BOARD_HEIGHT, BOARD_WIDTH, baseDimensions, planningVisibility } from './map-planning-geometry.js';
import { modelBaseSizeForUnit, modelBaseSizeLabel } from '../data/adeptus-custodes-base-sizes.js';
import { applyLiveMarkerBaseScales } from './live-map-marker-base-scale.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const MAP_PREFERENCES_KEY = 'fortyk-tactics-live-map-v1';

function loadMapPreferences() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(MAP_PREFERENCES_KEY) ?? 'null');
    return {
      topDown: parsed?.topDown !== false,
      grid: true,
      // Older builds stored a "bases off" preference but later removed its
      // toggle. Physical outlines must be visible without a hidden control.
      bases: true,
      sight: parsed?.sight === true,
      markerSize: Math.max(14, Math.min(38, Number(parsed?.markerSize) || 18)),
      baseSizes: parsed?.baseSizes && typeof parsed.baseSizes === 'object' ? parsed.baseSizes : {},
      sightModels: parsed?.sightModels && typeof parsed.sightModels === 'object' ? parsed.sightModels : {}
    };
  } catch {
    return { topDown: true, grid: true, bases: true, sight: false, markerSize: 18, baseSizes: {}, sightModels: {} };
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

function unitModelsForMap(unit, state = null) {
  const models = Array.isArray(unit?.models) ? unit.models.filter(model =>
    Number.isFinite(model?.position?.x) && Number.isFinite(model?.position?.y)) : [];
  if (models.length) return models;
  const position = unit?.position ?? (state && unit ? getLiveUnitPosition(state, unit) : null);
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
  const majorGrid = Array.from({ length: Math.ceil(BOARD_WIDTH / 5) - 1 }, (_, index) => `M${(index + 1) * 5} 0V${BOARD_HEIGHT}`).concat(Array.from({ length: Math.ceil(BOARD_HEIGHT / 5) - 1 }, (_, index) => `M0 ${(index + 1) * 5}H${BOARD_WIDTH}`)).join('');
  const overlay = `<svg class="live-map__precision-overlay" data-live-map-precision viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}" preserveAspectRatio="none" aria-label="One inch battlefield grid and model bases">
    <path class="live-map__precision-grid" data-live-map-grid d="${grid}" fill="none" stroke="#d5f0ee" stroke-width=".07" stroke-opacity=".24" /><path class="live-map__precision-major-grid" data-live-map-major-grid d="${majorGrid}" fill="none" stroke="#d5f0ee" stroke-width=".07" stroke-opacity=".42" />
    <polygon class="live-map__precision-sight" data-live-map-sight points=""></polygon>
  </svg>
  <svg class="live-map__physical-base-overlay" data-live-map-bases-layer viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}" preserveAspectRatio="none" aria-label="Physical model base outlines at tabletop scale">
    <g data-live-map-bases></g>
  </svg>`;
  const boardStart = map.indexOf('<div class="battlefield-map__board"');
  const boardEnd = map.indexOf('>', boardStart);
  return boardStart >= 0 && boardEnd >= 0 ? map.slice(0, boardEnd + 1) + overlay + map.slice(boardEnd + 1) : map;
}

function liveTools(state, options, preferences) {
  const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
  const key = sizeKey(unit);
  const base = unit ? modelBaseSizeForUnit(unit, key ? preferences.baseSizes[key] : null) : null;
  const dimensions = base?.widthMm ? {
    width:base.widthMm, length:base.shape === 'round' ? '' : base.lengthMm
  } : null;
  const baseSource = base?.source === 'manual' ? 'Custom base' :
    base?.source === 'kit' ? 'Kit-supplied base (event-guide review pending)' :
    base?.source === 'event-guide' ? 'GW 2026 Event Companion' :
    base?.shape === 'hull' ? 'Hull; no standard circular base' : 'No verified base size';
  const models = unit ? unitModelsForMap(unit, state) : [];
  const selectedModelId = unit ? preferences.sightModels[unit.id] : null;
  const selectedModelIndex = Math.max(0, models.findIndex(model => model.id === selectedModelId));
  const modelPicker = models.length > 1 ? `<label class="live-map__sight-model">Sight from <select data-live-map-sight-model>${models.map((model, index) => `<option value="${index}"${index === selectedModelIndex ? ' selected' : ''}>Model ${index + 1}</option>`).join('')}</select></label>` : '';
  // Compact live toolbar mirrors Map Planner without replacing battle state.
  // Display sizing is deliberately separate from physical tabletop coordinates.
  const controls = `<nav class="live-map__tools" aria-label="Live battlefield display controls">
    <button type="button" data-live-map-style aria-pressed="${preferences.topDown}">${preferences.topDown ? 'Standard map' : 'Top-down map'}</button>
    <button type="button" data-live-map-grid-toggle aria-pressed="${preferences.grid}">1″ grid</button>
    <button type="button" data-live-map-sight-toggle aria-pressed="${preferences.sight}">Line of sight</button>
    <button type="button" data-live-map-zoom aria-pressed="false">2× zoom</button>
    <label class="live-map__marker-size" title="Used for units without verified base dimensions; known bases scale automatically in Top-down view">Fallback size
      <input type="range" min="14" max="38" step="2" value="${preferences.markerSize}" data-live-map-marker-size aria-label="Marker size for units without verified physical bases">
      <output data-live-map-marker-value>${preferences.markerSize}px</output>
    </label>
    <details class="live-map__base-editor" ${unit ? '' : 'data-disabled="true"'}>
      <summary>Model base size</summary>
      <div>
        <label>Width (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" data-live-map-base-width value="${esc(dimensions?.width ?? '')}" ${unit ? '' : 'disabled'}></label>
        <label>Length (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" placeholder="Round" data-live-map-base-length value="${esc(dimensions?.length ?? '')}" ${unit ? '' : 'disabled'}></label>
        <button type="button" data-live-map-base-apply ${unit ? '' : 'disabled'}>Set base size</button>
        <small data-live-map-base-source>${esc(baseSource)}${base ? ' · ' + esc(modelBaseSizeLabel(base)) : ''}</small>
        <small data-live-map-base-explanation>Bright outline = physical base, separate from marker size. Dashed = one-model reference only; squad footprint is not recorded.</small>
      </div>
      ${modelPicker}
      <small data-live-map-base-status aria-live="polite"></small>
    </details>
  </nav>`;
  return { controls, key, unit, models, selectedModelIndex };
}

function drawPrecision(container, state, options, preferences, selectedModelIndex) {
  const board = container.querySelector('[data-battlefield-map-board]');
  const overlay = container.querySelector('[data-live-map-precision]');
  if (!board || !overlay) return;
  const grid = overlay.querySelector('[data-live-map-grid]');
  const majorGrid = overlay.querySelector('[data-live-map-major-grid]');
  const bases = container.querySelector('[data-live-map-bases]') ?? overlay.querySelector('[data-live-map-bases]');
  const sight = overlay.querySelector('[data-live-map-sight]');
  grid.style.display = preferences.topDown && preferences.grid ? '' : 'none';
  if (majorGrid) majorGrid.style.display = preferences.topDown && preferences.grid ? '' : 'none';
  if (!bases) return;
  bases.style.display = preferences.bases ? '' : 'none';
  sight.style.display = preferences.topDown && preferences.sight ? '' : 'none';
  bases.innerHTML = (state.units ?? []).filter(unit => unit.status === 'deployed').map(unit => {
    const base = modelBaseSizeForUnit(unit, preferences.baseSizes[sizeKey(unit)]);
    const size = base?.widthMm ? baseDimensions(base.widthMm, base.lengthMm) : null;
    if (!size) return '';
    // When the game only records a squad-centre position, a single dashed
    // *reference model base* may be shown but is never a squad footprint.
    // Units with individually tracked models use their actual model positions.
    const recordedModels = Array.isArray(unit.models) ? unit.models.filter(model =>
      Number.isFinite(model?.position?.x) && Number.isFinite(model?.position?.y)) : [];
    const reportedCount = Number(unit.metadata?.modelCount ?? unit.startingStrength ??
      unit.currentStrength ?? unit.remainingStrength);
    const isReference = recordedModels.length === 0 && reportedCount !== 1;
    const models = recordedModels.length ? recordedModels : unitModelsForMap(unit, state);
    return models.map((model, index) => {
      const position = model.position ?? getLiveUnitPosition(state, unit);
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return '';
      const selected = unit.id === options?.selectedUnitId && index === selectedModelIndex;
      const angle = Number.isFinite(model.angle) ? model.angle : 0;
      const owner = unit.ownerId === (options?.perspectivePlayerId ?? state?.activePlayer) ? 'friendly' : 'opponent';
      const reference = isReference ? ' is-reference' : '';
      const title = isReference
        ? (unit.name ?? unit.id) + ' · one model base (representative only; squad positions untracked)'
        : (unit.name ?? unit.id) + ' · model ' + (index + 1) + ' base';
      return `<ellipse class="live-map__model-base is-${owner}${reference}${selected ? ' is-selected' : ''}" data-live-map-model="${esc(model.id ?? unit.id)}" data-live-base-kind="${isReference ? 'reference' : 'model'}" data-live-base-mm="${base.widthMm}x${base.lengthMm}" cx="${Number(position.x).toFixed(4)}" cy="${(BOARD_HEIGHT - Number(position.y)).toFixed(4)}" rx="${(size.width / 2).toFixed(4)}" ry="${(size.length / 2).toFixed(4)}" transform="rotate(${angle} ${Number(position.x).toFixed(4)} ${(BOARD_HEIGHT - Number(position.y)).toFixed(4)})"><title>${esc(title)}</title></ellipse>`;
    }).join('');
  }).join('');
  if (!preferences.sight || !preferences.topDown) { sight.setAttribute('points', ''); return; }
  const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
  const models = unit ? unitModelsForMap(unit, state) : [];
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
  let renderedState = {}, renderedOptions = {};
  return {
    render(state, options) {
      renderedState = state ?? {};
      renderedOptions = options ?? {};
      const stylesheet = new URL('./styles/live-map.css', import.meta.url);
      stylesheet.searchParams.set('v', 'physical-base-sized-markers-v1');
      const href = stylesheet.href;
      const symbolsStylesheet = new URL('./styles/live-map-symbols.css', import.meta.url);
      symbolsStylesheet.searchParams.set('v', 'approved-symbols-2');
      const symbolsHref = symbolsStylesheet.href;
      const controls = liveTools(state, options, preferences);
      let map = renderBattlefieldMap(state, { ...options, compactMarkers:true, showMeasurements:false, plannerStyleObjectives:true, activationForUnit:id => getUnitActivationPresentation(state,id) });
      map = applyApprovedLiveMapSymbols(map, state, { preserveObjectiveLabels: true, numberedMarkers: preferences.topDown });
      map = applyLiveMapStatusBadges(map, state);
      map = addPrecisionOverlay(map);
      map = map.replace('<div class="battlefield-map__board"', `<div class="live-map__viewport${preferences.topDown ? ' is-top-down' : ''}" data-live-map-viewport><div class="live-map__canvas" data-live-map-canvas style="width:${zoom*100}%;height:${preferences.topDown ? 'auto' : zoom*100+'%'}"><div class="battlefield-map__board"`);
      map = map.replace('<!-- battlefield-map-board-end -->', '</div></div>');
      return `<link rel="stylesheet" href="${esc(href)}"><link rel="stylesheet" href="${esc(symbolsHref)}"><div class="live-map${preferences.topDown ? ' is-top-down is-planner-view' : ' is-standard'}" data-live-map-mode="${preferences.topDown ? 'top-down' : 'standard'}" data-live-zoom="1" style="--live-marker-size:${preferences.markerSize}px">${controls.controls}${map}</div>`;
    },
    bind(container, state = renderedState, options = renderedOptions) {
      const viewport = container.querySelector('[data-live-map-viewport]');
      const canvas = container.querySelector('[data-live-map-canvas]');
      if (viewport) {
        viewport.scrollLeft = left; viewport.scrollTop = top;
        viewport.addEventListener('scroll', () => { left = viewport.scrollLeft; top = viewport.scrollTop; });
      }
      let selectedModelIndex = liveTools(state, options, preferences).selectedModelIndex;
      drawPrecision(container, state, options, preferences, selectedModelIndex);
      applyLiveMarkerBaseScales(container, state, preferences.baseSizes);
      const updatePressed = (selector, value) => container.querySelector(selector)?.setAttribute('aria-pressed', String(value));
      const objectives = Array.from(container.querySelectorAll?.('.live-map .battlefield-map__objective') ?? []);
      const fullObjectiveLabels = objectives.map(node => node.textContent);
      const refreshObjectiveLabels = () => objectives.forEach((node, index) => {
        node.textContent = preferences.topDown ? fullObjectiveLabels[index] : mapObjectiveMarkerLabel(fullObjectiveLabels[index]);
      });
      // Use the exact abbreviation function used by the left army roster.
      // Update only the marker text node so activation badges, selections,
      // drag listeners, map coordinates and formation metadata stay intact.
      const unitMarkers = Array.from(container.querySelectorAll?.('.live-map [data-map-unit-id]') ?? []);
      const unitSymbols = liveUnitSymbolLabels(state.units ?? []);
      const markerUnitId = marker => marker.getAttribute('data-map-member-id') || marker.getAttribute('data-map-unit-id');
      const visibleUnitIds = new Set(unitMarkers.map(markerUnitId));
      const unitNumbers = new Map();
      for (const unit of state.units ?? []) {
        if (visibleUnitIds.has(unit.id)) unitNumbers.set(unit.id, String(unitNumbers.size + 1));
      }
      const refreshUnitLabels = () => unitMarkers.forEach(marker => {
        const text = marker.firstChild;
        if (text?.nodeType !== 3) return;
        const id = markerUnitId(marker);
        const label = preferences.topDown ? unitNumbers.get(id) : unitSymbols.get(id);
        if (label != null) text.nodeValue = label;
      });
      const updateMapStyle = () => {
        container.querySelector('.live-map')?.classList.toggle('is-top-down', preferences.topDown);
        container.querySelector('.live-map')?.classList.toggle('is-standard', !preferences.topDown);
        container.querySelector('.live-map')?.classList.toggle('is-planner-view', preferences.topDown);
        container.querySelector('.live-map')?.setAttribute('data-live-map-mode', preferences.topDown ? 'top-down' : 'standard');
        container.querySelector('[data-live-map-viewport]')?.classList.toggle('is-top-down', preferences.topDown);
        if (canvas?.style) canvas.style.height = preferences.topDown ? 'auto' : zoom*100+'%';
        updatePressed('button[data-live-map-style]', preferences.topDown);
        const styleButton = container.querySelector('button[data-live-map-style]');
        if (styleButton) styleButton.textContent = preferences.topDown ? 'Standard map' : 'Top-down map';
        drawPrecision(container, state, options, preferences, selectedModelIndex);
        applyLiveMarkerBaseScales(container, state, preferences.baseSizes);
        refreshObjectiveLabels();
        refreshUnitLabels();
      };
      refreshObjectiveLabels();
      refreshUnitLabels();
      container.querySelector('[data-live-map-style]')?.addEventListener('click', () => {
        preferences.topDown = !preferences.topDown;
        saveMapPreferences(preferences);
        updateMapStyle();
      });
      container.querySelector('[data-live-map-marker-size]')?.addEventListener('input', event => {
        const size = Math.max(14, Math.min(38, Number(event.currentTarget.value) || 18));
        preferences.markerSize = size;
        const liveMap = container.querySelector('.live-map');
        liveMap?.style?.setProperty?.('--live-marker-size', size + 'px');
        const output = container.querySelector('[data-live-map-marker-value]');
        if (output) output.textContent = size + 'px';
        saveMapPreferences(preferences);
      });
      container.querySelector('[data-live-map-zoom]')?.addEventListener('click', event => {
        const liveMap = container.querySelector('.live-map');
        const expanded = liveMap?.getAttribute('data-live-zoom') !== '2';
        liveMap?.setAttribute('data-live-zoom', expanded ? '2' : '1');
        event.currentTarget.setAttribute('aria-pressed', String(expanded));
        event.currentTarget.textContent = expanded ? 'Fit map' : '2× zoom';
        if (!expanded && viewport) { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
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
        const caveat = container.querySelector('[data-live-map-sight-caveat]');
        if (caveat) caveat.hidden = !preferences.sight;
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-sight-model]')?.addEventListener('change', event => {
        selectedModelIndex = Number(event.currentTarget.value) || 0;
        const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
        const model = unitModelsForMap(unit, state)[selectedModelIndex];
        if (unit && model) preferences.sightModels[unit.id] = model.id;
        saveMapPreferences(preferences);
        drawPrecision(container, state, options, preferences, selectedModelIndex);
      });
      container.querySelector('[data-live-map-base-apply]')?.addEventListener('click', () => {
        const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
        const key = sizeKey(unit);
        if (!key) return;
        const width = container.querySelector('[data-live-map-base-width]')?.value ?? '';
        const length = container.querySelector('[data-live-map-base-length]')?.value ?? '';
        const status = container.querySelector('[data-live-map-base-status]');
        if (!width && !length) delete preferences.baseSizes[key];
        else if (baseDimensions(width, length)) preferences.baseSizes[key] = { width, length };
        else {
          if (status) status.textContent = 'Base width must be 1–400 mm; length is optional and uses the same limits.';
          return;
        }
        saveMapPreferences(preferences);
        const effective = modelBaseSizeForUnit(unit, preferences.baseSizes[key]);
        const source = container.querySelector('[data-live-map-base-source]');
        if (source) source.textContent = effective?.source === 'manual' ? 'Custom base · ' + modelBaseSizeLabel(effective)
          : effective?.source === 'kit' ? 'Kit-supplied · ' + modelBaseSizeLabel(effective)
          : effective ? 'GW 2026 Event Companion · ' + modelBaseSizeLabel(effective)
          : 'No verified base size';
        const lengthInput = container.querySelector('[data-live-map-base-length]');
        const widthInput = container.querySelector('[data-live-map-base-width]');
        if (widthInput) widthInput.value = effective?.widthMm ?? '';
        if (lengthInput) lengthInput.value = effective?.shape === 'oval' ? effective.lengthMm : '';
        if (status) status.textContent = !width && !length ? 'Default base size restored.' : 'Custom base size saved.';
        drawPrecision(container, state, options, preferences, selectedModelIndex);
        applyLiveMarkerBaseScales(container, state, preferences.baseSizes);
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
