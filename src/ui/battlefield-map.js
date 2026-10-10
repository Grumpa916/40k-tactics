const BATTLEFIELD_MAP_STYLES = ".battlefield-map{color:inherit;min-width:0}.battlefield-map__meta,.battlefield-map__legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:#aeb9c7;font-size:12px;margin:8px 0}.battlefield-map__board{position:relative;width:100%;aspect-ratio:15/11;overflow:hidden;border:1px solid #596879;border-radius:10px;background-color:#17221f;background-image:linear-gradient(to right,rgba(220,235,230,.10) 1px,transparent 1px),linear-gradient(to bottom,rgba(220,235,230,.10) 1px,transparent 1px);background-size:10% 9.0909%;touch-action:pan-y}.battlefield-map__edge{position:absolute;left:0;right:0;z-index:1;text-align:center;padding:3px 4px;font-size:10px;letter-spacing:.03em;background:rgba(8,14,18,.72);color:#dbe5ee;pointer-events:none}.battlefield-map__edge--top{top:0}.battlefield-map__edge--bottom{bottom:0}.battlefield-map__unit{position:absolute;transform:translate(-50%,-50%);z-index:2;max-width:32%;padding:4px 6px;border:1px solid #a9d8ff;border-radius:6px;background:#17344a;color:#f4f8ff;font-size:10px;font-weight:700;line-height:1.2;text-align:center;overflow-wrap:anywhere;box-shadow:0 1px 4px #0008}.battlefield-map__unit.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__objective{position:absolute;z-index:2;transform:translate(-50%,-50%);width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #f6d783;border-radius:50%;background:#46391a;color:#fff6d8;font-size:8px;font-weight:800;box-shadow:0 1px 4px #0008;overflow:hidden}.battlefield-map__empty{position:absolute;inset:14% 8%;display:flex;align-items:center;justify-content:center;text-align:center;color:#d5e0df;font-size:13px;padding:12px;pointer-events:none}.battlefield-map__legend{justify-content:flex-start;gap:16px}.battlefield-map__legend span{display:inline-flex;align-items:center;gap:5px}.battlefield-map__legend i{width:10px;height:10px;display:inline-block;border:1px solid #a9d8ff;border-radius:3px;background:#17344a}.battlefield-map__legend i.opponent{border-color:#ffc0b5;background:#512c2d}.battlefield-map__legend i.objective{border:2px solid #f6d783;border-radius:50%;background:#46391a}.battlefield-map__notice{margin:8px 0 0;color:#9daab8;font-size:11px;line-height:1.4}.battlefield-map-section{min-width:0}@media(max-width:650px){.battlefield-map__unit{max-width:36%;padding:3px 4px;font-size:9px}.battlefield-map__edge{font-size:9px}}";
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
    return '<div class="battlefield-map__objective" data-map-objective-id="' +
      escapeHtml(objective.id ?? objective.name) + '" style="left:' + percent.left +
      '%;top:' + percent.top + '%" title="' + escapeHtml(objective.name ?? objective.id ?? "Objective") +
      '">' + escapeHtml(objective.name ?? objective.id ?? "Objective") + '</div>';
  }).join("");

  const emptyMessage = positionedUnits
    ? ""
    : '<div class="battlefield-map__empty">No positions recorded for this map mode yet.</div>';

  return '<style>' + BATTLEFIELD_MAP_STYLES + '</style><div class="battlefield-map battlefield-map--' + mode +
    '" data-battlefield-map data-map-mode="' + mode + '">' +
    '<div class="battlefield-map__meta"><span>' + modeDescription(mode) +
    '</span><span>60″ × 44″ reference grid</span></div>' +
    '<div class="battlefield-map__board" data-battlefield-map-board role="application" aria-label="' +
    modeDescription(mode) + ', 60 by 44 inch reference board">' +
    '<div class="battlefield-map__edge battlefield-map__edge--top">Opponent edge · Y=44″</div>' +
    objectiveNodes + unitNodes + emptyMessage +
    '<div class="battlefield-map__edge battlefield-map__edge--bottom">Your edge · Y=0″</div>' +
    '</div><div class="battlefield-map__legend"><span><i class="friendly"></i> Your army</span>' +
    '<span><i class="opponent"></i> Opponent</span><span><i class="objective"></i> Objective</span></div>' +
    '<p class="battlefield-map__notice">Map positions are approximate. Terrain, deployment zones, line of sight, and tabletop measurements are not inferred by this reference grid.</p>' +
    '</div>';
}
