import { getLiveUnitPosition } from '../rules/spatial-context.js';
import { getUnitStrengthAssessment } from '../rules/unit-status-summary.js';
import { isValidBattlefieldPosition, renderBattlefieldMap } from './battlefield-map.js';
import { BOARD_WIDTH, BOARD_HEIGHT, baseDimensions, clampToBoard, planningVisibility } from './map-planning-geometry.js';

const drafts = new WeakMap();
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const MAP_PLANNING_BUTTON = '<button type="button" data-open-map-planning>Map Planner</button>';

function planningUnits(state, mode) {
  const units = (state.units ?? []).filter(unit => mode === 'movement'
    ? unit.status === 'deployed'
    : !['destroyed', 'embarked'].includes(unit.status) && !state.battlefieldMap?.declaredReserves?.[unit.id]
  ).map(unit => {
    const map = state.battlefieldMap;
    const deployment = map?.actualDeployment?.[unit.id] ?? map?.deploymentPlan?.[unit.id];
    const recordedPosition = mode === 'movement'
      ? getLiveUnitPosition(state, unit)
      : (deployment?.position ?? deployment ?? getLiveUnitPosition(state, unit));
    const strength = getUnitStrengthAssessment(unit);
    const count = strength.currentModels ?? strength.startingModels ??
      unit.currentStrength ?? unit.remainingStrength ?? unit.metadata?.currentModelCount ??
      unit.metadata?.modelCount ?? (unit.models?.length || 1);
    return {
      id: unit.id, ownerId: unit.ownerId, name: unit.name ?? unit.id,
      sizeKey: unit.metadata?.datasheetId || unit.id,
      count: Math.max(1, Math.min(100, Math.trunc(Number(count)) || 1)),
      position: isValidBattlefieldPosition(recordedPosition)
        ? { x: recordedPosition.x, y: BOARD_HEIGHT - recordedPosition.y }
        : null,
      expanded: false, models: null, angle: 0
    };
  });

  const positionlessIndexByPlayer = new Map();
  for (const unit of units) {
    if (unit.position) continue;
    const index = positionlessIndexByPlayer.get(unit.ownerId) ?? 0;
    positionlessIndexByPlayer.set(unit.ownerId, index + 1);
    const column = index % 8;
    const row = Math.floor(index / 8);
    unit.position = {
      x: 3 + column * 7.7,
      y: unit.ownerId === (state.activePlayer ?? state.players?.[0]?.id)
        ? 2.5 + row * 2.5
        : BOARD_HEIGHT - 2.5 - row * 2.5
    };
  }
  return units;
}

function arrangeModels(unit, size) {
  const columns = Math.ceil(Math.sqrt(unit.count));
  const rows = Math.ceil(unit.count / columns);
  const stepX = Math.min((BOARD_WIDTH - 1) / columns, (size?.width ?? 1.2) + .3);
  const stepY = Math.min((BOARD_HEIGHT - 1) / rows, (size?.length ?? 1.2) + .3);
  const left = Math.max(.5, Math.min(BOARD_WIDTH - .5 - (columns - 1) * stepX,
    unit.position.x - (columns - 1) * stepX / 2));
  const top = Math.max(.5, Math.min(BOARD_HEIGHT - .5 - (rows - 1) * stepY,
    unit.position.y - (rows - 1) * stepY / 2));
  return Array.from({ length: unit.count }, (_, index) => ({
    position: { x: left + (index % columns) * stepX, y: top + Math.floor(index / columns) * stepY },
    angle: 0
  }));
}

function movePiece(unit, modelIndex, position) {
  if (modelIndex !== null) {
    unit.models[modelIndex].position = position;
    return;
  }
  if (unit.models && unit.position) {
    const dx = position.x - unit.position.x;
    const dy = position.y - unit.position.y;
    for (const model of unit.models) {
      model.position = clampToBoard({ x: model.position.x + dx, y: model.position.y + dy });
    }
  }
  unit.position = position;
}

function terrainFootprints(board) {
  return Array.from(board.querySelectorAll('polygon[data-terrain]'), polygon => {
    const points = polygon.getAttribute('points').trim().split(/\s+/).map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
    return { name: polygon.getAttribute('data-terrain'), points };
  }).filter(shape => shape.points.length >= 3 && shape.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
}

export function openMapPlanning(launcher, { session, mode, selectedUnitId, perspectivePlayerId }) {
  const document = launcher.ownerDocument;
  if (!document?.body) return;
  const state = session.getState();
  const setup = state.battlefieldMap?.missionSetup;
  const draftKey = JSON.stringify([mode, state.battle?.id, setup?.myDisposition, setup?.opponentDisposition, setup?.layout]);
  if (!drafts.has(session)) drafts.set(session, { modeDrafts: new Map(), sizes: new Map() });
  const { modeDrafts, sizes } = drafts.get(session);
  if (!modeDrafts.has(draftKey)) {
    modeDrafts.set(draftKey, { units: planningUnits(state, mode), grid: true, sight: false, ignored: new Set() });
  }
  const draft = modeDrafts.get(draftKey);
  let selected = draft.units.find(unit => unit.id === selectedUnitId) ?? draft.units[0];
  let modelIndex = selected?.expanded ? 0 : null;
  let drag = null;
  let zoomed = false;
  const playerId = perspectivePlayerId ?? state.players?.[0]?.id;
  const style = new URL('./styles/map-planning.css', import.meta.url);

  const dialog = document.createElement('dialog');
  dialog.className = 'map-planning';
  dialog.setAttribute('aria-label', 'Top-down map planner');
  dialog.innerHTML = `<link rel="stylesheet" href="${esc(style.href)}">
    <header class="map-planning__header"><div><h2>Map Planner</h2>
      <p>Drag models to try positions. Changes stay in this planning view for this battle session.</p></div>
      <button type="button" data-plan-close autofocus>Close</button></header>
    <div class="map-planning__workspace">
      <div><div class="map-planning__tools">
        <button type="button" data-plan-grid>1″ grid</button>
        <button type="button" data-plan-sight>Line of sight</button>
        <button type="button" data-plan-zoom>2× zoom</button>
      </div>
      <div class="map-planning__viewport"><div class="map-planning__canvas">
        ${renderBattlefieldMap(state, { mode: 'planning', perspectivePlayerId: playerId, showUnits: false, showMeasurements: false })}
      </div></div>
      <p data-plan-sight-status>Top-down view based on mapped terrain footprints.</p></div>
      <aside class="map-planning__sidebar">
        <label>Unit<select data-plan-unit></select></label>
        <div class="map-planning__tools">
          <button type="button" data-plan-expand>Spread squad</button>
          <button type="button" data-plan-rotate>Rotate base</button>
        </div>
        <label data-plan-model-label>Selected model<select data-plan-model></select></label>
        <div class="map-planning__dimensions">
          <label>Width (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" data-plan-width></label>
          <label>Length (mm)<input type="number" min="1" max="400" step="any" inputmode="decimal" placeholder="Round" data-plan-length></label>
        </div>
        <button type="button" data-plan-size>Set base size</button>
        <p data-plan-unit-status aria-live="polite"></p>
        <details><summary>Terrain blockers</summary><div class="map-planning__blockers"></div></details>
        <button type="button" data-plan-reload>Reload battle positions</button>
      </aside>
    </div>`;

  const find = selector => dialog.querySelector(selector);
  const board = find('[data-battlefield-map-board]');
  for (const objective of board.querySelectorAll('button')) objective.tabIndex = -1;
  const footprints = terrainFootprints(board);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-planning__overlay');
  svg.setAttribute('viewBox', `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-label', 'Planning board, 60 by 44 inches');
  const grid = (step, opacity) => {
    const lines = [];
    for (let x = step; x < BOARD_WIDTH; x += step) lines.push(`M${x} 0V${BOARD_HEIGHT}`);
    for (let y = step; y < BOARD_HEIGHT; y += step) lines.push(`M0 ${y}H${BOARD_WIDTH}`);
    return `<path d="${lines.join('')}" fill="none" stroke="#d5f0ee" stroke-opacity="${opacity}" stroke-width=".07" />`;
  };
  svg.innerHTML = `<g class="map-planning__grid">${grid(1, .24)}${grid(5, .42)}</g>
    <polygon class="map-planning__sight"></polygon><g class="map-planning__pieces"></g>`;
  board.append(svg);
  find('.map-planning__blockers').innerHTML = footprints.length
    ? footprints.map((shape, index) => `<label><input type="checkbox" data-plan-blocker="${index}" ${draft.ignored.has(shape.name) ? '' : 'checked'}> ${esc(shape.name)}</label>`).join('')
    : '<p>No terrain footprints are available for this layout.</p>';

  const currentModel = () => modelIndex === null ? selected : selected?.models?.[modelIndex];
  const sizeFor = unit => {
    const input = sizes.get(unit?.sizeKey);
    return input ? baseDimensions(input.width, input.length) : null;
  };
  const setPressed = (key, value) => find('[data-plan-' + key + ']').setAttribute('aria-pressed', String(value));

  function drawBoard() {
    svg.querySelector('.map-planning__grid').style.display = draft.grid ? '' : 'none';
    svg.querySelector('.map-planning__pieces').innerHTML = draft.units.map((unit, index) => {
      if (!unit.position) return '';
      const pieces = unit.expanded ? unit.models : [unit];
      const size = sizeFor(unit);
      return pieces.map((piece, pieceIndex) => {
        const actualBase = size && (unit.expanded || unit.count === 1);
        const rx = actualBase ? size.width / 2 : .63;
        const ry = actualBase ? size.length / 2 : .63;
        const active = unit === selected && modelIndex === (unit.expanded ? pieceIndex : null);
        const mark = unit.expanded ? String(pieceIndex + 1) : String(index + 1);
        const name = unit.name + (unit.expanded ? ' model ' + (pieceIndex + 1) : '');
        const { x, y } = piece.position;
        return `<g class="map-planning__piece${active ? ' is-selected' : ''}${actualBase ? '' : ' is-proxy'}${unit.ownerId === playerId ? '' : ' is-opponent'}"
          transform="translate(${x} ${y})" data-plan-piece="${index}" data-plan-piece-model="${unit.expanded ? pieceIndex : ''}">
          <title>${esc(name)}</title><circle r="${Math.max(.55, Math.min(rx, ry))}" fill="transparent"/>
          <ellipse class="map-planning__base" rx="${rx}" ry="${ry}" transform="rotate(${piece.angle})"/>
          <text>${mark}</text></g>`;
      }).join('');
    }).join('');
    const origin = currentModel()?.position;
    let message = 'Top-down sight uses the centre of the model. Check height, gaps and visibility on the table.';
    let points = [];
    if (draft.sight) {
      if (!origin || (selected.count > 1 && !selected.expanded)) {
        message = 'Place a single model or spread a squad and select one of its models to show sight.';
      } else if (!footprints.length) {
        message = 'No terrain footprints are available. Select a layout with mapped terrain to show sight.';
      } else {
        const result = planningVisibility(origin, footprints.filter(shape => !draft.ignored.has(shape.name)));
        points = result.points;
        if (result.containing) message = 'The model centre is inside ' + result.containing + '. Review this piece in Terrain blockers.';
      }
    }
    svg.querySelector('.map-planning__sight').setAttribute('points',
      points.map(point => point.x.toFixed(4) + ',' + point.y.toFixed(4)).join(' '));
    const status = find('[data-plan-sight-status]');
    if (status.textContent !== message) status.textContent = message;
  }

  function syncControls() {
    setPressed('grid', draft.grid);
    setPressed('sight', draft.sight);
    setPressed('zoom', zoomed);
    const picker = find('[data-plan-unit]');
    picker.innerHTML = draft.units.length ? draft.units.map((unit, index) =>
      `<option value="${index}">${index + 1}. ${esc(unit.name)}${unit.ownerId === playerId ? '' : ' · Opponent'}</option>`
    ).join('') : '<option>No units available</option>';
    picker.disabled = !selected;
    picker.value = selected ? String(draft.units.indexOf(selected)) : '';
    const modelPicker = find('[data-plan-model]');
    find('[data-plan-model-label]').hidden = !selected?.expanded;
    modelPicker.innerHTML = selected?.expanded
      ? selected.models.map((_, index) => `<option value="${index}">Model ${index + 1}</option>`).join('')
      : '';
    if (selected?.expanded) modelPicker.value = String(modelIndex);
    const expand = find('[data-plan-expand]');
    expand.disabled = !selected?.position || selected.count < 2;
    expand.textContent = selected?.expanded ? 'Group squad' : 'Spread squad';
    const size = sizeFor(selected);
    find('[data-plan-rotate]').disabled = !currentModel()?.position ||
      (selected.count > 1 && !selected.expanded) || !size || size.width === size.length;
    const dimensions = sizes.get(selected?.sizeKey);
    find('[data-plan-width]').value = dimensions?.width ?? '';
    find('[data-plan-length]').value = dimensions?.length ?? '';
    for (const key of ['width', 'length', 'size']) find('[data-plan-' + key + ']').disabled = !selected;
    find('[data-plan-unit-status]').textContent = !selected ? 'No units available in this view.'
      : !selected.position ? 'Tap an empty square to place this unit in the planner.'
      : size ? 'Tap or drag a marker. A blank length sets a round base.'
      : 'Enter a base width to replace the dashed model markers with bases drawn to scale.';
  }

  function select(unit, index = null) {
    selected = unit;
    modelIndex = unit?.expanded ? (index ?? 0) : null;
  }

  function pointAt(event) {
    const bounds = svg.getBoundingClientRect();
    return clampToBoard({
      x: (event.clientX - bounds.left) / bounds.width * BOARD_WIDTH,
      y: (event.clientY - bounds.top) / bounds.height * BOARD_HEIGHT
    });
  }

  svg.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    const token = event.target.closest('[data-plan-piece]');
    const point = pointAt(event);
    if (!token) {
      if (selected && !selected.position) drag = { id: event.pointerId, place: true, startX: event.clientX, startY: event.clientY };
      return;
    }
    const index = token.getAttribute('data-plan-piece-model');
    select(draft.units[Number(token.getAttribute('data-plan-piece'))], index === '' ? null : Number(index));
    const position = currentModel().position;
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      dx: position.x - point.x, dy: position.y - point.y };
    svg.setPointerCapture(event.pointerId);
    syncControls();
    drawBoard();
  });
  svg.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5) drag.moved = true;
    if (drag.place || !drag.moved) return;
    const point = pointAt(event);
    movePiece(selected, modelIndex, clampToBoard({ x: point.x + drag.dx, y: point.y + drag.dy }));
    drawBoard();
  });
  svg.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    if (drag.place && !drag.moved &&
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5 && selected && !selected.position) {
      movePiece(selected, null, pointAt(event));
    }
    drag = null;
    syncControls();
    drawBoard();
  });
  svg.addEventListener('pointercancel', () => { drag = null; });
  svg.addEventListener('lostpointercapture', () => { drag = null; });

  dialog.addEventListener('change', event => {
    if (event.target.matches('[data-plan-unit]')) select(draft.units[Number(event.target.value)]);
    else if (event.target.matches('[data-plan-model]')) modelIndex = Number(event.target.value);
    else if (event.target.matches('[data-plan-blocker]')) {
      const { name } = footprints[Number(event.target.dataset.planBlocker)];
      if (event.target.checked) draft.ignored.delete(name);
      else draft.ignored.add(name);
      drawBoard();
      return;
    } else return;
    syncControls();
    drawBoard();
  });

  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-plan-close')) return dialog.close();
    if (button.hasAttribute('data-plan-grid')) draft.grid = !draft.grid;
    else if (button.hasAttribute('data-plan-sight')) draft.sight = !draft.sight;
    else if (button.hasAttribute('data-plan-zoom')) {
      const viewport = find('.map-planning__viewport');
      const canvas = find('.map-planning__canvas');
      zoomed = !zoomed;
      canvas.toggleAttribute('data-zoomed', zoomed);
      viewport.scrollLeft = zoomed ? Math.max(0, (selected?.position?.x ?? 30) / BOARD_WIDTH * canvas.clientWidth - viewport.clientWidth / 2) : 0;
      viewport.scrollTop = zoomed ? Math.max(0, (selected?.position?.y ?? 22) / BOARD_HEIGHT * canvas.clientHeight - viewport.clientHeight / 2) : 0;
    } else if (button.hasAttribute('data-plan-expand') && selected?.position && selected.count > 1) {
      selected.expanded = !selected.expanded;
      if (selected.expanded && !selected.models) selected.models = arrangeModels(selected, sizeFor(selected));
      if (!selected.expanded) {
        const count = selected.models.length;
        selected.position = selected.models.reduce((center, model) => ({
          x: center.x + model.position.x / count, y: center.y + model.position.y / count
        }), { x: 0, y: 0 });
      }
      select(selected);
    } else if (button.hasAttribute('data-plan-rotate') && currentModel()) {
      currentModel().angle = (currentModel().angle + 45) % 180;
    } else if (button.hasAttribute('data-plan-size') && selected) {
      const width = find('[data-plan-width]').value;
      const length = find('[data-plan-length]').value;
      if (!width && !length) sizes.delete(selected.sizeKey);
      else if (baseDimensions(width, length)) sizes.set(selected.sizeKey, { width, length });
      else {
        find('[data-plan-unit-status]').textContent = 'Enter a width from 1 to 400 mm. Length is optional and uses the same limits.';
        return;
      }
    } else if (button.hasAttribute('data-plan-reload')) {
      draft.units = planningUnits(session.getState(), mode);
      select(draft.units.find(unit => unit.id === selected?.id) ?? draft.units[0]);
    } else return;
    syncControls();
    drawBoard();
  });

  dialog.addEventListener('close', () => {
    dialog.remove();
    if (launcher.isConnected) launcher.focus();
  }, { once: true });
  syncControls();
  drawBoard();
  document.body.append(dialog);
  dialog.showModal();
}
