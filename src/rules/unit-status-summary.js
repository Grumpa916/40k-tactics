import { UNIT_STATUS } from "../state/unit.js";

function firstFinite(values) {
  return values.find((value) => Number.isFinite(value));
}

export function isUnitBattleShocked(unit) {
  return unit?.battleShocked === true ||
    unit?.battleShock?.status === "battle-shocked" ||
    unit?.battleShock?.active === true;
}

/**
 * Return a conservative strength assessment. Unknown strength is deliberately
 * different from "not below half strength", because roster data may not include
 * surviving-model counts yet.
 */
export function getUnitStrengthAssessment(unit) {
  if (unit?.belowHalfStrength === true || unit?.belowHalfStrength === false) {
    return {
      known: true,
      belowHalfStrength: unit.belowHalfStrength,
      source: "explicit"
    };
  }

  const startingStrength = firstFinite([
    unit?.startingStrength,
    unit?.strength?.starting,
    unit?.metadata?.startingStrength,
    unit?.metadata?.modelCount
  ]);
  const currentStrength = firstFinite([
    unit?.currentStrength,
    unit?.remainingStrength,
    unit?.strength?.remaining,
    unit?.metadata?.currentModelCount
  ]);

  if (Number.isFinite(startingStrength) && startingStrength > 0 &&
      Number.isFinite(currentStrength) && currentStrength >= 0) {
    return {
      known: true,
      belowHalfStrength: currentStrength * 2 <= startingStrength,
      startingStrength,
      currentStrength,
      source: "model-count"
    };
  }

  const models = Array.isArray(unit?.models) ? unit.models : [];
  const modelStateIsTracked = models.some((model) =>
    model && typeof model === "object" &&
    ("status" in model || "destroyed" in model || "isAlive" in model || "wounds" in model)
  );
  if (models.length > 0 && modelStateIsTracked) {
    const remaining = models.filter((model) =>
      model?.status !== UNIT_STATUS.DESTROYED &&
      model?.destroyed !== true &&
      model?.isAlive !== false &&
      !(Number.isFinite(model?.wounds) && model.wounds <= 0)
    ).length;
    const starting = Number.isFinite(startingStrength) && startingStrength > 0
      ? startingStrength
      : models.length;
    return {
      known: true,
      belowHalfStrength: remaining * 2 <= starting,
      startingStrength: starting,
      currentStrength: remaining,
      source: "model-state"
    };
  }

  // Single-model units can be assessed from current and starting Wounds, when
  // both values are present. Multi-model units are never inferred from aggregate
  // wounds because that would confuse lost Wounds with destroyed models.
  const isSingleModel = startingStrength === 1 ||
    (startingStrength == null && unit?.metadata?.modelCount === 1);
  const startingWounds = firstFinite([
    unit?.startingWounds,
    unit?.profile?.characteristics?.wounds,
    unit?.profile?.wounds
  ]);
  if (isSingleModel && Number.isFinite(startingWounds) && startingWounds > 0 &&
      Number.isFinite(unit?.wounds) && unit.wounds >= 0) {
    return {
      known: true,
      belowHalfStrength: unit.wounds * 2 <= startingWounds,
      startingStrength: 1,
      currentStrength: unit.wounds > 0 ? 1 : 0,
      startingWounds,
      currentWounds: unit.wounds,
      source: "single-model-wounds"
    };
  }

  return { known: false, belowHalfStrength: null, source: "untracked" };
}

export function getBattleShockEligibility(unit) {
  if (!unit || unit.status !== UNIT_STATUS.DEPLOYED) {
    return { status: "not-on-battlefield", requiresTest: false, known: true };
  }
  if (isUnitBattleShocked(unit)) {
    return { status: "test-required-currently-battle-shocked", requiresTest: true, known: true };
  }
  const strength = getUnitStrengthAssessment(unit);
  if (!strength.known) {
    return { status: "strength-review-required", requiresTest: null, known: false, strength };
  }
  if (strength.belowHalfStrength) {
    return { status: "test-required-below-half-strength", requiresTest: true, known: true, strength };
  }
  return { status: "no-test-indicated", requiresTest: false, known: true, strength };
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function humanizeEventType(type) {
  const labels = {
    "battle.started": "Battle started",
    "battle.deployment_started": "Deployment started",
    "battle.round_started": "Battle round started",
    "battle.round_ended": "Battle round ended",
    "turn.started": "Turn started",
    "turn.ended": "Turn ended",
    "turn.phase_changed": "Phase changed",
    "unit.deployed": "Unit deployed",
    "unit.normal_move_resolved": "Normal move recorded",
    "unit.advanced": "Advance recorded",
    "unit.fell_back": "Fall Back recorded",
    "shooting.unit_activated": "Shooting activation",
    "shooting.phase_completed": "Shooting phase completed",
    "charge.outcome_recorded": "Charge outcome recorded",
    "fight.unit_activated": "Fight activation",
    "fight.phase_completed": "Fight phase completed",
    "combat.attack_resolved": "Attack resolved",
    "battle_shock.test_recorded": "Battle-shock test",
    "objective.control_recorded": "Objective control changed",
    "command_points.change_recorded": "Command Points changed",
    "victory_points.awarded": "Victory Points awarded",
    "victory_points.adjusted": "Victory Points adjusted",
    "victory_points.award_undone": "Victory Points award undone",
    "secondary_mission.drawn": "Secondary mission recorded",
    "secondary_mission.score_recorded": "Secondary mission scored",
    "battle.army_roster_assigned": "Army roster assigned"
  };
  if (labels[type]) return labels[type];
  return String(type ?? "Unknown event")
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function summarizeGameEvent(event, state = {}) {
  const payload = event?.payload ?? {};
  const units = Array.isArray(state.units) ? state.units : [];
  const players = Array.isArray(state.players) ? state.players : [];
  const unitName = (id) => units.find((unit) => unit.id === id)?.name ?? id ?? null;
  const playerName = (id) => players.find((player) => player.id === id)?.name ?? id ?? null;
  const details = [];

  if (event?.type === "combat.attack_resolved") {
    const attacker = unitName(payload.attackerId);
    const target = unitName(payload.targetId);
    if (attacker && target) details.push(attacker + " → " + target);
    if (payload.weaponId) details.push("Weapon: " + payload.weaponId);
    if (Number.isFinite(payload.actualDamage)) details.push(payload.actualDamage + " actual damage");
    if (payload.stateDelta?.target?.woundsAfter != null) {
      details.push(payload.stateDelta.target.woundsAfter + " Wounds remaining");
    }
  } else if (event?.type === "battle_shock.test_recorded") {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (payload.result) details.push(payload.result === "passed" ? "Passed" : "Failed");
    details.push(payload.battleShockedAfter ? "Battle-shocked" : "Not Battle-shocked");
  } else if (event?.type === "victory_points.awarded" || event?.type === "victory_points.adjusted") {
    if (payload.playerId) details.push(playerName(payload.playerId));
    if (Number.isFinite(payload.amount)) details.push((payload.amount > 0 ? "+" : "") + payload.amount + " VP");
    if (payload.reason) details.push(payload.reason);
  } else if (event?.type === "command_points.change_recorded") {
    if (payload.playerId) details.push(playerName(payload.playerId));
    if (Number.isFinite(payload.amount)) details.push((payload.amount > 0 ? "+" : "") + payload.amount + " CP");
    if (payload.reason) details.push(payload.reason);
  } else {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (payload.playerId) details.push(playerName(payload.playerId));
    if (payload.phase) details.push(payload.phase);
    if (payload.reason) details.push(payload.reason);
    if (Number.isFinite(payload.actualDamage)) details.push(payload.actualDamage + " actual damage");
    if (Number.isFinite(payload.amount) && !details.some((part) => part.includes(String(payload.amount)))) {
      details.push(String(payload.amount));
    }
  }

  const context = [];
  if (Number.isFinite(payload.round)) context.push("Round " + payload.round);
  if (Number.isFinite(payload.turn)) context.push("Turn " + payload.turn);
  return {
    title: humanizeEventType(event?.type),
    detail: details.filter(Boolean).join(" · "),
    context: context.join(" · "),
    type: event?.type ?? "unknown"
  };
}

export function renderUnitStatusPanel(state = {}) {
  const units = Array.isArray(state.units) ? state.units : [];
  const players = Array.isArray(state.players) ? state.players : [];
  const playerName = (id) => players.find((player) => player.id === id)?.name ?? id ?? "Unknown player";
  const statusRank = (unit) => {
    if (unit.status === UNIT_STATUS.DESTROYED) return 4;
    if (isUnitBattleShocked(unit)) return 0;
    const eligibility = getBattleShockEligibility(unit);
    if (eligibility.requiresTest === true) return 1;
    if (eligibility.requiresTest === null) return 2;
    if (unit.status === UNIT_STATUS.RESERVES) return 3;
    return 2;
  };
  const sorted = units.slice().sort((a, b) => statusRank(a) - statusRank(b) || String(a.name).localeCompare(String(b.name)));
  const unitRows = sorted.map((unit) => {
    const eligibility = getBattleShockEligibility(unit);
    const badges = [];
    if (unit.status === UNIT_STATUS.DESTROYED) badges.push('<span class="battle-context__badge battle-context__badge--danger">Destroyed</span>');
    else if (unit.status === UNIT_STATUS.RESERVES) badges.push('<span class="battle-context__badge">Reserves</span>');
    else badges.push('<span class="battle-context__badge">On battlefield</span>');

    if (isUnitBattleShocked(unit)) {
      badges.push('<span class="battle-context__badge battle-context__badge--danger">Battle-shocked</span>');
    } else if (eligibility.requiresTest === true) {
      badges.push('<span class="battle-context__badge battle-context__badge--warning">Battle-shock test due</span>');
    } else if (eligibility.requiresTest === null) {
      badges.push('<span class="battle-context__badge battle-context__badge--muted">Strength untracked</span>');
    }

    const woundText = Number.isFinite(unit.wounds) ? '<span>' + escapeHtml(unit.wounds) + ' Wounds remaining</span>' : '';
    const lastTest = unit.battleShockLastTest;
    const testText = lastTest?.result
      ? '<small>Last test: ' + escapeHtml(lastTest.result === "passed" ? "Passed" : "Failed") +
        (Number.isFinite(lastTest.round) ? ' · Round ' + escapeHtml(lastTest.round) : '') + '</small>'
      : '';
    return '<li class="battle-context__unit"><strong>' + escapeHtml(unit.name ?? unit.id) + '</strong>' +
      '<small>' + escapeHtml(playerName(unit.ownerId)) + '</small><div class="battle-context__badges">' +
      badges.join("") + '</div><div class="battle-context__unit-meta">' + woundText + testText + '</div></li>';
  }).join("");

  const testDue = units.filter((unit) => getBattleShockEligibility(unit).requiresTest === true).length;
  const needsReview = units.filter((unit) => getBattleShockEligibility(unit).requiresTest === null).length;
  return '<section class="battle-context__section" aria-labelledby="battle-unit-status-title">' +
    '<div class="battle-context__section-heading"><h2 id="battle-unit-status-title">Unit Status</h2>' +
    '<span>' + units.length + ' units</span></div>' +
    '<p class="battle-context__note">Battle-shock tests are due for units already Battle-shocked or known to be at or below half-strength. Unknown strength is flagged for review, not assumed eligible.</p>' +
    (testDue ? '<p class="battle-context__alert">' + testDue + ' unit(s) flagged for a Battle-shock test.</p>' : '') +
    (needsReview ? '<p class="battle-context__note">' + needsReview + ' unit(s) need a strength check because remaining-model data is not available.</p>' : '') +
    (unitRows ? '<ul class="battle-context__unit-list">' + unitRows + '</ul>' : '<p>No units have been added to this battle.</p>') +
    '</section>';
}

export function renderEventLogPanel(state = {}, { limit = 10 } = {}) {
  const history = Array.isArray(state.history) ? state.history : [];
  const events = history.slice(-Math.max(1, limit)).reverse();
  const entries = events.map((event) => {
    const summary = summarizeGameEvent(event, state);
    return '<li class="battle-context__event"><strong>' + escapeHtml(summary.title) + '</strong>' +
      (summary.detail ? '<span>' + escapeHtml(summary.detail) + '</span>' : '') +
      (summary.context ? '<small>' + escapeHtml(summary.context) + '</small>' : '') +
      '</li>';
  }).join("");
  return '<details class="battle-context__section battle-context__event-panel" open>' +
    '<summary><span>Event Log</span><span class="battle-context__count">' + history.length + ' events</span></summary>' +
    (entries ? '<ol class="battle-context__event-list">' + entries + '</ol>' : '<p>No game events recorded yet.</p>') +
    (history.length > events.length ? '<p class="battle-context__note">Showing the latest ' + events.length + ' of ' + history.length + ' events.</p>' : '') +
    '</details>';
}

function renderDataList(items, emptyText) {
  if (!Array.isArray(items) || items.length === 0) return '<p class="battle-context__empty">' + escapeHtml(emptyText) + '</p>';
  return '<ul>' + items.map((item) => {
    const name = item?.name ?? item?.label ?? item?.id ?? "Unnamed";
    const detail = item?.description ?? item?.text ?? item?.summary ?? "";
    const cpCost = Number.isFinite(item?.cpCost) ? ' · ' + item.cpCost + ' CP' :
      Number.isFinite(item?.commandPointCost) ? ' · ' + item.commandPointCost + ' CP' : "";
    return '<li><strong>' + escapeHtml(name) + escapeHtml(cpCost) + '</strong>' +
      (detail ? '<span>' + escapeHtml(detail) + '</span>' : '') + '</li>';
  }).join("") + '</ul>';
}

function referenceSection(title, content, { open = false } = {}) {
  return '<details class="battle-context__reference-section"' + (open ? ' open' : '') + '>' +
    '<summary>' + escapeHtml(title) + '</summary>' + content + '</details>';
}

export function renderReferencePanel(state = {}, gameData = {}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const playerOneId = players[0]?.id ?? null;
  const playerTwoId = players.find((player) => player.id !== playerOneId)?.id ?? null;
  const rulesFor = (items, playerId) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => !item?.playerId && !item?.ownerId ||
      item?.playerId === playerId || item?.ownerId === playerId);
  };
  const detachmentFor = (playerId) =>
    state.armyRosters?.[playerId]?.detachment ?? state.armyRosters?.[playerId]?.detachmentName ?? null;
  const stratagems = Array.isArray(gameData.stratagems) ? gameData.stratagems : [];
  const myStratagems = rulesFor(stratagems, playerOneId);
  const opponentStratagems = rulesFor(stratagems, playerTwoId);
  const myRules = rulesFor(gameData.armyRules, playerOneId);
  const opponentRules = rulesFor(gameData.armyRules, playerTwoId);
  const detachments = Array.isArray(gameData.detachments) ? gameData.detachments : [];
  const myDetachmentRules = detachments.filter((item) =>
    item?.playerId === playerOneId || item?.name === detachmentFor(playerOneId));
  const opponentDetachmentRules = detachments.filter((item) =>
    item?.playerId === playerTwoId || item?.name === detachmentFor(playerTwoId));

  const renderPlayerList = (title, playerId, items, emptyText) =>
    '<section class="battle-context__reference-group"><h3>' + escapeHtml(title) + '</h3>' +
    renderDataList(items.filter((item) => !Array.isArray(item?.phases) || !item.phases.length || item.phases.includes(state.phase) ||
      item?.timing === "either-turn" || item?.timing === "either_turn"), emptyText) + '</section>';
  const terrainLabel = state.battlefieldMap?.terrainLayout?.name ??
    state.battlefieldMap?.missionSetup?.layout ?? state.battle?.terrainLayout?.name ?? null;
  const terrainDescription = state.battlefieldMap?.terrainLayout?.description ??
    state.battle?.terrainLayout?.description ?? null;
  const terrainContent = terrainLabel
    ? '<p><strong>' + escapeHtml(terrainLabel) + '</strong></p>' + (terrainDescription ? '<p>' + escapeHtml(terrainDescription) + '</p>' : '')
    : '<p class="battle-context__empty">No terrain layout is recorded for this battle yet.</p>';

  return '<section class="battle-context__references" aria-label="Rules and tactical references">' +
    '<div class="battle-context__section-heading"><h2>Rules & References</h2></div>' +
    referenceSection("Stratagems", renderPlayerList("Your stratagems", playerOneId, myStratagems, "No stratagem catalog is connected to this battle yet.") +
      renderPlayerList("Opponent stratagems", playerTwoId, opponentStratagems, "No opponent stratagem catalog is connected to this battle yet."), { open: true }) +
    referenceSection("Army Rules", renderPlayerList("Your Army Rules", playerOneId, myRules, "Your Army Rules are not connected to this battle yet.") +
      renderPlayerList("Opponent Army Rules", playerTwoId, opponentRules, "Opponent Army Rules are not connected to this battle yet.")) +
    referenceSection("Detachments", renderPlayerList("Your Detachment", playerOneId, myDetachmentRules, detachmentFor(playerOneId) ?? "No detachment has been selected.") +
      renderPlayerList("Opponent Detachment", playerTwoId, opponentDetachmentRules, detachmentFor(playerTwoId) ?? "No opponent detachment has been recorded.")) +
    referenceSection("Terrain Layout", terrainContent) +
    '</section>';
}

export function renderArmyRosterOverlay(state = {}, playerId = null) {
  const players = Array.isArray(state.players) ? state.players : [];
  const selectedPlayer = players.find((player) => player.id === playerId);
  const units = (Array.isArray(state.units) ? state.units : []).filter((unit) => unit.ownerId === playerId);
  if (!selectedPlayer) return '<p>No player roster is available.</p>';
  const rows = units.map((unit) => {
    const badges = [unit.status ?? "unknown"];
    if (isUnitBattleShocked(unit)) badges.push("Battle-shocked");
    const strength = getUnitStrengthAssessment(unit);
    const strengthText = strength.known && Number.isFinite(strength.currentStrength) && Number.isFinite(strength.startingStrength)
      ? strength.currentStrength + "/" + strength.startingStrength + " models"
      : "Model count not fully tracked";
    return '<li><strong>' + escapeHtml(unit.name ?? unit.id) + '</strong><span>' +
      escapeHtml(badges.join(" · ")) + '</span><small>' + escapeHtml(strengthText) +
      (Number.isFinite(unit.wounds) ? ' · ' + escapeHtml(unit.wounds) + ' Wounds' : '') +
      '</small></li>';
  }).join("");
  return '<section class="battle-shell__army-dialog" role="dialog" aria-modal="true" aria-labelledby="battle-shell-army-title">' +
    '<div class="battle-shell__army-dialog-header"><h2 id="battle-shell-army-title">' + escapeHtml(selectedPlayer.name ?? selectedPlayer.id) + ' Army</h2>' +
    '<button type="button" data-close-army-roster>Close</button></div>' +
    (rows ? '<ul class="battle-shell__army-roster">' + rows + '</ul>' : '<p>No units are currently recorded for this player.</p>') +
    '</section>';
}
