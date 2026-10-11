const BATTLEFIELD_MAP_STYLES = ".battlefield-map{color:inherit;min-width:0}.battlefield-map__meta,.battlefield-map__legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:#aeb9c7;font-size:12px;margin:8px 0}.battlefield-map__board{position:relative;width:100%;aspect-ratio:15/11;overflow:hidden;border:1px solid #596879;border-radius:10px;background-color:#17221f;background-image:linear-gradient(to right,rgba(220,235,230,.10) 1px,transparent 1px),linear-gradient(to bottom,rgba(220,235,230,.10) 1px,transparent 1px);background-size:10% 9.0909%;touch-action:pan-y}.battlefield-map__edge{position:absolute;left:0;right:0;z-index:1;text-align:center;padding:3px 4px;font-size:10px;letter-spacing:.03em;background:rgba(8,14,18,.72);color:#dbe5ee;pointer-events:none}.battlefield-map__edge--top{top:0}.battlefield-map__edge--bottom{bottom:0}.battlefield-map__geometry{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.battlefield-map__zone{fill:rgba(84,150,196,.12);stroke:rgba(130,190,232,.85);stroke-width:.18;stroke-dasharray:.7 .45}.battlefield-map__terrain{fill:rgba(135,145,132,.8);stroke:#d0d7d0;stroke-width:.28;stroke-linejoin:round}.battlefield-map__unit{position:absolute;transform:translate(-50%,-50%);z-index:2;max-width:32%;padding:4px 6px;border:1px solid #a9d8ff;border-radius:6px;background:#17344a;color:#f4f8ff;font-size:10px;font-weight:700;line-height:1.2;text-align:center;overflow-wrap:anywhere;box-shadow:0 1px 4px #0008}.battlefield-map__unit.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__objective{position:absolute;z-index:2;transform:translate(-50%,-50%);width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #f6d783;border-radius:50%;background:#46391a;color:#fff6d8;font-size:8px;font-weight:800;box-shadow:0 1px 4px #0008;overflow:hidden}.battlefield-map__empty{position:absolute;inset:14% 8%;display:flex;align-items:center;justify-content:center;text-align:center;color:#d5e0df;font-size:13px;padding:12px;pointer-events:none}.battlefield-map__legend{justify-content:flex-start;gap:16px}.battlefield-map__legend span{display:inline-flex;align-items:center;gap:5px}.battlefield-map__legend i{width:10px;height:10px;display:inline-block;border:1px solid #a9d8ff;border-radius:3px;background:#17344a}.battlefield-map__legend i.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__legend i.objective{border:2px solid #f6d783;border-radius:50%;background:#46391a}.battlefield-map__notice{margin:8px 0 0;color:#9daab8;font-size:11px;line-height:1.4}.battlefield-map-section{min-width:0}@media(max-width:650px){.battlefield-map__unit{max-width:36%;padding:3px 4px;font-size:9px}.battlefield-map__edge{font-size:9px}}";
import { getBattlePrimaryMissions, getEventCompanionMapLayout } from "../rules/event-companion-map-catalog.js";

const BATTLEFIELD_WIDTH_IN = 60;
const BATTLEFIELD_HEIGHT_IN = 44;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function isValidBattlefieldPosition(position) {
  return Boolean(position &&
    Number.isFinite(position.x) && Number.isFinite(position.y) &&
    position.x >= 0 && position.x <= BATTLEFIELD_WIDTH_IN &&
    position.y >= 0 && position.y <= BATTLEFIELD_HEIGHT_IN);
}

export function battlefieldPositionToPercent(position) {
  if (!isValidBattlefieldPosition(position)) return null;
  return {
    left: position.x / BATTLEFIELD_WIDTH_IN * 100,
    // The player-facing edge is y=0 and is always rendered at the bottom.
    top: (BATTLEFIELD_HEIGHT_IN - position.y) / BATTLEFIELD_HEIGHT_IN * 100
  };
}

function averagePosition(positions) {
  const valid = positions.filter(isValidBattlefieldPosition);
  if (!valid.length) return null;
  return {
    x: valid.reduce((sum, position) => sum + position.x, 0) / valid.length,
    y: valid.reduce((sum, position) => sum + position.y, 0) / valid.length
  };
}

function unitPosition(unit, state) {
  const initialDeployment = state.battlefieldMap?.actualDeployment?.[unit.id];
  const hasRecordedMovement = (state.history ?? []).some((event) =>
    ["unit.normal_move_resolved", "unit.advanced"].includes(event?.type) &&
    event.payload?.unitId === unit.id &&
    Array.isArray(event.payload?.moves) &&
    event.payload.moves.length > 0
  );

  // A unit-level deployment point is the only recorded live anchor until
  // model-level movement has actually supplied newer coordinates.
  if (initialDeployment && !hasRecordedMovement) {
    const position = initialDeployment.position ?? initialDeployment;
    if (isValidBattlefieldPosition(position)) return position;
  }

  if (Array.isArray(unit.models) && unit.models.length &&
      unit.models.every((model) => isValidBattlefieldPosition(model?.position))) {
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

function geometryOverlay(geometry) {
  if (!geometry?.verified) return "";
  const zones = Object.entries(geometry.deploymentZones ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__zone" data-zone="' + escapeHtml(name) +
      '" points="' + points + '" aria-label="Deployment zone ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  const terrain = Object.entries(geometry.terrainGeometry ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__terrain" data-terrain="' + escapeHtml(name) +
      '" points="' + points + '" aria-label="Terrain footprint ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  return '<svg class="battlefield-map__geometry" viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="Verified Event Companion battlefield geometry">' +
    zones + terrain + '</svg>';
}

function positionsForMode(state, mode) {
  if (mode === "planning") return state.battlefieldMap?.deploymentPlan ?? {};
  if (mode === "deployment") return state.battlefieldMap?.actualDeployment ?? {};
  return null;
}

function modeDescription(mode) {
  if (mode === "planning") return "Planning positions only";
  if (mode === "deployment") return "Actual initial deployment";
  return "Live battlefield positions";
}

function playerLabel(state, playerId) {
  return (state.players ?? []).find((player) => player.id === playerId)?.name ?? playerId ?? "Unknown player";
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
  mode = "live",
  perspectivePlayerId = state?.activePlayer ?? null
} = {}) {
  if (!["planning", "deployment", "live"].includes(mode)) {
    throw new RangeError("Unknown battlefield map mode: " + mode);
  }
  const safeState = state && typeof state === "object" ? state : {};
  const plannedOrDeployed = positionsForMode(safeState, mode);
  const layoutGeometry = selectedLayoutGeometry(safeState);
  const units = Array.isArray(safeState.units) ? safeState.units : [];
  const unitNodes = [];
  let positionedUnits = 0;

  for (const unit of units) {
    if (!unit || !unit.id || unit.status === "destroyed") continue;
    let position = null;
    if (mode === "live") {
      if (unit.status !== "deployed") continue;
      position = unitPosition(unit, safeState);
    } else {
      const record = plannedOrDeployed?.[unit.id];
      position = record?.position ?? record ?? null;
    }
    const percent = battlefieldPositionToPercent(position);
    if (!percent) continue;
    positionedUnits += 1;
    const friendly = perspectivePlayerId != null && unit.ownerId === perspectivePlayerId;
    const sideClass = friendly ? "friendly" : "opponent";
    const marker = escapeHtml((unit.name ?? unit.id).slice(0, 22));
    const modelCount = Array.isArray(unit.models) ? unit.models.length : 0;
    unitNodes.push('<div class="battlefield-map__unit ' + sideClass +
      '" data-map-unit-id="' + escapeHtml(unit.id) + '"' + (mode === "planning" ? ' role="button" tabindex="0" aria-label="Select planned position for ' + escapeHtml(unit.name ?? unit.id) + '"' : '') + ' style="left:' + percent.left +
      '%;top:' + percent.top + '%" title="' + escapeHtml(unit.name ?? unit.id) +
      (modelCount ? ' · ' + modelCount + ' models' : '') + '">' + marker + '</div>');
  }

  const objectives = Array.isArray(safeState.objectives) ? safeState.objectives : [];
  const objectiveNodes = objectives.filter((objective) =>
    objective && isValidBattlefieldPosition(objective.position)).map((objective) => {
    const percent = battlefieldPositionToPercent(objective.position);
    const name = objective.name ?? objective.id ?? "Objective";
    const controlLabel = objectiveControlLabel(objective, safeState);
    return '<div class="battlefield-map__objective" data-map-objective-id="' +
      escapeHtml(objective.id ?? objective.name) + '" data-objective-control="' + escapeHtml(controlLabel) +
      '" style="left:' + percent.left + '%;top:' + percent.top + '%" title="' +
      escapeHtml(name + " · " + controlLabel) + '">' +
      escapeHtml(String(name).slice(0, 12)) + '</div>';
  }).join("");


  const layoutObjectiveNodes = layoutGeometry
    ? Object.entries(layoutGeometry.objectivePositions ?? {}).map(([name, position]) => {
      const percent = battlefieldPositionToPercent(position);
      if (!percent) return "";
      const label = name.replace("Defender Home", "D Home").replace("Attacker Home", "A Home");
      return '<div class="battlefield-map__objective battlefield-map__objective--layout" data-layout-objective="' +
        escapeHtml(name) + '" style="left:' + percent.left + '%;top:' + percent.top + '%" title="' +
        escapeHtml(name + " · Event Companion p. " + layoutGeometry.page) + '">' +
        escapeHtml(label) + '</div>';
    }).join("")
    : "";

  const emptyMessage = positionedUnits
    ? ""
    : '<div class="battlefield-map__empty">No positions recorded for this map mode yet.</div>';

  const liveStatus = mode === "live" ? liveStatusLabel(safeState) : "";
  const objectiveStatusSummary = objectives.filter((objective) =>
    objective && isValidBattlefieldPosition(objective.position)).length
    ? objectives.filter((objective) => objective && isValidBattlefieldPosition(objective.position))
      .map((objective) => escapeHtml((objective.name ?? objective.id ?? "Objective") + ": " +
        objectiveControlLabel(objective, safeState))).join(" · ")
    : "";
  return '<style>' + BATTLEFIELD_MAP_STYLES + '</style><div class="battlefield-map battlefield-map--' + mode +
    '" data-battlefield-map data-map-mode="' + mode + '">' +
    '<div class="battlefield-map__meta"><span>' + modeDescription(mode) +
    '</span><span>60″ × 44″ reference grid</span>' +
    (liveStatus ? '<span data-map-game-status>' + escapeHtml(liveStatus) + '</span>' : '') +
    (layoutGeometry ? '<span data-map-layout-status>Event Companion layout ' + escapeHtml(layoutGeometry.layout) + ' · p. ' + layoutGeometry.page + '</span>' : '') + '</div>' +
    (objectiveStatusSummary && mode === "live"
      ? '<p class="battlefield-map__meta" data-map-objective-status>' + objectiveStatusSummary + '</p>'
      : '') +
    '<div class="battlefield-map__board" data-battlefield-map-board role="application" aria-label="' +
    modeDescription(mode) + ', 60 by 44 inch reference board">' +
    '<div class="battlefield-map__edge battlefield-map__edge--top">Opponent edge · Y=44″</div>' +
    geometryOverlay(layoutGeometry) + objectiveNodes + layoutObjectiveNodes + unitNodes + emptyMessage +
    '<div class="battlefield-map__edge battlefield-map__edge--bottom">Your edge · Y=0″</div>' +
    '</div><div class="battlefield-map__legend"><span><i class="friendly"></i> Your army</span>' +
    '<span><i class="opponent"></i> Opponent</span><span><i class="objective"></i> Objective</span></div>' +
    '<p class="battlefield-map__notice">Map positions are approximate. Terrain, deployment zones, line of sight, and tabletop measurements are not inferred by this reference grid.</p>' +
    '</div>';
}
