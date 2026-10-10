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

function unitPosition(unit) {
  if (isValidBattlefieldPosition(unit.position)) return unit.position;
  if (Array.isArray(unit.models) && unit.models.length) {
    return averagePosition(unit.models.map((model) => model?.position));
  }
  return null;
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

export function renderBattlefieldMap(state, {
  mode = "live",
  perspectivePlayerId = state?.activePlayer ?? null
} = {}) {
  if (!["planning", "deployment", "live"].includes(mode)) {
    throw new RangeError("Unknown battlefield map mode: " + mode);
  }
  const safeState = state && typeof state === "object" ? state : {};
  const plannedOrDeployed = positionsForMode(safeState, mode);
  const units = Array.isArray(safeState.units) ? safeState.units : [];
  const unitNodes = [];
  let positionedUnits = 0;

  for (const unit of units) {
    if (!unit || !unit.id || unit.status === "destroyed") continue;
    let position = null;
    if (mode === "live") {
      if (unit.status !== "deployed") continue;
      position = unitPosition(unit);
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
      '" data-map-unit-id="' + escapeHtml(unit.id) + '" style="left:' + percent.left +
      '%;top:' + percent.top + '%" title="' + escapeHtml(unit.name ?? unit.id) +
      (modelCount ? ' · ' + modelCount + ' models' : '') + '">' + marker + '</div>');
  }

  const objectives = Array.isArray(safeState.objectives) ? safeState.objectives : [];
  const objectiveNodes = objectives.filter((objective) =>
    objective && isValidBattlefieldPosition(objective.position)).map((objective) => {
    const percent = battlefieldPositionToPercent(objective.position);
    return '<div class="battlefield-map__objective" data-map-objective-id="' +
      escapeHtml(objective.id ?? objective.name) + '" style="left:' + percent.left +
      '%;top:' + percent.top + '%" title="' + escapeHtml(objective.name ?? objective.id ?? "Objective") +
      '">' + escapeHtml(objective.name ?? objective.id ?? "Objective") + '</div>';
  }).join("");

  const emptyMessage = positionedUnits
    ? ""
    : '<div class="battlefield-map__empty">No positions recorded for this map mode yet.</div>';

  return '<div class="battlefield-map battlefield-map--' + mode +
    '" data-battlefield-map data-map-mode="' + mode + '">' +
    '<div class="battlefield-map__meta"><span>' + modeDescription(mode) +
    '</span><span>60″ × 44″ reference grid</span></div>' +
    '<div class="battlefield-map__board" role="img" aria-label="' +
    modeDescription(mode) + ', 60 by 44 inch reference board">' +
    '<div class="battlefield-map__edge battlefield-map__edge--top">Opponent edge · Y=44″</div>' +
    objectiveNodes + unitNodes + emptyMessage +
    '<div class="battlefield-map__edge battlefield-map__edge--bottom">Your edge · Y=0″</div>' +
    '</div><div class="battlefield-map__legend"><span><i class="friendly"></i> Your army</span>' +
    '<span><i class="opponent"></i> Opponent</span><span><i class="objective"></i> Objective</span></div>' +
    '<p class="battlefield-map__notice">Map positions are approximate. Terrain, deployment zones, line of sight, and tabletop measurements are not inferred by this reference grid.</p>' +
    '</div>';
}
