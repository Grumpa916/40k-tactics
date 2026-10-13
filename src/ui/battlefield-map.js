const BATTLEFIELD_MAP_STYLES = ".battlefield-map{color:inherit;min-width:0}.battlefield-map__meta,.battlefield-map__legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:#aeb9c7;font-size:12px;margin:8px 0}.battlefield-map__board{position:relative;width:100%;aspect-ratio:15/11;overflow:hidden;border:1px solid #596879;border-radius:10px;background-color:#17221f;background-image:linear-gradient(to right,rgba(220,235,230,.10) 1px,transparent 1px),linear-gradient(to bottom,rgba(220,235,230,.10) 1px,transparent 1px);background-size:10% 9.0909%;touch-action:pan-y;overscroll-behavior:contain}.battlefield-map__edge{position:absolute;left:0;right:0;z-index:1;text-align:center;padding:3px 4px;font-size:10px;letter-spacing:.03em;background:rgba(8,14,18,.72);color:#dbe5ee;pointer-events:none}.battlefield-map__edge--top{top:0}.battlefield-map__edge--bottom{bottom:0}.battlefield-map__ruler{position:absolute;inset:0;z-index:2;pointer-events:none;color:#fff;font-size:10px;font-weight:800;text-shadow:0 1px 3px #000;background:transparent}.battlefield-map__ruler span{position:absolute;padding:1px 3px;border-radius:3px;background:#101820d9;transform:translate(-50%,-50%)}.battlefield-map__ruler--top{inset:14px 0 auto;height:0}.battlefield-map__ruler--left{inset:0 auto 0 2px;width:0}.battlefield-map__ruler--left span{transform:translateY(-50%)}.battlefield-map__terrain-measurements{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;overflow:visible}.battlefield-map__measurement-box{fill:rgba(115,155,190,.08);stroke:#6f8fa9;stroke-width:.28;vector-effect:non-scaling-stroke;opacity:.85}.battlefield-map__dimension-line,.battlefield-map__dimension-tick{stroke:#e7eef5;stroke-width:.24;vector-effect:non-scaling-stroke}.battlefield-map__dimension-anchor{fill:#f6d783;stroke:#101820;stroke-width:.25;vector-effect:non-scaling-stroke}.battlefield-map__edge-dimension-line{stroke:#d9e5ef;stroke-width:.24;stroke-dasharray:1 .65;vector-effect:non-scaling-stroke}.battlefield-map__dimension-text{fill:#f4f8fb;font-family:Arial,sans-serif;font-size:2.15px;font-weight:900;paint-order:stroke;stroke:#071019;stroke-width:.7px;stroke-linejoin:round}.battlefield-map__geometry{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.battlefield-map__zone{fill:rgba(84,150,196,.12);stroke:rgba(130,190,232,.85);stroke-width:.18;stroke-dasharray:.7 .45}.battlefield-map__terrain{fill:rgba(135,145,132,.8);stroke:#d0d7d0;stroke-width:.28;stroke-linejoin:round}.battlefield-map__unit{position:absolute;transform:translate(-50%,-50%);z-index:2;max-width:32%;padding:4px 6px;border:1px solid #a9d8ff;border-radius:6px;background:#17344a;color:#f4f8ff;font-size:10px;font-weight:700;line-height:1.2;text-align:center;overflow-wrap:anywhere;box-shadow:0 1px 4px #0008;cursor:default;user-select:none;-webkit-user-select:none}.battlefield-map--planning .battlefield-map__unit,.battlefield-map--deployment .battlefield-map__unit{cursor:grab;touch-action:none}.battlefield-map__unit.is-selected{outline:3px solid #d6a8ff;outline-offset:2px;z-index:5}.battlefield-map__unit.is-unplaced{border-style:dashed;opacity:.9}.battlefield-map__unit.is-dragging{cursor:grabbing;z-index:8}.battlefield-map--live .battlefield-map__unit[role=button]{cursor:grab;touch-action:none}.battlefield-map__unit.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__objective{position:absolute;z-index:2;transform:translate(-50%,-50%);width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #f6d783;border-radius:50%;background:#46391a;color:#fff6d8;font-size:8px;font-weight:800;box-shadow:0 1px 4px #0008;overflow:hidden}.battlefield-map__empty{position:absolute;inset:14% 8%;display:flex;align-items:center;justify-content:center;text-align:center;color:#d5e0df;font-size:13px;padding:12px;pointer-events:none}.battlefield-map__legend{justify-content:flex-start;gap:16px}.battlefield-map__legend span{display:inline-flex;align-items:center;gap:5px}.battlefield-map__legend i{width:10px;height:10px;display:inline-block;border:1px solid #a9d8ff;border-radius:3px;background:#17344a}.battlefield-map__legend i.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__legend i.objective{border:2px solid #f6d783;border-radius:50%;background:#46391a}.battlefield-map__notice{margin:8px 0 0;color:#9daab8;font-size:11px;line-height:1.4}.battlefield-map-section{min-width:0}.battlefield-map-section.is-fullscreen{position:fixed;inset:0;z-index:9999;overflow:auto;box-sizing:border-box;padding:12px;background:#101820}.battlefield-map-section.is-fullscreen .battlefield-map__board{height:calc(100vh - 190px);min-height:55vh;aspect-ratio:auto}.battlefield-map-section.is-fullscreen .battlefield-map__geometry{max-height:100%}.deployment-reserve-tray{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0;padding:12px;border:1px solid #8d6bb1;border-radius:9px;background:#20182a;color:#f2eaff}.deployment-reserve-tray h3{flex:0 0 100%;margin:0;font-size:14px}.deployment-reserve-tray__unit{display:inline-flex;align-items:center;min-height:36px;padding:7px 10px;border:1px solid #8d6bb1;border-radius:7px;background:#30213e;font-size:12px;font-weight:750;overflow-wrap:anywhere}.deployment-reserve-tray p{margin:0;font-size:12px;opacity:.8}@media(max-width:650px){.battlefield-map__unit{max-width:36%;padding:3px 4px;font-size:9px}.battlefield-map__edge{font-size:9px}}";
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

function geometryOverlay(geometry, terrainOnly = false) {
  if (!geometry?.verified) return "";
  const zones = terrainOnly ? "" : Object.entries(geometry.deploymentZones ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__zone" data-zone="' + escapeHtml(name) +
      '" points="' + points + '" aria-label="Deployment zone ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  const terrain = Object.entries(geometry.terrainGeometry ?? {}).map(([name, shape]) => {
    const points = (shape.points ?? []).map((point) => point.x + "," + (44 - point.y)).join(" ");
    return '<polygon class="battlefield-map__terrain" data-terrain="' + escapeHtml(name) +
      '" points="' + points + '" aria-label="Terrain footprint ' + escapeHtml(name) + '"></polygon>';
  }).join("");
  return '<svg class="battlefield-map__geometry" viewBox="0 0 60 44" preserveAspectRatio="none" aria-label="Battlefield layout overview; use the official Event Companion diagram for exact terrain placement">' +
    zones + terrain + '</svg>';
}
function terrainEdgeMeasurementOverlay(geometry) {
  if (!geometry?.verified || !geometry.terrainGeometry) return "";
  const px = (x) => Number(x) / 60 * 100;
  const py = (y) => (44 - Number(y)) / 44 * 100;
  const edges = [
    { edge: "left", distance: (p) => p.x, endpoint: (p) => ({ x: 0, y: p.y }), along: (p) => p.y, horizontal: true },
    { edge: "right", distance: (p) => 60 - p.x, endpoint: (p) => ({ x: 60, y: p.y }), along: (p) => p.y, horizontal: true },
    { edge: "bottom", distance: (p) => p.y, endpoint: (p) => ({ x: p.x, y: 0 }), along: (p) => p.x, horizontal: false },
    { edge: "top", distance: (p) => 44 - p.y, endpoint: (p) => ({ x: p.x, y: 44 }), along: (p) => p.x, horizontal: false }
  ];
  const guides = [];
  Object.entries(geometry.terrainGeometry).forEach(([terrainId, shape]) => {
    const points = (shape.points ?? []).filter((p) =>
      Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
    ).map((p) => ({ x: Number(p.x), y: Number(p.y) }));
    points.forEach((corner, index) => {
      const distances = edges.map((edge) => ({ edge, distance: edge.distance(corner) }))
        .sort((a, b) => a.distance - b.distance);
      const chosen = distances[0];
      guides.push({
        terrainId, corner, index, edge: chosen.edge.edge,
        endpoint: chosen.edge.endpoint(corner), distance: chosen.distance,
        horizontal: chosen.edge.horizontal, along: chosen.edge.along(corner)
      });
    });
  });

  // Keep a single distance label per terrain vertex. Lines terminate at the
  // selected board edge; labels are moved into a dedicated gutter on that edge
  // so they do not stack along the board boundary.
  const groups = new Map(edges.map((edge) => [edge.edge, []]));
  guides.forEach((guide) => groups.get(guide.edge).push(guide));
  groups.forEach((items) => {
    items.sort((a, b) => a.along - b.along);
    items.forEach((item, index) => { item.slot = index; item.total = items.length; });
  });

  const parts = guides.map((guide) => {
    const x1 = px(guide.corner.x), y1 = py(guide.corner.y);
    const x2 = px(guide.endpoint.x), y2 = py(guide.endpoint.y);
    let labelX = x2, labelY = y2;
    if (guide.edge === "left" || guide.edge === "right") {
      labelX = guide.edge === "left" ? 2.0 : 98.0;
      labelY = 4 + (guide.slot + 0.5) * 92 / Math.max(1, guide.total);
    } else {
      labelX = 2 + (guide.slot + 0.5) * 96 / Math.max(1, guide.total);
      labelY = guide.edge === "top" ? 3.2 : 96.8;
    }
    return '<line class="battlefield-map__dimension-line" data-terrain-corner="' + escapeHtml(guide.terrainId) +
      '" data-edge="' + guide.edge + '" data-edge-distance="' + guide.distance.toFixed(2) +
      '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>' +
      '<circle class="battlefield-map__dimension-anchor" cx="' + x1 + '" cy="' + y1 + '" r="0.65"></circle>' +
      '<text class="battlefield-map__dimension-text" x="' + labelX + '" y="' + labelY +
      '" text-anchor="middle" data-distance-label-edge="' + guide.edge + '">' +
      escapeHtml(Math.round(guide.distance) + String.fromCharCode(34)) + '</text>';
  });
  return parts.length
    ? '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Approximate distances from terrain corners to nearest battlefield edges">' + parts.join("") + '</svg>'
    : "";
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
  perspectivePlayerId = state?.activePlayer ?? null,
  selectedUnitId = null,
  showUnits = true,
  showMeasurements = mode === "live",
  showTerrainEdgeMeasurements = false,
  terrainMeasurements = [],
  mapLabel = null
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
  const declaredReserves = safeState.battlefieldMap?.declaredReserves ?? {};
  const visibleUnits = showUnits ? units.filter((unit) => {
    if (!unit || !unit.id || unit.status === "destroyed") return false;
    if (mode === "planning") return unit.ownerId === perspectivePlayerId;
    if (mode === "deployment") return !declaredReserves[unit.id];
    return unit.status === "deployed";
  }) : [];
  const stagedPosition = (index, total, friendly) => {
    const columns = Math.min(6, Math.max(1, total));
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: 5 + column * (50 / Math.max(1, columns - 1)),
      y: friendly ? 2.5 + row * 3.2 : 41.5 - row * 3.2
    };
  };
  const visibleIndex = new Map();
  for (const unit of visibleUnits) {
    const friendly = perspectivePlayerId != null && unit.ownerId === perspectivePlayerId;
    const key = mode === "planning" ? "friendly" : (friendly ? "friendly" : "opponent");
    const index = visibleIndex.get(key) ?? 0;
    visibleIndex.set(key, index + 1);
    let position = null;
    let unplaced = false;
    if (mode === "live") {
      position = unitPosition(unit, safeState);
    } else {
      const record = plannedOrDeployed?.[unit.id];
      position = record?.position ?? record ?? null;
      if (!isValidBattlefieldPosition(position)) {
        unplaced = true;
        const total = visibleUnits.filter((candidate) => mode === "planning"
          ? candidate.ownerId === perspectivePlayerId
          : (perspectivePlayerId != null && candidate.ownerId === perspectivePlayerId) === friendly).length;
        position = stagedPosition(index, total, friendly);
      }
    }
    const percent = battlefieldPositionToPercent(position);
    if (!percent) continue;
    positionedUnits += 1;
    const sideClass = friendly ? "friendly" : "opponent";
    const marker = escapeHtml((unit.name ?? unit.id).slice(0, 22));
    const modelCount = Array.isArray(unit.models) ? unit.models.length : 0;
    const isSelected = unit.id === selectedUnitId;
    unitNodes.push('<div class="battlefield-map__unit ' + sideClass +
      (isSelected ? ' is-selected' : '') + (unplaced ? ' is-unplaced' : '') +
      '" data-map-unit-id="' + escapeHtml(unit.id) + '"' +
      (unplaced ? ' data-map-unit-unplaced="true"' : '') +
      (mode !== "live" || friendly ? ' role="button" tabindex="0" aria-label="Select ' + escapeHtml(unit.name ?? unit.id) + '"' : '') +
      ' style="left:' + percent.left + '%;top:' + percent.top + '%" title="' + escapeHtml(unit.name ?? unit.id) +
      (unplaced ? ' · not placed' : '') + (modelCount ? ' · ' + modelCount + ' models' : '') + '">' + marker + '</div>');
  }

  const objectives = Array.isArray(safeState.objectives) ? safeState.objectives : [];
  // When a verified layout is selected, its catalog owns objective positions.
  // Control state is linked only by an explicit layoutObjective key or the stable
  // event-companion:<label> ID; no positional/order-based matching is inferred.
  const layoutObjectiveNodes = layoutGeometry
    ? Object.entries(layoutGeometry.objectivePositions ?? {}).map(([name, position]) => {
      const percent = battlefieldPositionToPercent(position);
      if (!percent) return "";
      const objective = objectives.find((item) =>
        item && (item.layoutObjective === name || item.id === "event-companion:" + name)
      );
      const objectiveId = objective?.id ?? ("event-companion:" + name);
      const controlLabel = objective ? objectiveControlLabel(objective, safeState) : "Control not recorded";
      const label = name.replace("Defender Home", "D Home").replace("Attacker Home", "A Home");
      return '<div class="battlefield-map__objective battlefield-map__objective--layout" data-layout-objective="' +
        escapeHtml(name) + '" data-map-objective-id="' + escapeHtml(objectiveId) +
        '" data-objective-control="' + escapeHtml(controlLabel) +
        '" style="left:' + percent.left + '%;top:' + percent.top + '%" title="' +
        escapeHtml(name + " · " + controlLabel + " · Event Companion p. " + layoutGeometry.page) + '">' +
        escapeHtml(label) + '</div>';
    }).join("")
    : "";

  const objectiveNodes = layoutGeometry
    ? ""
    : objectives.filter((objective) =>
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

  const emptyMessage = !showUnits || positionedUnits
    ? ""
    : '<div class="battlefield-map__empty">No positions recorded for this map mode yet.</div>';
  const terrainMeasurementOverlay = showTerrainEdgeMeasurements
    ? terrainEdgeMeasurementOverlay(layoutGeometry, terrainMeasurements)
    : "";

  const liveStatus = mode === "live" ? liveStatusLabel(safeState) : "";
  const showCoordinateMeasurements = showMeasurements;
  const shownMapLabel = modeDescription(mode, mapLabel);
  const objectiveStatusSummary = objectives.filter((objective) =>
    objective && isValidBattlefieldPosition(objective.position)).length
    ? objectives.filter((objective) => objective && isValidBattlefieldPosition(objective.position))
      .map((objective) => escapeHtml((objective.name ?? objective.id ?? "Objective") + ": " +
        objectiveControlLabel(objective, safeState))).join(" · ")
    : "";
  const boardAriaLabel = showCoordinateMeasurements
    ? shownMapLabel + ", 60 by 44 inch reference board with inch coordinate labels"
    : shownMapLabel + ", battlefield board";
  return '<style>' + BATTLEFIELD_MAP_STYLES + '</style><div class="battlefield-map battlefield-map--' + mode +
    '" data-battlefield-map data-map-mode="' + mode + '">' +
    '<div class="battlefield-map__meta"><span>' + shownMapLabel +
    '</span>' + (showCoordinateMeasurements ? '<span>60″ × 44″ reference grid</span>' : '') +
    (liveStatus ? '<span data-map-game-status>' + escapeHtml(liveStatus) + '</span>' : '') +
    (layoutGeometry ? '<span data-map-layout-status>Event Companion layout ' + escapeHtml(layoutGeometry.layout) + ' · p. ' + layoutGeometry.page + '</span>' : '') + '</div>' +
    (objectiveStatusSummary && mode === "live"
      ? '<p class="battlefield-map__meta" data-map-objective-status>' + objectiveStatusSummary + '</p>'
      : '') +
    '<div class="battlefield-map__board" data-battlefield-map-board role="application" aria-label="' +
    boardAriaLabel + '">' +
    (showCoordinateMeasurements ? '<div class="battlefield-map__edge battlefield-map__edge--top">Opponent edge · Y=44″</div>' : '') +
    (showCoordinateMeasurements ? '<div class="battlefield-map__ruler battlefield-map__ruler--top" aria-label="Horizontal inch measurements">' +
      [0,10,20,30,40,50,60].map((inch) => '<span style="left:' + (inch / 60 * 100) + '%">' + inch + '″</span>').join("") +
      '</div><div class="battlefield-map__ruler battlefield-map__ruler--left" aria-label="Vertical inch measurements">' +
      [0,10,20,30,40,44].map((inch) => '<span style="top:' + ((44 - inch) / 44 * 100) + '%">' + inch + '″</span>').join("") +
      '</div>' : '') +
    geometryOverlay(layoutGeometry, showTerrainEdgeMeasurements) + terrainMeasurementOverlay + objectiveNodes + layoutObjectiveNodes + unitNodes + emptyMessage +
    (showCoordinateMeasurements ? '<div class="battlefield-map__edge battlefield-map__edge--bottom">Your edge · Y=0″</div>' : '') +
    '</div>' + (showUnits
      ? '<div class="battlefield-map__legend"><span><i class="friendly"></i> Your army</span>' +
        '<span><i class="opponent"></i> Opponent</span><span><i class="objective"></i> Objective</span></div>'
      : (layoutGeometry ? '<div class="battlefield-map__legend"><span><i class="objective"></i> Objective locations</span></div>' : '')) +
    '<p class="battlefield-map__notice">' + (showTerrainEdgeMeasurements
      ? "Approximate distances run from terrain corners to the nearest battlefield edge and are rounded to the nearest inch. Use the official Event Companion diagram as the final reference; line of sight is not inferred."
      : "Map positions are approximate. Terrain, deployment zones, line of sight, and tabletop measurements are not inferred by this reference grid.") + '</p>' +
    '</div>';
}
