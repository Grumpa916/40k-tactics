import { attachmentParent } from '../rules/event-preparation.js';
import { mapUnitLabels, unitDisplayLabels } from './map-unit-labels.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
const BATTLEFIELD_MAP_STYLES = ".battlefield-map{color:inherit;min-width:0}.battlefield-map__meta,.battlefield-map__legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:#aeb9c7;font-size:12px;margin:8px 0}.battlefield-map__board{position:relative;width:100%;aspect-ratio:15/11;overflow:hidden;border:1px solid #596879;border-radius:10px;background-color:#17221f;background-image:linear-gradient(to right,rgba(220,235,230,.10) 1px,transparent 1px),linear-gradient(to bottom,rgba(220,235,230,.10) 1px,transparent 1px);background-size:10% 9.0909%;touch-action:pan-y;overscroll-behavior:contain}.battlefield-map__edge{position:absolute;left:0;right:0;z-index:1;text-align:center;padding:3px 4px;font-size:10px;letter-spacing:.03em;background:rgba(8,14,18,.72);color:#dbe5ee;pointer-events:none}.battlefield-map__edge--top{top:0}.battlefield-map__edge--bottom{bottom:0}.battlefield-map__ruler{position:absolute;inset:0;z-index:2;pointer-events:none;color:#fff;font-size:10px;font-weight:800;text-shadow:0 1px 3px #000;background:transparent}.battlefield-map__ruler span{position:absolute;padding:1px 3px;border-radius:3px;background:#101820d9;transform:translate(-50%,-50%)}.battlefield-map__ruler--top{inset:14px 0 auto;height:0}.battlefield-map__ruler--left{inset:0 auto 0 2px;width:0}.battlefield-map__ruler--left span{transform:translateY(-50%)}.battlefield-map__terrain-measurements{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;overflow:visible}.battlefield-map__measurement-box{fill:rgba(115,155,190,.08);stroke:#6f8fa9;stroke-width:.28;vector-effect:non-scaling-stroke;opacity:.85}.battlefield-map__dimension-line,.battlefield-map__dimension-tick{stroke:#e7eef5;stroke-width:.24;vector-effect:non-scaling-stroke}.battlefield-map__dimension-anchor{fill:#f6d783;stroke:#101820;stroke-width:.25;vector-effect:non-scaling-stroke}.battlefield-map__dimension-leader{stroke:#aeb9c7;stroke-width:.18;stroke-dasharray:.6 .5;vector-effect:non-scaling-stroke}.battlefield-map__edge-dimension-line{stroke:#d9e5ef;stroke-width:.24;stroke-dasharray:1 .65;vector-effect:non-scaling-stroke}.battlefield-map__dimension-text{fill:#f4f8fb;font-family:Arial,sans-serif;font-size:2.15px;font-weight:900;paint-order:stroke;stroke:#071019;stroke-width:.7px;stroke-linejoin:round}.battlefield-map__geometry{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.battlefield-map__zone{fill:rgba(84,150,196,.12);stroke:rgba(130,190,232,.85);stroke-width:.18;stroke-dasharray:.7 .45}.battlefield-map__terrain{fill:rgba(135,145,132,.8);stroke:#d0d7d0;stroke-width:.28;stroke-linejoin:round}.battlefield-map__unit{position:absolute;transform:translate(-50%,-50%);z-index:2;max-width:32%;padding:4px 6px;border:1px solid #a9d8ff;border-radius:6px;background:#17344a;color:#f4f8ff;font-size:10px;font-weight:700;line-height:1.2;text-align:center;overflow-wrap:anywhere;box-shadow:0 1px 4px #0008;cursor:default;user-select:none;-webkit-user-select:none}.battlefield-map--planning .battlefield-map__unit,.battlefield-map--deployment .battlefield-map__unit{cursor:grab;touch-action:none}.battlefield-map__unit.is-selected{outline:3px solid #d6a8ff;outline-offset:2px;z-index:5}.battlefield-map__unit.is-unplaced{border-style:dashed;opacity:.9}.battlefield-map__unit.is-dragging{cursor:grabbing;z-index:8}.battlefield-map--live .battlefield-map__unit[role=button]{cursor:grab;touch-action:none}.battlefield-map__unit.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__objective{position:absolute;z-index:4;transform:translate(-50%,-50%);min-width:34px;max-width:88px;min-height:20px;padding:2px 5px;display:flex;align-items:center;justify-content:center;border:1.5px solid #8c98a5;border-radius:999px;background:#2b3138;color:#f4f7fa;font-size:8px;font-weight:800;line-height:1;text-align:center;box-shadow:0 1px 5px #000a;cursor:pointer;user-select:none;-webkit-user-select:none}.battlefield-map__objective.is-mine{border-color:#7ec8ff;background:#17496b;color:#eff9ff}.battlefield-map__objective.is-opponent{border-color:#ff9c93;background:#6b2727;color:#fff3f1}.battlefield-map__objective.is-contested{border-color:#f6d783;background:#66521c;color:#fff8d7}.battlefield-map__objective.is-uncontrolled{border-color:#8c98a5;background:#2b3138;color:#e3e7eb}.battlefield-map__selected-name{margin:4px 0;font-size:12px;line-height:1.3;overflow-wrap:anywhere}.battlefield-map__empty{position:absolute;inset:14% 8%;display:flex;align-items:center;justify-content:center;text-align:center;color:#d5e0df;font-size:13px;padding:12px;pointer-events:none}.battlefield-map__legend{justify-content:flex-start;gap:16px}.battlefield-map__legend span{display:inline-flex;align-items:center;gap:5px}.battlefield-map__legend i{width:10px;height:10px;display:inline-block;border:1px solid #a9d8ff;border-radius:3px;background:#17344a}.battlefield-map__legend i.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__legend i.objective{border:2px solid #f6d783;border-radius:50%;background:#46391a}.battlefield-map__notice{margin:8px 0 0;color:#9daab8;font-size:11px;line-height:1.4}.battlefield-map-section{min-width:0}.battlefield-map-section.is-fullscreen{position:fixed;inset:0;z-index:9999;overflow:auto;box-sizing:border-box;padding:12px;background:#101820}.battlefield-map-section.is-fullscreen .battlefield-map__board{height:calc(100vh - 190px);min-height:55vh;aspect-ratio:auto}.battlefield-map-section.is-fullscreen .battlefield-map__geometry{max-height:100%}.deployment-reserve-tray{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0;padding:12px;border:1px solid #8d6bb1;border-radius:9px;background:#20182a;color:#f2eaff}.deployment-reserve-tray h3{flex:0 0 100%;margin:0;font-size:14px}.deployment-reserve-tray__unit{display:inline-flex;align-items:center;min-height:36px;padding:7px 10px;border:1px solid #8d6bb1;border-radius:7px;background:#30213e;font-size:12px;font-weight:750;overflow-wrap:anywhere}.deployment-reserve-tray p{margin:0;font-size:12px;opacity:.8}@media(max-width:650px){.battlefield-map__unit{max-width:36%;padding:3px 4px;font-size:9px}.battlefield-map__edge{font-size:9px}}";
import { getBattlePrimaryMissions, getEventCompanionMapLayout } from "../rules/event-companion-map-catalog.js";
import { getEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides.js";

const BATTLEFIELD_WIDTH_IN = 60;
const BATTLEFIELD_HEIGHT_IN = 44;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function isValidBattlefieldPosition(position) {
  return Boolean(position && Number.isFinite(position.x) && Number.isFinite(position.y) &&
    position.x >= 0 && position.x <= BATTLEFIELD_WIDTH_IN && position.y >= 0 && position.y <= BATTLEFIELD_HEIGHT_IN);
}

export function battlefieldPositionToPercent(position) {
  if (!isValidBattlefieldPosition(position)) return null;
  return { left: position.x / BATTLEFIELD_WIDTH_IN * 100, top: (BATTLEFIELD_HEIGHT_IN - position.y) / BATTLEFIELD_HEIGHT_IN * 100 };
}

function averagePosition(positions) {
  const valid = positions.filter(isValidBattlefieldPosition);
  if (!valid.length) return null;
  return { x: valid.reduce((sum, position) => sum + position.x, 0) / valid.length,
    y: valid.reduce((sum, position) => sum + position.y, 0) / valid.length };
}

function unitPosition(unit, state) {
  const initialDeployment = state.battlefieldMap?.actualDeployment?.[unit.id];
  const hasRecordedMovement = (state.history ?? []).some((event) =>
    ["unit.normal_move_resolved", "unit.advanced"].includes(event?.type) && event.payload?.unitId === unit.id &&
    Array.isArray(event.payload?.moves) && event.payload.moves.length > 0);
  if (initialDeployment && !hasRecordedMovement) {
    const position = initialDeployment.position ?? initialDeployment;
    if (isValidBattlefieldPosition(position)) return position;
  }
  if (Array.isArray(unit.models) && unit.models.length && unit.models.every((model) => isValidBattlefieldPosition(model?.position))) {
    return averagePosition(unit.models.map((model) => model.position));
  }
  return isValidBattlefieldPosition(unit.position) ? unit.position : null;
}

function selectedLayoutGeometry(state) {
  const setup = state.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  const missions = getBattlePrimaryMissions(setup.myDisposition, setup.opponentDisposition);
  if (!missions) return null;
  return getEventCompanionMapLayout(missions.myMission, missions.opponentMission, setup.layout);
}

function geometryOverlay(geometry, terrainOnly = false) {
  if (!geometry?.verified) return "";
  const zones = terrainOnly ? "" : Object.entries(geometry.deploymentZones ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__zone" data-zone="' + escapeHtml(name) + '" points="' + points + '" aria-label="Deployment zone ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  const terrain = Object.entries(geometry.terrainGeometry ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__terrain" data-terrain="' + escapeHtml(name) + '" points="' + points + '" aria-label="Terrain footprint ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  return '<svg class="battlefield-map__geometry" viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="Battlefield layout overview; use the official Event Companion diagram for exact terrain placement">' + zones + terrain + '</svg>';
}

function terrainEdgeMeasurementOverlay(geometry, sourceMeasurements = [], sourceLines = []) {
  if (!geometry?.verified || !geometry.terrainGeometry) return "";
  const px = (x) => Number(x) / 60 * 100;
  const py = (y) => (44 - Number(y)) / 44 * 100;
  const placementOverlay = getEventCompanionPlacementOverlay(geometry.page);
  const activeMeasurements = placementOverlay?.measurements ?? sourceMeasurements;
  const activeLines = placementOverlay?.lines ?? sourceLines;
  const lines = (Array.isArray(activeLines) ? activeLines : []).filter((line) => Array.isArray(line) && line.length === 4 && line.every((v) => Number.isFinite(Number(v))))
    .map((line) => '<line class="battlefield-map__dimension-line" data-source-line="true" x1="' + px(line[0]) + '" y1="' + py(line[1]) + '" x2="' + px(line[2]) + '" y2="' + py(line[3]) + '"/>');
  const anchors = (placementOverlay?.anchors ?? []).filter((item) => item && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
    .map((item) => '<circle class="battlefield-map__dimension-anchor" data-placement-anchor="' + escapeHtml(item.terrain ?? "terrain") + '" cx="' + px(item.x) + '" cy="' + py(item.y) + '" r=".7"></circle>');
  const labels = (Array.isArray(activeMeasurements) ? activeMeasurements : []).filter((item) => item && typeof item.value === "string" && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
    .map((item) => '<text class="battlefield-map__dimension-text" data-source-x="' + Number(item.x) + '" data-source-y="' + Number(item.y) + '" x="' + px(item.x) + '" y="' + py(item.y) + '" text-anchor="middle">' + escapeHtml(item.value) + '</text>');
  const ariaLabel = placementOverlay ? "Event Companion terrain placement references" : "Original Event Companion terrain measurements";
  return lines.length || anchors.length || labels.length ? '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="' + ariaLabel + '">' + lines.join("") + anchors.join("") + labels.join("") + '</svg>' : "";
}

function positionsForMode(state, mode) {
  if (mode === "planning") return state.battlefieldMap?.deploymentPlan ?? {};
  if (mode === "deployment") return state.battlefieldMap?.actualDeployment ?? {};
  return null;
}
function modeDescription(mode, mapLabel = null) {
  if (mapLabel) return mapLabel;
  if (mode === "planning") return "Planning positions only";
  if (mode === "deployment") return "Actual initial deployment";
  return "Live battlefield positions";
}
function playerLabel(state, playerId) { return (state.players ?? []).find((player) => player.id === playerId)?.name ?? playerId ?? "Unknown player"; }
function perspectiveObjectiveName(name, state, perspectivePlayerId) {
  const attacker = state.preGameSetup?.attackerPlayerId ?? null;
  const defender = state.preGameSetup?.defenderPlayerId ?? null;
  const homeOwner = name === "Attacker Home" ? attacker : name === "Defender Home" ? defender : null;
  if (homeOwner) return homeOwner === perspectivePlayerId ? "My Home" : "Opponent Home";
  if (name === "Expansion 1" || name === "Expansion 2") {
    const positions = selectedLayoutGeometry(state)?.objectivePositions ?? {};
    const myHomeName = perspectivePlayerId === attacker ? "Attacker Home" :
      perspectivePlayerId === defender ? "Defender Home" : null;
    const myHome = myHomeName ? positions[myHomeName] : null;
    const expansion1 = positions["Expansion 1"];
    const expansion2 = positions["Expansion 2"];
    if (myHome && expansion1 && expansion2) {
      const distance = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
      const myExpansionName = distance(expansion1, myHome) <= distance(expansion2, myHome)
        ? "Expansion 1" : "Expansion 2";
      return name === myExpansionName ? "My Expansion" : "Opponent Expansion";
    }
  }
  if (name === "Central 1") return "Center 1";
  if (name === "Central 2") return "Center 2";
  return name;
}
function compactObjectiveLabel(label) {
  return ({
    "My Home": "MY HOME",
    "Opponent Home": "OPP HOME",
    "My Expansion": "MY EXP",
    "Opponent Expansion": "OPP EXP",
    "Center 1": "C1",
    "Center 2": "C2"
  })[label] ?? label;
}

function objectiveControlClass(objective, perspectivePlayerId) {
  const control = objective?.control;
  if (!control || !control.controlState || control.controlState === "uncontrolled") return "is-uncontrolled";
  if (control.controlState === "contested") return "is-contested";
  return control.controllerId === perspectivePlayerId ? "is-mine" : "is-opponent";
}

function objectiveControlLabel(objective, state) {
  const control = objective.control;
  if (!control || !control.controlState) return "Control not recorded";
  if (control.controlState === "uncontrolled") return "Uncontrolled";
  if (control.controlState === "contested") {
    const contesting = (control.contestingPlayerIds ?? []).map((id) => playerLabel(state, id));
    return contesting.length ? "Contested by " + contesting.join(" and ") : "Contested";
  }
  if (control.controllerId) return "Controlled by " + playerLabel(state, control.controllerId);
  return "Control not recorded";
}
function liveStatusLabel(state) {
  if (!state.battle) return "";
  if (state.battle.status === "deployment") return "Deployment in progress";
  if (state.battle.status === "setup") return "Battle setup";
  if (state.battle.status !== "active") return "Battle " + String(state.battle.status);
  const round = Number.isInteger(state.battle.round) ? "Round " + state.battle.round : "Round not recorded";
  const phase = state.phase ? String(state.phase).replaceAll("_", " ") : "Phase not recorded";
  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId;
  const activePlayer = activePlayerId ? playerLabel(state, activePlayerId) : "Active player not recorded";
  return round + " · " + phase + " · " + activePlayer;
}

export function renderBattlefieldMap(state, {
  mode = "live", perspectivePlayerId = state?.activePlayer ?? null, interactivePlayerId = perspectivePlayerId, selectedUnitId = null, showUnits = true,
  showMeasurements = mode === "live", showTerrainEdgeMeasurements = false, terrainMeasurements = [],
  terrainMeasurementLines = [], mapLabel = null, compactMarkers = false, activationForUnit = () => ''
} = {}) {
  if (!["planning", "deployment", "live"].includes(mode)) throw new RangeError("Unknown battlefield map mode: " + mode);
  const safeState = state && typeof state === "object" ? state : {};
  const plannedOrDeployed = positionsForMode(safeState, mode);
  const layoutGeometry = selectedLayoutGeometry(safeState);
  const units = Array.isArray(safeState.units) ? safeState.units : [];
  const unitLabels = mapUnitLabels(units);
  const fullUnitLabels = unitDisplayLabels(units);
  const unitNodes = [];
  let positionedUnits = 0;
  const declaredReserves = safeState.battlefieldMap?.declaredReserves ?? {};
  const visibleUnits = showUnits ? units.filter((unit) => {
    if (!unit || !unit.id || unit.status === "destroyed" || unit.status === "embarked" || (mode !== "live" && attachmentParent(safeState, unit))) return false;
    if (mode === "planning") return unit.ownerId === perspectivePlayerId;
    if (mode === "deployment") return !declaredReserves[unit.id];
    return unit.status === "deployed";
  }) : [];
  const stagedPosition = (index, total, friendly) => {
    const columns = Math.min(6, Math.max(1, total)); const column = index % columns; const row = Math.floor(index / columns);
    return { x: 5 + column * (50 / Math.max(1, columns - 1)), y: friendly ? 2.5 + row * 3.2 : 41.5 - row * 3.2 };
  };
  const visibleIndex = new Map();
  for (const unit of visibleUnits) {
    const friendly = perspectivePlayerId != null && unit.ownerId === perspectivePlayerId;
    const key = mode === "planning" ? "friendly" : (friendly ? "friendly" : "opponent");
    const index = visibleIndex.get(key) ?? 0; visibleIndex.set(key, index + 1);
    let position = null; let unplaced = false;
    if (mode === "live") position = unitPosition(unit, safeState);
    else {
      const record = plannedOrDeployed?.[unit.id]; position = record?.position ?? record ?? null;
      if (!isValidBattlefieldPosition(position)) {
        unplaced = true;
        const total = visibleUnits.filter((candidate) => mode === "planning" ? candidate.ownerId === perspectivePlayerId : (perspectivePlayerId != null && candidate.ownerId === perspectivePlayerId) === friendly).length;
        position = stagedPosition(index, total, friendly);
      }
    }
    const percent = battlefieldPositionToPercent(position); if (!percent) continue; positionedUnits += 1;
    const sideClass = friendly ? "friendly" : "opponent"; const marker = compactMarkers ? escapeHtml(unitLabels.get(unit.id)) : escapeHtml((unit.name ?? unit.id).slice(0, 22));
    const activation = activationForUnit(unit.id);
    const activationBadge = activation ? '<span class="unit-activation-badge" aria-label="' + (activation === 'resolved' ? 'Activation complete' : 'Activation in progress') + '">' + (activation === 'resolved' ? '✓' : '…') + '</span>' : '';
    const modelCount = Array.isArray(unit.models) ? unit.models.length : 0; const isSelected = unit.id === selectedUnitId; const battleShocked = isUnitBattleShocked(unit);
    unitNodes.push('<div class="battlefield-map__unit ' + sideClass + (compactMarkers ? ' is-compact' : '') + (isSelected ? ' is-selected' : '') + (unplaced ? ' is-unplaced' : '') + (battleShocked ? ' is-battle-shocked' : '') + '" data-map-unit-id="' + escapeHtml(unit.id) + '"' + (unplaced ? ' data-map-unit-unplaced="true"' : '') + (mode !== "live" || unit.ownerId === interactivePlayerId ? ' role="button" tabindex="0" aria-label="Select ' + escapeHtml(fullUnitLabels.get(unit.id)) + '"' : '') + ' style="left:' + percent.left + '%;top:' + percent.top + '%" title="' + escapeHtml(fullUnitLabels.get(unit.id)) + (unplaced ? ' · not placed' : '') + (battleShocked ? ' · Battle-shocked' : '') + (modelCount ? ' · ' + modelCount + ' models' : '') + '">' + marker + activationBadge + '</div>');
  }
  const objectives = Array.isArray(safeState.objectives) ? safeState.objectives : [];
  const layoutObjectiveNodes = layoutGeometry ? Object.entries(layoutGeometry.objectivePositions ?? {}).map(([name, position]) => {
    const percent = battlefieldPositionToPercent(position); if (!percent) return "";
    const objective = objectives.find((item) => item && (item.layoutObjective === name || item.id === "event-companion:" + name));
    const objectiveId = objective?.id ?? ("event-companion:" + name); const controlLabel = objective ? objectiveControlLabel(objective, safeState) : "Uncontrolled";
    const label = perspectiveObjectiveName(name, safeState, perspectivePlayerId);
    const displayLabel = mode === "live" ? compactObjectiveLabel(label) : label;
    const controlClass = objectiveControlClass(objective, perspectivePlayerId);
    return '<button type="button" class="battlefield-map__objective battlefield-map__objective--layout ' + controlClass + '" data-layout-objective="' + escapeHtml(name) + '" data-map-objective-id="' + escapeHtml(objectiveId) + '" data-objective-control="' + escapeHtml(controlLabel) + '" style="left:' + percent.left + '%;top:' + percent.top + '%" title="' + escapeHtml(label + " · " + controlLabel + " · Event Companion p. " + layoutGeometry.page) + '">' + escapeHtml(displayLabel) + '</button>';
  }).join("") : "";
  const objectiveNodes = layoutGeometry ? "" : objectives.filter((objective) => objective && isValidBattlefieldPosition(objective.position)).map((objective) => {
    const percent = battlefieldPositionToPercent(objective.position); const name = objective.name ?? objective.id ?? "Objective"; const controlLabel = objectiveControlLabel(objective, safeState);
    return '<button type="button" class="battlefield-map__objective ' + objectiveControlClass(objective, perspectivePlayerId) + '" data-map-objective-id="' + escapeHtml(objective.id ?? objective.name) + '" data-objective-control="' + escapeHtml(controlLabel) + '" style="left:' + percent.left + '%;top:' + percent.top + '%" title="' + escapeHtml(name + " · " + controlLabel) + '">' + escapeHtml(String(name).slice(0, 18)) + '</button>';
  }).join("");
  const emptyMessage = !showUnits || positionedUnits ? "" : '<div class="battlefield-map__empty">No positions recorded for this map mode yet.</div>';
  const terrainMeasurementOverlay = showTerrainEdgeMeasurements ? terrainEdgeMeasurementOverlay(layoutGeometry, terrainMeasurements, terrainMeasurementLines) : "";
  const liveStatus = mode === "live" ? liveStatusLabel(safeState) : ""; const showCoordinateMeasurements = showMeasurements; const shownMapLabel = modeDescription(mode, mapLabel);
  const objectiveStatusSummary = objectives.filter((objective) => objective && isValidBattlefieldPosition(objective.position)).length ? objectives.filter((objective) => objective && isValidBattlefieldPosition(objective.position)).map((objective) => escapeHtml((objective.name ?? objective.id ?? "Objective") + ": " + objectiveControlLabel(objective, safeState))).join(" · ") : "";
  const boardAriaLabel = showCoordinateMeasurements ? shownMapLabel + ", 60 by 44 inch reference board with inch coordinate labels" : shownMapLabel + ", battlefield board";
  const selectedUnit = visibleUnits.find((unit) => unit.id === selectedUnitId);
  const selectedName = selectedUnit ? '<p class="battlefield-map__selected-name" aria-live="polite">Selected: <strong>' + escapeHtml(fullUnitLabels.get(selectedUnit.id)) + '</strong> · ' + escapeHtml(playerLabel(safeState, selectedUnit.ownerId)) + '</p>' : '';
  return '<style>' + BATTLEFIELD_MAP_STYLES + '</style><div class="battlefield-map battlefield-map--' + mode + '" data-battlefield-map data-map-mode="' + mode + '">' +
    '<div class="battlefield-map__meta"><span>' + shownMapLabel + '</span>' + (showCoordinateMeasurements ? '<span>60″ × 44″ reference grid</span>' : '') + (liveStatus ? '<span data-map-game-status>' + escapeHtml(liveStatus) + '</span>' : '') + (layoutGeometry ? '<span data-map-layout-status>Event Companion layout ' + escapeHtml(layoutGeometry.layout) + ' · p. ' + layoutGeometry.page + '</span>' : '') + '</div>' +
    (objectiveStatusSummary && mode === "live" ? '<p class="battlefield-map__meta" data-map-objective-status>' + objectiveStatusSummary + '</p>' : '') +
    '<div class="battlefield-map__board" data-battlefield-map-board role="application" aria-label="' + boardAriaLabel + '">' +
    (showCoordinateMeasurements ? '<div class="battlefield-map__edge battlefield-map__edge--top">Opponent edge · Y=44″</div>' : '') +
    (showCoordinateMeasurements ? '<div class="battlefield-map__ruler battlefield-map__ruler--top" aria-label="Horizontal inch measurements">' + [0,10,20,30,40,50,60].map((inch) => '<span style="left:' + (inch / 60 * 100) + '%">' + inch + '″</span>').join("") + '</div><div class="battlefield-map__ruler battlefield-map__ruler--left" aria-label="Vertical inch measurements">' + [0,10,20,30,40,44].map((inch) => '<span style="top:' + ((44 - inch) / 44 * 100) + '%">' + inch + '″</span>').join("") + '</div>' : '') +
    geometryOverlay(layoutGeometry, showTerrainEdgeMeasurements) + terrainMeasurementOverlay + objectiveNodes + layoutObjectiveNodes + unitNodes + emptyMessage +
    (showCoordinateMeasurements ? '<div class="battlefield-map__edge battlefield-map__edge--bottom">Your edge · Y=0″</div>' : '') + '</div>' +
    '<!-- battlefield-map-board-end -->' + selectedName + (showUnits ? '<div class="battlefield-map__legend"><span><i class="friendly"></i> Your army</span><span><i class="opponent"></i> Opponent</span><span><i class="objective" style="background:#17496b;border-color:#7ec8ff"></i> My control</span><span><i class="objective" style="background:#6b2727;border-color:#ff9c93"></i> Opponent control</span><span><i class="objective" style="background:#66521c;border-color:#f6d783"></i> Contested</span></div>' : (layoutGeometry ? '<div class="battlefield-map__legend"><span><i class="objective"></i> Objective locations</span></div>' : '')) +
    '<p class="battlefield-map__notice">' + (showTerrainEdgeMeasurements ? "Printed Event Companion terrain dimensions are attached to reproducible V2 terrain corners. Values are copied from the official diagram; the drawn guides are placement references, not calculated measurements." : "Map positions are approximate. Terrain, deployment zones, line of sight, and tabletop measurements are not inferred by this reference grid.") + '</p></div>';
}
