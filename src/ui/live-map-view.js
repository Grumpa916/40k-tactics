import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
import { mapObjectiveMarkerLabel } from '../rules/objective-display-labels.js';
import { getLiveUnitPosition } from '../rules/spatial-context.js';
import { getCombatFormationRoot } from '../rules/battle-unit-reference.js';
import { renderBattlefieldMap } from './battlefield-map.js';
import { applyApprovedLiveMapSymbols, liveUnitSymbolLabels } from './live-map-symbols.js';
import { applyLiveMapStatusBadges } from './live-map-status-badges.js';
import { BOARD_HEIGHT, BOARD_WIDTH, baseDimensions, planningVisibility } from './map-planning-geometry.js';
import { MAP_PLANNING_BUTTON } from './map-planning.js';
import { modelBaseSizeForUnit, modelBaseSizeLabel } from '../data/adeptus-custodes-base-sizes.js';
import { applyLiveMarkerBaseScales, getLiveOvalAngle } from './live-map-marker-base-scale.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const MAP_PREFERENCES_KEY = 'fortyk-tactics-live-map-v1';

function loadMapPreferences() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(MAP_PREFERENCES_KEY) ?? 'null');
    return {
      topDown: parsed?.topDown !== false,
      grid: parsed?.grid !== false,
      // Older builds stored a "bases off" preference but later removed its
      // toggle. Physical outlines must be visible without a hidden control.
      bases: true,
      sight: parsed?.sight === true,
      markerSize: Math.max(14, Math.min(38, Number(parsed?.markerSize) || 18)),
      baseSizes: parsed?.baseSizes && typeof parsed.baseSizes === 'object' ? parsed.baseSizes : {},
      ovalAngles: parsed?.ovalAngles && typeof parsed.ovalAngles === 'object' ? parsed.ovalAngles : {},
      expandedUnits: parsed?.expandedUnits && typeof parsed.expandedUnits === 'object' ? parsed.expandedUnits : {},
      sightModels: parsed?.sightModels && typeof parsed.sightModels === 'object' ? parsed.sightModels : {}
    };
  } catch {
    return { topDown: true, grid: true, bases: true, sight: false, markerSize: 18, baseSizes: {}, ovalAngles: {}, expandedUnits: {}, sightModels: {} };
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
  </svg>
  <div class="live-map__individual-models" data-live-map-individual-models></div>`;
  const boardStart = map.indexOf('<div class="battlefield-map__board"');
  const boardEnd = map.indexOf('>', boardStart);
  return boardStart >= 0 && boardEnd >= 0 ? map.slice(0, boardEnd + 1) + overlay + map.slice(boardEnd + 1) : map;
}

function liveTools(state, options, preferences, zoomed = false) {
  const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
  const key = sizeKey(unit);
  const base = unit ? modelBaseSizeForUnit(unit, key ? preferences.baseSizes[key] : null) : null;
  const dimensions = base?.widthMm ? {
    width:base.widthMm, length:base.shape === 'round' ? '' : base.lengthMm
  } : null;
  const ovalRotation = base?.shape === 'oval' && unit ? getLiveOvalAngle(unit, preferences.ovalAngles) : 0;
  const baseSource = base?.source === 'manual' ? 'Custom base' :
    base?.shape === 'unique' ? 'GW Event Companion · unique; confirm with event organiser' :
    base?.source === 'kit' ? 'Kit-supplied base (event-guide review pending)' :
    base?.source === 'event-guide' ? 'GW 2026 Event Companion' :
    base?.shape === 'hull' ? 'Hull; no standard circular base' : 'No verified base size';
  const count = Number(unit?.currentStrength ?? unit?.remainingStrength ?? unit?.metadata?.currentModelCount ?? unit?.metadata?.modelCount);
  const canExpand = unit?.status === 'deployed' && Number.isInteger(count) && count > 1;
  const models = unit ? unitModelsForMap(unit, state) : [];
  const selectedModelId = unit ? preferences.sightModels[unit.id] : null;
  const selectedModelIndex = Math.max(0, models.findIndex(model => model.id === selectedModelId));
  const modelPicker = models.length > 1 ? `<label class="live-map__sight-model">Sight from <select data-live-map-sight-model>${models.map((model, index) => `<option value="${index}"${index === selectedModelIndex ? ' selected' : ''}>Model ${index + 1}</option>`).join('')}</select></label>` : '';
  // Compact live toolbar mirrors Map Planner without replacing battle state.
  // Display sizing is deliberately separate from physical tabletop coordinates.
  const controls = `<nav class="live-map__tools" aria-label="Live battlefield display controls">
    <button type="button" data-live-map-zoom aria-pressed="${zoomed}">${zoomed ? 'Fit map' : '2× zoom'}</button>
    <button type="button" data-live-map-style aria-pressed="${preferences.topDown}">${preferences.topDown ? 'Standard map' : 'Top-down map'}</button>
    <details class="live-map__more-tools" name="live-map-tools" data-view-key="live-map-display-tools">
      <summary>Map tools</summary>
      <div class="live-map__more-tools-content">
        <button type="button" data-live-map-grid-toggle aria-pressed="${preferences.grid}">1″ grid</button>
        <button type="button" data-live-map-sight-toggle aria-pressed="${preferences.sight}">Line of sight</button>
        ${options?.showMapPlanner ? MAP_PLANNING_BUTTON : ''}
        ${modelPicker}
        <label class="live-map__marker-size" title="Used for units without verified base dimensions; known bases scale automatically in Top-down view">Fallback size
          <input type="range" min="14" max="38" step="2" value="${preferences.markerSize}" data-live-map-marker-size aria-label="Marker size for units without verified physical bases">
          <output data-live-map-marker-value>${preferences.markerSize}px</output>
        </label>
      </div>
    </details>
    ${unit ? `<details class="live-map__more-tools live-map__model-tools" name="live-map-tools" data-view-key="live-map-model-tools-${esc(unit.id)}">
      <summary aria-label="Models for ${esc(unit.name ?? unit.id)}">Models</summary>
      <div class="live-map__more-tools-content">
        ${canExpand ? `<button type="button" data-live-map-squad-toggle data-unit-id="${esc(unit.id)}" aria-pressed="${Boolean(preferences.expandedUnits[unit.id])}">${preferences.expandedUnits[unit.id] ? 'Hide models' : 'Expand squad'} · ${count}</button>` : ''}
        ${base?.shape === 'oval' ? `<button type="button" data-live-map-oval-rotate data-unit-id="${esc(unit.id)}" title="Rotate selected oval base 45 degrees; display only" aria-label="Rotate ${esc(unit.name)} oval base 45 degrees">Rotate oval · ${ovalRotation}°</button>` : ''}
        <fieldset class="live-map__base-fields">
          <legend>Model base size</legend>
          <label>Width (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" data-live-map-base-width value="${esc(dimensions?.width ?? '')}"></label>
          <label>Length (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" placeholder="Round" data-live-map-base-length value="${esc(dimensions?.length ?? '')}"></label>
          <button type="button" data-live-map-base-apply>Set base size</button>
          <small data-live-map-base-source>${esc(baseSource)}${base ? ' · ' + esc(modelBaseSizeLabel(base)) : ''}</small>
          <small data-live-map-base-explanation>Dashed outline shows one model’s base.</small>
        </fieldset>
        <small data-live-map-base-status aria-live="polite"></small>
      </div>
    </details>` : ''}
  </nav>`;
  return { controls, key, unit, models, selectedModelIndex };
}

/**
 * A combined formation has one normal map marker. Its attached Leader may
 * retain an old independent coordinate in the save, but that model-base outline
 * should not float elsewhere on the normal compact map. Detailed model
 * placement can still show every member when the Bodyguard is expanded.
 */
export function shouldRenderLiveMemberBase(state, unit, expandedUnits = {}) {
  const root = getCombatFormationRoot(state, unit);
  return !root || root.id === unit?.id || expandedUnits[root.id] === true;
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
  bases.innerHTML = (state.units ?? []).filter(unit =>
    unit.status === 'deployed' && shouldRenderLiveMemberBase(state,unit,preferences.expandedUnits)
  ).map(unit => {
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
      const angle = base.shape === 'oval'
        ? (Object.prototype.hasOwnProperty.call(preferences.ovalAngles, unit.id)
          ? getLiveOvalAngle(unit, preferences.ovalAngles)
          : (Number.isFinite(model.angle) ? model.angle : getLiveOvalAngle(unit, preferences.ovalAngles)))
        : 0;
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


function drawIndividualModelHandles(container,state,preferences) {
  const layer=container.querySelector?.('[data-live-map-individual-models]');
  if(!layer) return;
  const markers=new Map(Array.from(container.querySelectorAll?.('.live-map [data-map-unit-id]')??[])
    .map(node=>[node.getAttribute('data-map-member-id')??node.getAttribute('data-map-unit-id'),node]));
  const parts=[];
  for(const unit of state.units??[]) {
    const active=Boolean(preferences.topDown&&preferences.expandedUnits[unit.id]&&unit.status==='deployed' &&
      shouldRenderLiveMemberBase(state,unit,preferences.expandedUnits));
    const count=Number(unit.currentStrength??unit.remainingStrength??unit.metadata?.currentModelCount??unit.metadata?.modelCount);
    const models=Array.isArray(unit.models)?unit.models:[];
    const expanded=active&&count>1&&models.length>1&&
      models.every(model=>Number.isFinite(model.position?.x)&&Number.isFinite(model.position?.y));
    markers.get(unit.id)?.classList?.toggle?.('is-squad-expanded',expanded);
    if(!expanded) continue;
    const base=modelBaseSizeForUnit(unit,preferences.baseSizes[sizeKey(unit)]);
    const width=base?.widthMm?base.widthMm/25.4/BOARD_WIDTH*100:1.5/BOARD_WIDTH*100;
    const height=base?.lengthMm?base.lengthMm/25.4/BOARD_HEIGHT*100:1.5/BOARD_HEIGHT*100;
    const ovalAngle=base?.shape==='oval'?getLiveOvalAngle(unit,preferences.ovalAngles):0;
    for(let i=0;i<models.length;i++) {
      const model=models[i];
      parts.push(`<div role="button" tabindex="0" class="live-map__individual-model ${base?.shape==='oval'?'is-oval':''} ${unit.ownerId===(state.activePlayer??state.battle?.activePlayerId)?'friendly':'opponent'}"
        data-live-model-unit-id="${esc(unit.id)}" data-live-model-id="${esc(model.id)}"
        style="left:${(model.position.x/BOARD_WIDTH*100).toFixed(5)}%;top:${((BOARD_HEIGHT-model.position.y)/BOARD_HEIGHT*100).toFixed(5)}%;width:${width.toFixed(5)}%;height:${height.toFixed(5)}%;--live-individual-angle:${ovalAngle}deg"
        aria-label="${esc(unit.name)} model ${i+1}; drag to adjust tabletop position" title="${esc(unit.name)} · Model ${i+1}">${i+1}</div>`);
    }
  }
  layer.innerHTML=parts.join('');
}

// Zoom changes presentation only. Stored unit coordinates are never changed.
export function createLiveMapView() {
  let zoom = 1, left = 0, top = 0;
  let liveZoomed = false;
  const preferences = loadMapPreferences();
  let renderedState = {}, renderedOptions = {};
  return {
    render(state, options) {
      renderedState = state ?? {};
      renderedOptions = options ?? {};
      const stylesheet = new URL('./styles/live-map.css', import.meta.url);
      stylesheet.searchParams.set('v', 'compact-map-tools-3');
      const href = stylesheet.href;
      const symbolsStylesheet = new URL('./styles/live-map-symbols.css', import.meta.url);
      symbolsStylesheet.searchParams.set('v', 'approved-symbols-2');
      const symbolsHref = symbolsStylesheet.href;
      const controls = liveTools(state, options, preferences, liveZoomed);
      let map = renderBattlefieldMap(state, { ...options, compactMarkers:true, showMeasurements:false, plannerStyleObjectives:true, activationForUnit:id => getUnitActivationPresentation(state,id) });
      map = applyApprovedLiveMapSymbols(map, state, { preserveObjectiveLabels: true, numberedMarkers: false });
      map = applyLiveMapStatusBadges(map, state);
      map = addPrecisionOverlay(map);
      map = map.replace('<div class="battlefield-map__board"', `<div class="live-map__viewport${preferences.topDown ? ' is-top-down' : ''}" data-live-map-viewport><div class="live-map__canvas" data-live-map-canvas style="width:${zoom*100}%;height:${preferences.topDown ? 'auto' : zoom*100+'%'}"><div class="battlefield-map__board"`);
      map = map.replace('<!-- battlefield-map-board-end -->', '</div></div>');
      // Keep the control picker inside the fitted viewport so it never consumes
      // battlefield space or changes the 60:44 map geometry.
      map = map.replace('data-live-map-viewport>', 'data-live-map-viewport><div class="live-map__objective-picker" data-map-objective-picker hidden></div>');
      return `<link rel="stylesheet" href="${esc(href)}"><link rel="stylesheet" href="${esc(symbolsHref)}"><div class="live-map${preferences.topDown ? ' is-top-down is-planner-view' : ' is-standard'}" data-live-map-mode="${preferences.topDown ? 'top-down' : 'standard'}" data-live-zoom="${liveZoomed ? '2' : '1'}" style="--live-marker-size:${preferences.markerSize}px">${controls.controls}${map}</div>`;
    },
    bind(container, state = renderedState, options = renderedOptions, liveSession = null) {
      const viewport = container.querySelector('[data-live-map-viewport]');
      const canvas = container.querySelector('[data-live-map-canvas]');
      if (viewport) {
        viewport.scrollLeft = left; viewport.scrollTop = top;
        viewport.addEventListener('scroll', () => { left = viewport.scrollLeft; top = viewport.scrollTop; });
        viewport.addEventListener('pointerdown', () => {
          container.querySelectorAll?.('.live-map__more-tools[open]').forEach(menu => { menu.open = false; });
        });
      }
      let selectedModelIndex = liveTools(state, options, preferences).selectedModelIndex;
      drawPrecision(container, state, options, preferences, selectedModelIndex);
      applyLiveMarkerBaseScales(container, state, preferences.baseSizes, preferences.ovalAngles);
      drawIndividualModelHandles(container,state,preferences);
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
      const refreshUnitLabels = () => unitMarkers.forEach(marker => {
        const text = marker.firstChild;
        if (text?.nodeType !== 3) return;
        const id = markerUnitId(marker);
        const label = marker.getAttribute('data-map-formation-symbol') || unitSymbols.get(id);
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
        applyLiveMarkerBaseScales(container, state, preferences.baseSizes, preferences.ovalAngles);
        drawIndividualModelHandles(container,state,preferences);
        refreshObjectiveLabels();
        refreshUnitLabels();
      };
      refreshObjectiveLabels();
      refreshUnitLabels();
      container.querySelector('[data-live-map-style]')?.addEventListener('click', () => {
        preferences.topDown = !preferences.topDown;
        const objectivePicker = container.querySelector('[data-map-objective-picker]');
        if (objectivePicker) objectivePicker.hidden = true;
        saveMapPreferences(preferences);
        updateMapStyle();
      });
      container.querySelector('[data-live-map-squad-toggle]')?.addEventListener('click', event => {
        const unit=(state.units??[]).find(item=>item.id===options?.selectedUnitId);
        const session=liveSession;
        if(!unit||!session) return;
        const opening=!preferences.expandedUnits[unit.id];
        if(opening&&(!Array.isArray(unit.models)||
          unit.models.length!==Number(unit.currentStrength??unit.remainingStrength??unit.metadata?.currentModelCount??unit.metadata?.modelCount)||
          !unit.models.every(model=>Number.isFinite(model.position?.x)&&Number.isFinite(model.position?.y)))) {
          try {
            // Mark expanded before dispatch since the session immediately
            // notifies all phase views and re-renders the map.
            preferences.expandedUnits[unit.id]=true;
            saveMapPreferences(preferences);
            session.dispatch({type:COMMAND_TYPES.EXPAND_LIVE_SQUAD_MODELS,payload:{
              unitId:unit.id,playerId:unit.ownerId,baseOverride:preferences.baseSizes[sizeKey(unit)]??null
            }});
          } catch(error) {
            preferences.expandedUnits[unit.id]=false;
            saveMapPreferences(preferences);
            const status=container.querySelector('[data-live-map-base-status]');
            if(status) status.textContent=error?.message??String(error);
          }
          return;
        }
        preferences.expandedUnits[unit.id]=opening;
        saveMapPreferences(preferences);
        event.currentTarget.textContent=(opening?'Hide models':'Expand squad')+' · '+
          Number(unit.currentStrength??unit.remainingStrength??unit.metadata?.currentModelCount??unit.metadata?.modelCount);
        event.currentTarget.setAttribute('aria-pressed',String(opening));
        drawIndividualModelHandles(container,state,preferences);
      });
      container.querySelector('[data-live-map-oval-rotate]')?.addEventListener('click', event => {
        const unit = (state.units ?? []).find(item => item.id === options?.selectedUnitId);
        const key = sizeKey(unit);
        const base = unit && modelBaseSizeForUnit(unit, preferences.baseSizes[key]);
        if (!unit || base?.shape !== 'oval') return;
        const angle = (getLiveOvalAngle(unit, preferences.ovalAngles) + 45) % 180;
        preferences.ovalAngles[unit.id] = angle;
        saveMapPreferences(preferences);
        event.currentTarget.textContent = 'Rotate oval · ' + angle + '°';
        drawPrecision(container, state, options, preferences, selectedModelIndex);
        applyLiveMarkerBaseScales(container, state, preferences.baseSizes, preferences.ovalAngles);
        drawIndividualModelHandles(container,state,preferences);
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
        liveZoomed = !liveZoomed;
        liveMap?.setAttribute('data-live-zoom', liveZoomed ? '2' : '1');
        event.currentTarget.setAttribute('aria-pressed', String(liveZoomed));
        event.currentTarget.textContent = liveZoomed ? 'Fit map' : '2× zoom';
        if (!liveZoomed && viewport) { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
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
        applyLiveMarkerBaseScales(container, state, preferences.baseSizes, preferences.ovalAngles);
        drawIndividualModelHandles(container,state,preferences);
      });
      const individualLayer=container.querySelector?.('[data-live-map-individual-models]');
      if(individualLayer&&liveSession) {
        let drag=null;
        const locate=(event,board)=>{
          const rect=board.getBoundingClientRect?.();
          if(!rect?.width||!rect?.height) return null;
          return {x:Math.max(0,Math.min(BOARD_WIDTH,(event.clientX-rect.left)/rect.width*BOARD_WIDTH)),
            y:Math.max(0,Math.min(BOARD_HEIGHT,(1-(event.clientY-rect.top)/rect.height)*BOARD_HEIGHT))};
        };
        individualLayer.addEventListener('pointerdown',event=>{
          const target=event.target?.closest?.('[data-live-model-id]');
          if(!target) return;
          const board=target.closest?.('[data-battlefield-map-board]');
          const unitId=target.getAttribute('data-live-model-unit-id');
          const modelId=target.getAttribute('data-live-model-id');
          const unit=liveSession.getState().units.find(item=>item.id===unitId);
          const pointer=board&&locate(event,board);
          if(!pointer||unit?.status!=='deployed'||!unit.models?.length)return;
          // Model bases can sit only ~20px apart on a fitted iPad map while
          // their 44px touch regions overlap. Choose the *nearest centre*
          // inside the touched squad, not the last overlapping DOM element.
          const positioned=unit.models.filter(model=>
            Number.isFinite(model.position?.x)&&Number.isFinite(model.position?.y));
          if(!positioned.length)return;
          const model=positioned.reduce((nearest,item)=>
            Math.hypot(item.position.x-pointer.x,item.position.y-pointer.y) <
            Math.hypot(nearest.position.x-pointer.x,nearest.position.y-pointer.y) ? item : nearest);
          const activeTarget=Array.from(individualLayer.querySelectorAll?.('[data-live-model-id]')??[])
            .find(node=>node.getAttribute('data-live-model-id')===model.id)??target;
          drag={pointerId:event.pointerId,unitId,modelId:model.id,board,target:activeTarget,
            x:event.clientX,y:event.clientY,start:{...model.position},pointer,moved:false};
          try{activeTarget.setPointerCapture?.(event.pointerId);}catch{}
          event.stopPropagation?.();
        });
        individualLayer.addEventListener('pointermove',event=>{
          if(!drag||event.pointerId!==drag.pointerId)return;
          if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5&&!drag.moved)return;
          const point=locate(event,drag.board);
          if(!point)return;
          drag.moved=true;
          event.preventDefault?.();
          event.stopPropagation?.();
          const x=Math.max(0,Math.min(BOARD_WIDTH,drag.start.x+point.x-drag.pointer.x));
          const y=Math.max(0,Math.min(BOARD_HEIGHT,drag.start.y+point.y-drag.pointer.y));
          drag.target.style.left=x/BOARD_WIDTH*100+'%';
          drag.target.style.top=(BOARD_HEIGHT-y)/BOARD_HEIGHT*100+'%';
        });
        individualLayer.addEventListener('pointerup',event=>{
          if(!drag||event.pointerId!==drag.pointerId)return;
          const current=drag;
          drag=null;
          event.stopPropagation?.();
          if(!current.moved)return;
          const point=locate(event,current.board);
          if(!point)return;
          const latest=liveSession.getState();
          const unit=latest.units.find(item=>item.id===current.unitId);
          const models=unit?.models;
          if(!Array.isArray(models)||!models.some(model=>model.id===current.modelId))return;
          const position={x:Math.round(Math.max(0,Math.min(BOARD_WIDTH,current.start.x+point.x-current.pointer.x))*10)/10,
            y:Math.round(Math.max(0,Math.min(BOARD_HEIGHT,current.start.y+point.y-current.pointer.y))*10)/10};
          try{
            liveSession.dispatch({type:COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,payload:{
              unitId:unit.id,playerId:unit.ownerId,
              moves:models.map(model=>({modelId:model.id,
                position:model.id===current.modelId?position:model.position}))
            }});
          }catch(error){
            const status=container.querySelector?.('[data-live-map-base-status]');
            if(status)status.textContent=error?.message??String(error);
            drawIndividualModelHandles(container,latest,preferences);
          }
        });
        individualLayer.addEventListener('pointercancel',()=>{drag=null;drawIndividualModelHandles(container,liveSession.getState(),preferences);});
        individualLayer.addEventListener('click',event=>{
          if(event.target?.closest?.('[data-live-model-id]'))event.stopPropagation?.();
        });
      }
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
