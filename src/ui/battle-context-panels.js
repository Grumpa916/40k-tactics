import { getArmyUnitReference, renderArmyUnitSummary } from './army-unit-summary.js';
import { renderLiveCasualtyStatus } from './live-casualty-panel.js';
import { UNIT_STATUS } from "../state/unit.js";
import { getBattleShockEligibility, getUnitStrengthAssessment, isUnitBattleShocked } from "../rules/unit-status-summary.js";
import { getBattleRosterUnit, getBattleUnitDatasheet, hasInvalidWargear } from "../rules/battle-unit-reference.js";
import { getDatasheetWeaponOptions } from "../rules/saved-roster-combat-profile.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function playerName(state, playerId) {
  return state.players?.find((player) => player.id === playerId)?.name ?? playerId ?? "Unknown player";
}

function hasBattleShockTestThisTurn(state, unit) {
  const round = state?.battle?.round ?? 0;
  const turn = state?.turn ?? 0;
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    event?.type === "battle_shock.test_recorded" &&
    event?.payload?.unitId === unit?.id &&
    event?.payload?.round === round &&
    event?.payload?.turn === turn);
}

function humanizeEventType(type) {
  const labels = {
    "battle.started": "Battle started",
    "faction_ability.decision_recorded": "Faction ability decision recorded",
    "turn_clock.started": "Turn Clock started",
    "turn_clock.paused": "Turn Clock paused",
    "battle.deployment_started": "Deployment started",
    "battle.round_started": "Battle round started",
    "battle.round_ended": "Battle round ended",
    "turn.started": "Turn started",
    "turn.ended": "Turn ended",
    "turn.phase_changed": "Phase changed",
    "unit.deployed": "Unit deployed",
    "unit.normal_move_resolved": "Normal move",
    "unit.advanced": "Advance",
    "unit.fell_back": "Fall Back",
    "unit.stationary_recorded": "Remained stationary",
    "unit.casualty_recorded": "Casualty recorded",
    "unit.casualty_undone": "Casualty undone",
    "shooting.unit_activated": "Shooting activation",
    "shooting.phase_completed": "Shooting phase completed",
    "charge.outcome_recorded": "Charge outcome",
    "fight.unit_activated": "Fight activation",
    "fight.phase_completed": "Fight phase completed",
    "combat.attack_resolved": "Attack resolved",
    "unit.mortal_wounds_recorded": "Mortal wounds recorded",
    "rules.reminder_used": "Rule used",
    "custodes.guardians_stratagem_used": "Guardians stratagem used",
    "battle_shock.test_recorded": "Battle-shock test",
    "objective.control_recorded": "Objective control changed",
    "command_points.changed": "Command Points changed",
    "victory_points.awarded": "Victory Points awarded",
    "victory_points.adjusted": "Victory Points adjusted",
    "victory_points.award_undone": "Victory Points award undone",
    "victory_points.adjustment_undone": "Victory Points adjustment undone",
    "secondary_mission.drawn": "Secondary mission recorded",
    "secondary_mission.score_recorded": "Secondary mission scored",
    "battle.army_roster_assigned": "Army roster assigned"
  };
  return labels[type] ?? String(type ?? "Unknown event")
    .split(/[._]/).filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" · ");
}

export function summarizeGameEvent(event, state = {}) {
  const payload = event?.payload ?? {};
  const unitName = (id) => state.units?.find((unit) => unit.id === id)?.name ?? id ?? null;
  const details = [];
  if (event?.type === "combat.attack_resolved") {
    if (payload.attackerId || payload.targetId) {
      details.push((unitName(payload.attackerId) ?? "Unknown attacker") + " → " +
        (unitName(payload.targetId) ?? "Unknown target"));
    }
    if (payload.weaponId) details.push("Weapon: " + payload.weaponId);
    if (Number.isFinite(payload.actualDamage)) details.push(payload.actualDamage + " actual damage");
    if (Number.isFinite(payload.stateDelta?.target?.woundsAfter)) {
      details.push(payload.stateDelta.target.woundsAfter + " Wounds remaining");
    }
    if (payload.stateDelta?.target?.statusAfter === UNIT_STATUS.DESTROYED) details.push("Destroyed");
  } else if (event?.type === 'unit.mortal_wounds_recorded') {
    details.push((unitName(payload.sourceUnitId) ?? 'Source') + ' → ' + (unitName(payload.targetId) ?? 'Target'));
    details.push(payload.actualWounds + ' wounds lost');
    if (Number.isFinite(payload.stateDelta?.target?.woundsAfter)) details.push(payload.stateDelta.target.woundsAfter + ' Wounds remaining');
    if (payload.stateDelta?.target?.statusAfter === UNIT_STATUS.DESTROYED) details.push('Destroyed');
  } else if (event?.type === 'rules.reminder_used' || event?.type === 'custodes.guardians_stratagem_used') {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (payload.ruleName) details.push(payload.ruleName);
    if (payload.enemyUnitId) details.push('Enemy: '+unitName(payload.enemyUnitId));
    if (Number.isFinite(payload.cpSpent)) details.push(payload.cpSpent + ' CP spent');
  } else if (event?.type === "unit.casualty_recorded") {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (Number.isFinite(payload.modelsBefore) && Number.isFinite(payload.modelsAfter)) {
      details.push(payload.modelsBefore + " → " + payload.modelsAfter + " models");
    }
    if (Array.isArray(payload.removedSelections) && payload.removedSelections.length) {
      details.push("Removed: " + payload.removedSelections.join(", "));
    }
  } else if (event?.type === "unit.casualty_undone") {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (Number.isFinite(payload.modelsAfter)) details.push(payload.modelsAfter + " models restored");
  } else if (event?.type === "battle_shock.test_recorded") {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (payload.result) details.push(payload.result === "passed" ? "Passed" : "Failed");
    details.push(payload.battleShockedAfter ? "Battle-shocked" : "Not Battle-shocked");
  } else if (event?.type === "victory_points.awarded" || event?.type === "victory_points.adjusted") {
    if (payload.playerId) details.push(playerName(state, payload.playerId));
    if (Number.isFinite(payload.amount)) details.push((payload.amount > 0 ? "+" : "") + payload.amount + " VP");
    if (payload.reason) details.push(payload.reason);
  } else if (event?.type === "command_points.changed") {
    if (payload.playerId) details.push(playerName(state, payload.playerId));
    if (Number.isFinite(payload.amount)) details.push((payload.amount > 0 ? "+" : "") + payload.amount + " CP");
    if (payload.reason) details.push(payload.reason);
    if (payload.note) details.push(payload.note);
    if (Number.isFinite(payload.balanceAfter)) details.push("Balance " + payload.balanceAfter);
  } else {
    if (payload.unitId) details.push(unitName(payload.unitId));
    if (event?.type === "shooting.unit_activated") details.push(payload.actionType === "not_shoot" ? "Did not shoot" : payload.actionType === "shoot" || !payload.actionType ? "Shoot" : "Action: " + (payload.actionId ?? payload.actionType));
    if (payload.playerId) details.push(playerName(state, payload.playerId));
    if (payload.phase) details.push(payload.phase);
    if (payload.reason) details.push(payload.reason);
    if (payload.outcome) details.push(payload.outcome);
    if (payload.choiceName) details.push(payload.choiceName);
    else if (payload.decisionId) details.push(payload.decisionId);
    if (payload.objectiveId) {
      const objective = state.objectives?.find((item) => item.id === payload.objectiveId);
      details.push(objective?.name ?? payload.objectiveId);
    }
    if (Number.isFinite(payload.amount)) details.push(String(payload.amount));
    if (Number.isFinite(payload.round) && event?.type === "battle.round_started") details.push("Round " + payload.round);
  }
  const context = [];
  if (Number.isFinite(payload.round)) context.push("Round " + payload.round);
  if (Number.isFinite(payload.turn)) context.push("Turn " + payload.turn);
  return {
    title: humanizeEventType(event?.type),
    detail: [...new Set(details.filter(Boolean))].join(" · "),
    context: context.join(" · "),
    type: event?.type ?? "unknown"
  };
}

export function renderUnitStatusPanel(state = {}, { openSections = {} } = {}) {
  const units = Array.isArray(state.units) ? state.units : [];
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const eligible = units.filter((unit) =>
    getBattleShockEligibility(unit).requiresTest === true && !hasBattleShockTestThisTurn(state, unit));
  const needsReview = units.filter((unit) =>
    getBattleShockEligibility(unit).requiresTest === null && !hasBattleShockTestThisTurn(state, unit));
  const reviewCount = needsReview.length;
  const sorted = units.slice().sort((a, b) => {
    const rank = (unit) => {
      if (unit.status === UNIT_STATUS.DESTROYED) return 4;
      if (isUnitBattleShocked(unit)) return 0;
      if (getBattleShockEligibility(unit).requiresTest === true) return 1;
      if (getBattleShockEligibility(unit).requiresTest === null) return 2;
      if (unit.status === UNIT_STATUS.RESERVES) return 3;
      return 2;
    };
    return rank(a) - rank(b) || String(a.name).localeCompare(String(b.name));
  });

  const rows = sorted.map((unit) => {
    const assessment = getBattleShockEligibility(unit);
    const testRecordedThisTurn = hasBattleShockTestThisTurn(state, unit);
    const casualtyStatus = renderLiveCasualtyStatus(state, unit);
    const badges = [];
    if (unit.status === UNIT_STATUS.DESTROYED) {
      badges.push('<span class="battle-context__badge battle-context__badge--danger">Destroyed</span>');
    } else if (unit.status === UNIT_STATUS.RESERVES) {
      badges.push('<span class="battle-context__badge">Reserves</span>');
    } else {
      badges.push('<span class="battle-context__badge">On battlefield</span>');
    }
    if (isUnitBattleShocked(unit)) {
      badges.push('<span class="battle-context__badge battle-context__badge--danger">Battle-shocked</span>');
      if (testRecordedThisTurn) badges.push('<span class="battle-context__badge">Test recorded this Command phase</span>');
    } else if (testRecordedThisTurn) {
      badges.push('<span class="battle-context__badge">Battle-shock test recorded</span>');
    } else if (assessment.requiresTest === true) {
      badges.push('<span class="battle-context__badge battle-context__badge--warning">Battle-shock test due</span>');
    } else if (assessment.requiresTest === null) {
      badges.push('<span class="battle-context__badge battle-context__badge--muted">Strength untracked</span>');
    }

    const wounds = Number.isFinite(unit.wounds)
      ? '<span>' + escapeHtml(unit.wounds) + ' Wounds remaining</span>' : "";
    const lastTest = unit.battleShockLastTest;
    const lastTestText = lastTest?.result
      ? '<small>Last test: ' + escapeHtml(lastTest.result === "passed" ? "Passed" : "Failed") +
        (Number.isFinite(lastTest.round) ? ' · Round ' + escapeHtml(lastTest.round) : "") + '</small>'
      : "";
    const hasDueTest = state.battle?.status === "active" && state.phase === "command" && unit.ownerId === activePlayerId &&
      assessment.requiresTest !== false && !testRecordedThisTurn && unit.status !== UNIT_STATUS.DESTROYED;
    const testControls = hasDueTest
      ? '<div class="battle-context__test-controls"><span>' +
        (assessment.requiresTest === null
          ? "Check the physical unit/card and confirm a test is due."
          : "Record the actual test result.") +
        '</span><div><button type="button" data-battle-shock-result="passed" data-unit-id="' +
        escapeHtml(unit.id) + '" data-eligibility-confirmed="' + (assessment.requiresTest === null ? "true" : "false") +
        '">Passed</button><button type="button" data-battle-shock-result="failed" data-unit-id="' +
        escapeHtml(unit.id) + '" data-eligibility-confirmed="' + (assessment.requiresTest === null ? "true" : "false") +
        '">Failed</button></div></div>'
      : "";
    return '<li class="battle-context__unit"><div class="battle-context__unit-heading"><strong>' +
      escapeHtml(unit.name ?? unit.id) + '</strong><small>' + escapeHtml(playerName(state, unit.ownerId)) +
      '</small></div><div class="battle-context__badges">' + badges.join("") +
      '</div><div class="battle-context__unit-meta">' + wounds + casualtyStatus.meta + lastTestText + '</div>' +
      testControls + casualtyStatus.controls + '</li>';
  }).join("");

  return '<details class="battle-context__section battle-context__unit-status" data-context-key="unit-status"' +
    ((openSections["unit-status"] ?? true) ? " open>" : ">") +
    '<summary><span>Unit Status</span><span class="battle-context__count">' + units.length + ' units</span></summary>' +
    '<p class="battle-context__note">Battle-shock tests are required for units that are currently Battle-shocked or at/below half-strength. Multi-model casualties can be tracked here without changing the normal attack-entry flow.</p>' +
    (eligible.length ? '<p class="battle-context__alert">' + eligible.length + ' unit(s) need Battle-shock attention.</p>' : '') +
    (reviewCount ? '<p class="battle-context__note">' + reviewCount + ' unit(s) need a manual strength check.</p>' : '') +
    (rows ? '<ul class="battle-context__unit-list">' + rows + '</ul>' : '<p>No units have been added to this battle.</p>') +
    '</details>';
}

export function renderEventLogPanel(state = {}, { limit = 10, openSections = {} } = {}) {
  const history = Array.isArray(state.history) ? state.history : [];
  const visibleLimit = Math.max(1, limit);
  const recentEvents = history.slice(-visibleLimit).reverse();
  const olderEvents = history.slice(0, Math.max(0, history.length - recentEvents.length)).reverse();
  const makeEntries = (events) => events.map((event) => {
    const summary = summarizeGameEvent(event, state);
    return '<li class="battle-context__event"><strong>' + escapeHtml(summary.title) + '</strong>' +
      (summary.detail ? '<span>' + escapeHtml(summary.detail) + '</span>' : '') +
      (summary.context ? '<small>' + escapeHtml(summary.context) + '</small>' : '') + '</li>';
  }).join("");
  const olderMarkup = olderEvents.length
    ? '<details class="battle-context__older-events" data-context-key="older-events"' +
      ((openSections["older-events"] ?? false) ? ' open>' : '>') +
      '<summary>Show older events (' + olderEvents.length + ')</summary>' +
      '<ol class="battle-context__event-list">' + makeEntries(olderEvents) + '</ol></details>'
    : "";
  return '<details class="battle-context__section battle-context__event-panel" data-context-key="event-log"' +
    ((openSections["event-log"] ?? true) ? " open>" : ">") +
    '<summary><span>Event Log</span><span class="battle-context__count">' + history.length + ' events</span></summary>' +
    (recentEvents.length ? '<ol class="battle-context__event-list">' + makeEntries(recentEvents) + '</ol>' : '<p>No game events recorded yet.</p>') +
    olderMarkup + '</details>';
}

function renderDataList(items, emptyText) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="battle-context__empty">' + escapeHtml(emptyText) + '</p>';
  }
  return '<ul class="battle-context__reference-list">' + items.map((item) => {
    const name = item?.name ?? item?.label ?? item?.id ?? "Unnamed";
    const detail = item?.description ?? item?.text ?? item?.summary ?? "";
    const cost = Number.isFinite(item?.cpCost) ? item.cpCost :
      Number.isFinite(item?.commandPointCost) ? item.commandPointCost : null;
    const costText = cost == null ? "" : '<span class="battle-context__badge">' + escapeHtml(cost) + ' CP</span>';
    const unavailable = item?.available === false
      ? '<span class="battle-context__badge battle-context__badge--muted">Unavailable</span>' : "";
    const context = [item?.timing, item?.detachmentName].filter(Boolean).map(escapeHtml).join(" · ");
    return '<li><div class="battle-context__reference-title"><strong>' + escapeHtml(name) + '</strong>' +
      costText + unavailable + '</div>' + (context ? '<small class="battle-context__reference-meta">' + context + '</small>' : '') +
      (detail ? '<span>' + escapeHtml(detail) + '</span>' : '') + '</li>';
  }).join("") + '</ul>';
}

function referenceSection(title, content, { open = false, key = "" } = {}) {
  return '<details class="battle-context__reference-section" data-reference-key="' + escapeHtml(key) + '"' +
    (open ? " open" : "") + '><summary>' + escapeHtml(title) + '</summary>' + content + '</details>';
}

export function renderReferencePanel(state = {}, gameData = {}, perspectivePlayerId = null, { openSections = {} } = {}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const yourPlayerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
  const opponentPlayerId = players.find((player) => player.id !== yourPlayerId)?.id ?? null;
  const rulesFor = (items, playerId) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) =>
      ((!item?.playerId && !item?.ownerId) || item?.playerId === playerId || item?.ownerId === playerId) &&
      (!Array.isArray(item?.phases) || !item.phases.length || item.phases.includes(state.phase) ||
        item?.timing === "either-turn" || item?.timing === "either_turn"));
  };
  const detachmentFor = (playerId) =>
    state.armyRosters?.[playerId]?.detachment ?? state.armyRosters?.[playerId]?.detachmentName ?? null;
  const selectedDetachmentNames = (roster) => [...new Set([
    ...(Array.isArray(roster?.detachments) ? roster.detachments : []),
    roster?.detachment,
    roster?.detachmentName
  ].map((name) => String(name ?? "").trim()).filter(Boolean))];
  const rosterStratagemCatalogs = players.map((player) => {
    const roster = state.armyRosters?.[player.id];
    const catalog = roster?.rulesDataRevision?.factionRules?.detachments;
    const selected = selectedDetachmentNames(roster);
    const matched = Array.isArray(catalog)
      ? selected.map((name) => catalog.find((entry) => entry?.name === name)).filter(Boolean)
      : [];
    const catalogNotes = matched
      .filter((detachment) => detachment.stratagemCatalogStatus === "partial" ||
        detachment.stratagemCatalogStatus === "not-imported")
      .map((detachment) => detachment.stratagemCatalogStatus === "partial"
        ? detachment.name + ": partial catalog; only verified entries are shown."
        : detachment.name + ": stratagem entries have not been imported yet.");
    return { playerId: player.id, hasCatalog: matched.length > 0, catalogNotes,
      stratagems: matched.flatMap((detachment) => (Array.isArray(detachment.stratagems) ? detachment.stratagems : [])
        .map((stratagem) => ({ ...stratagem, playerId: player.id, detachmentName: detachment.name }))) };
  });
  const stratagems = [
    ...(Array.isArray(gameData.stratagems) ? gameData.stratagems : []),
    ...rosterStratagemCatalogs.flatMap((entry) => entry.stratagems)
  ];
  const stratagemEmptyText = (playerId) => rosterStratagemCatalogs.find((entry) => entry.playerId === playerId)?.hasCatalog
    ? "No stratagem entries are recorded for the selected detachment yet."
    : "No stratagem catalog is connected to this battle yet.";
  const stratagemCatalogNote = (playerId) => {
    const notes = rosterStratagemCatalogs.find((entry) => entry.playerId === playerId)?.catalogNotes ?? [];
    return notes.length
      ? '<p class="battle-context__empty">' + escapeHtml(notes.join(" ")) + '</p>'
      : "";
  };
  const rosterRules = players.flatMap((player) => {
    const revision = state.armyRosters?.[player.id]?.rulesDataRevision;
    const rules = revision?.factionRules?.armyRules;
    return Array.isArray(rules) ? rules.map((rule) => ({
      ...rule,
      playerId: player.id,
      description: rule.description ?? rule.effect ?? rule.summary ?? ""
    })) : [];
  });
  const armyRules = [...(Array.isArray(gameData.armyRules) ? gameData.armyRules : []), ...rosterRules];
  const rosterDetachments = players.flatMap((player) => {
    const roster = state.armyRosters?.[player.id];
    const selectedName = roster?.detachment ?? roster?.detachmentName;
    const catalog = roster?.rulesDataRevision?.factionRules?.detachments;
    if (!selectedName || !Array.isArray(catalog)) return [];
    const match = catalog.find((item) => item?.name === selectedName);
    return match ? [{ ...match, playerId: player.id, description: `${match.forceDisposition} · ${match.detachmentPoints} DP` }] : [];
  });
  const detachments = [...(Array.isArray(gameData.detachments) ? gameData.detachments : []), ...rosterDetachments];
  const myDetachmentRules = detachments.filter((item) =>
    item?.playerId === yourPlayerId ||
    (!item?.playerId && !item?.ownerId && item?.name === detachmentFor(yourPlayerId)));
  const opponentDetachmentRules = detachments.filter((item) =>
    item?.playerId === opponentPlayerId ||
    (!item?.playerId && !item?.ownerId && item?.name === detachmentFor(opponentPlayerId)));
  const terrainLabel = state.battlefieldMap?.terrainLayout?.name ??
    state.battlefieldMap?.missionSetup?.layout ?? state.battle?.terrainLayout?.name ?? null;
  const terrainDescription = state.battlefieldMap?.terrainLayout?.description ??
    state.battle?.terrainLayout?.description ?? null;
  const terrainContent = terrainLabel
    ? '<p><strong>' + escapeHtml(terrainLabel) + '</strong></p>' +
      (terrainDescription ? '<p>' + escapeHtml(terrainDescription) + '</p>' : '')
    : '<p class="battle-context__empty">No terrain layout is recorded for this battle yet.</p>';

  const groups = '<section class="battle-context__reference-group"><h3>Your stratagems</h3>' +
    stratagemCatalogNote(yourPlayerId) +
    renderDataList(rulesFor(stratagems, yourPlayerId), stratagemEmptyText(yourPlayerId)) +
    '</section><section class="battle-context__reference-group"><h3>Opponent stratagems</h3>' +
    stratagemCatalogNote(opponentPlayerId) +
    renderDataList(rulesFor(stratagems, opponentPlayerId), stratagemEmptyText(opponentPlayerId)) +
    '</section>';
  return '<section class="battle-context__references" aria-label="Rules and tactical references">' +
    '<h2 class="battle-context__section-heading">Rules & References</h2>' +
    referenceSection("Stratagems", groups, { open: openSections.stratagems ?? true, key: "stratagems" }) +
    referenceSection("Army Rules",
      '<section class="battle-context__reference-group"><h3>Your Army Rules</h3>' +
      renderDataList(rulesFor(armyRules, yourPlayerId), "Your Army Rules are not connected to this battle yet.") +
      '</section><section class="battle-context__reference-group"><h3>Opponent Army Rules</h3>' +
      renderDataList(rulesFor(armyRules, opponentPlayerId), "Opponent Army Rules are not connected to this battle yet.") +
      '</section>', { open: openSections.armyRules ?? false, key: "army-rules" }) +
    referenceSection("Detachments",
      '<section class="battle-context__reference-group"><h3>Your Detachment</h3>' +
      renderDataList(myDetachmentRules, detachmentFor(yourPlayerId) ?? "No detachment has been selected.") +
      '</section><section class="battle-context__reference-group"><h3>Opponent Detachment</h3>' +
      renderDataList(opponentDetachmentRules, detachmentFor(opponentPlayerId) ?? "No opponent detachment has been recorded.") +
      '</section>', { open: openSections.detachments ?? false, key: "detachments" }) +
    referenceSection("Terrain Layout", terrainContent, { open: openSections.terrain ?? false, key: "terrain" }) + '</section>';
}

function displayLabel(key) {
  return String(key ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderCharacteristics(characteristics, { singleLine = false } = {}) {
  if (!characteristics || typeof characteristics !== "object" || Array.isArray(characteristics)) {
    return '<p class="battle-context__empty">Characteristics are not loaded for this unit.</p>';
  }
  const entries = Object.entries(characteristics).filter(([, value]) =>
    value !== null && value !== undefined && value !== "");
  if (!entries.length) return '<p class="battle-context__empty">Characteristics are not loaded for this unit.</p>';
  const layout = singleLine
    ? ` class="battle-shell__army-characteristics prototype-unit-profile-characteristics" style="--unit-stat-count:${entries.length}"`
    : ' class="battle-shell__army-characteristics"';
  return '<dl' + layout + '>' + entries.map(([key, value]) =>
    '<div><dt>' + escapeHtml(displayLabel(key)) + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
  ).join("") + '</dl>';
}

function normalizedWeaponName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function weaponProfilesForUnit(unit, gameData) {
  const catalog = [
    ...(Array.isArray(gameData?.weapons) ? gameData.weapons : []),
    ...(Array.isArray(gameData?.weaponProfiles) ? gameData.weaponProfiles : [])
  ];
  const embedded = Array.isArray(unit.profile?.weapons) ? unit.profile.weapons : [];
  const ids = Array.isArray(unit.profile?.weaponIds) ? unit.profile.weaponIds : [];
  return [
    ...embedded,
    ...ids.map((id) => catalog.find((weapon) => weapon?.id === id)).filter(Boolean)
  ];
}

function weaponCharacteristics(weapon) {
  if (weapon?.characteristics && typeof weapon.characteristics === "object") return weapon.characteristics;
  return Object.fromEntries(Object.entries(weapon ?? {}).filter(([key]) =>
    ["range", "attacks", "skill", "strength", "ap", "damage", "abilities"].includes(key) &&
    weapon[key] !== null && weapon[key] !== undefined && weapon[key] !== ""
  ));
}

function renderWeaponEntries(entries) {
  if (!entries.length) {
    return '<p class="battle-context__empty">Weapon reference data is not loaded for this unit.</p>';
  }
  return '<ul class="battle-shell__army-weapons">' + entries.map(({ weapon, activeQuantity, equippedQuantity, confirmed }) => {
    const chars = weaponCharacteristics(weapon);
    const detail = renderCharacteristics(chars);
    const type = weapon?.type
      ? '<span class="battle-context__badge">' + escapeHtml(weapon.type) + '</span>'
      : "";
    const quantity = confirmed
      ? '<span class="prototype-unit-weapon-count">' + escapeHtml(activeQuantity) + ' active · ' +
        escapeHtml(equippedQuantity) + ' equipped</span>'
      : '<span class="prototype-unit-weapon-count">Reference profile</span>';
    return '<li><div class="battle-shell__army-weapon-heading"><strong>' +
      escapeHtml(weapon?.name ?? weapon?.id ?? "Unnamed weapon") + '</strong>' + type + quantity + '</div>' +
      (weapon?.description ? '<p>' + escapeHtml(weapon.description) + '</p>' : '') + detail + '</li>';
  }).join("") + '</ul>';
}

function renderUnitWeapons(state, unit, rosterUnit, gameData) {
  const profiles = weaponProfilesForUnit(unit, gameData);
  const selections = (Array.isArray(rosterUnit?.equippedWeapons) ? rosterUnit.equippedWeapons : [])
    .filter((item) => item && Number(item.quantity ?? 1) > 0);
  const needsReview = hasInvalidWargear(state, unit);

  if (selections.length && !needsReview) {
    const options = getDatasheetWeaponOptions(state, unit);
    const selectedEntries = options.map((option) => {
      const weapon = profiles.find((profile) =>
        normalizedWeaponName(profile?.name) === normalizedWeaponName(option.name)
      ) ?? option;
      return {
        weapon,
        activeQuantity: option.activeQuantity ?? option.equippedQuantity ?? 1,
        equippedQuantity: option.equippedQuantity ?? option.activeQuantity ?? 1,
        confirmed: true
      };
    });
    if (selectedEntries.length) {
      return '<p class="prototype-unit-loadout-note">Equipped weapon profiles from the saved army loadout. Active counts reflect recorded model losses.</p>' +
        renderWeaponEntries(selectedEntries);
    }
  }

  if (!profiles.length) return renderWeaponEntries([]);
  const message = needsReview
    ? "The saved loadout needs review. These are datasheet reference profiles, not confirmed equipped weapons."
    : selections.length
      ? "The saved weapon choices could not be matched to the current profiles. Review the roster loadout before relying on these."
      : "No confirmed equipped weapon selection is saved for this unit. These are datasheet reference profiles.";
  return '<p class="prototype-unit-loadout-note" data-tone="warning">' + escapeHtml(message) + '</p>' +
    renderWeaponEntries(profiles.map((weapon) => ({ weapon, confirmed: false })));
}

function renderUnitAbilities(unit) {
  const abilities = Array.isArray(unit.profile?.abilities) ? unit.profile.abilities
    : Array.isArray(unit.abilities) ? unit.abilities
    : Array.isArray(unit.metadata?.abilities) ? unit.metadata.abilities : [];
  if (!abilities.length) return '<p class="battle-context__empty">Ability reference data is not loaded for this unit.</p>';
  return '<ul class="battle-shell__army-abilities">' + abilities.map((ability) => {
    const name = typeof ability === "string" ? ability : ability?.name ?? ability?.label ?? "Unnamed ability";
    const text = typeof ability === "string" ? "" : ability?.description ?? ability?.text ?? ability?.summary ?? "";
    return '<li><strong>' + escapeHtml(name) + '</strong>' +
      (text ? '<p>' + escapeHtml(text) + '</p>' : '') + '</li>';
  }).join("") + '</ul>';
}

function renderUnitKeywords(unit) {
  const keywords = Array.isArray(unit.profile?.keywords) ? unit.profile.keywords : [];
  if (!keywords.length) return '<p class="battle-context__empty">Keywords are not loaded for this unit.</p>';
  return '<p class="prototype-unit-keywords">' + keywords.map((keyword) =>
    escapeHtml(typeof keyword === "string" ? keyword : keyword?.name ?? keyword?.keyword ?? "")
  ).filter(Boolean).join(" · ") + '</p>';
}

function renderUnitNotes(unit, rosterUnit) {
  const armyNotes = String(rosterUnit?.notes ?? "").trim();
  const battleNote = String(unit.metadata?.battleRulesNote ?? "").trim();
  if (!armyNotes && !battleNote) {
    return '<p class="battle-context__empty">No notes are saved for this unit.</p>';
  }
  return (armyNotes
    ? '<section class="prototype-unit-note"><h3>Army list notes</h3><p>' + escapeHtml(armyNotes) + '</p></section>'
    : '') + (battleNote
      ? '<section class="prototype-unit-note"><h3>Battle note</h3><p>' + escapeHtml(battleNote) + '</p></section>'
      : '');
}

export function renderArmyRosterOverlay(state = {}, playerId = null, gameData = {}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const selectedPlayer = players.find((player) => player.id === playerId);
  const units = (Array.isArray(state.units) ? state.units : []).filter((unit) => unit.ownerId === playerId);
  if (!selectedPlayer) return '<p>No player roster is available.</p>';
  const rows = units.map(unit => '<li>' + renderArmyUnitSummary(state,unit) + '</li>').join('');
  return '<section class="battle-shell__army-dialog" role="dialog" aria-modal="true" aria-labelledby="battle-shell-army-title">' +
    '<div class="battle-shell__army-dialog-header"><h2 id="battle-shell-army-title">' +
    escapeHtml(selectedPlayer.name ?? selectedPlayer.id) +
    ' Army</h2><button type="button" data-close-army-roster>Close</button></div>' +
    (rows ? '<ul class="battle-shell__army-roster">' + rows + '</ul>' : '<p>No units are currently recorded for this player.</p>') +
    '</section>';
}

export function renderArmyUnitDialog(state, unitId, gameData = {}, selectedTab = "profile") {
  const original = state.units?.find(unit => unit.id === unitId);
  if (!original) return '<p>Unit no longer available.</p><button data-army-back>Back to army</button>';
  const unit = getArmyUnitReference(state, original);
  const rosterUnit = getBattleRosterUnit(state, original);
  const savedCharacteristics = rosterUnit?.datasheet?.characteristics;
  const battleCharacteristics = original.profile?.characteristics ?? original.characteristics;
  const fallbackCharacteristics = getBattleUnitDatasheet(state, original)?.characteristics;
  const profileCharacteristics = savedCharacteristics && Object.keys(savedCharacteristics).length
    ? savedCharacteristics
    : battleCharacteristics && Object.keys(battleCharacteristics).length
      ? battleCharacteristics
      : fallbackCharacteristics;
  const tabs = ["profile", "weapons", "abilities", "notes"];
  const activeTab = tabs.includes(selectedTab) ? selectedTab : "profile";
  const tabTitle = { profile: "Profile", weapons: "Weapons", abilities: "Abilities", notes: "Notes" };
  const tabButtons = tabs.map((tab) =>
    '<button type="button" role="tab" id="army-unit-tab-' + tab + '" aria-controls="army-unit-panel-' + tab +
    '" aria-selected="' + String(activeTab === tab) + '" tabindex="' + (activeTab === tab ? "0" : "-1") +
    '" data-unit-detail-tab="' + tab + '">' + tabTitle[tab] + '</button>'
  ).join("");
  const keywords = Array.isArray(unit.profile?.keywords) ? unit.profile.keywords : [];
  const sourceStatus = rosterUnit?.dataSource?.status ?? rosterUnit?.verificationStatus;
  const sourceLine = typeof sourceStatus === "string" && sourceStatus
    ? "Army data status · " + escapeHtml(sourceStatus)
    : rosterUnit ? "Reference from the saved army list" : "Reference data attached to this battle";
  const dataPanels = {
    profile: '<div id="army-unit-panel-profile" role="tabpanel" aria-labelledby="army-unit-tab-profile" data-unit-detail-panel="profile"' +
      (activeTab === "profile" ? "" : " hidden") + '><p class="prototype-unit-data-status">' + sourceLine + '</p>' +
      '<h3>Characteristics</h3>' + renderCharacteristics(profileCharacteristics, { singleLine: true }) +
      '<h3>Keywords</h3>' + renderUnitKeywords(unit) + '</div>',
    weapons: '<div id="army-unit-panel-weapons" role="tabpanel" aria-labelledby="army-unit-tab-weapons" data-unit-detail-panel="weapons"' +
      (activeTab === "weapons" ? "" : " hidden") + '>' +
      renderUnitWeapons(state, unit, rosterUnit, gameData) + '</div>',
    abilities: '<div id="army-unit-panel-abilities" role="tabpanel" aria-labelledby="army-unit-tab-abilities" data-unit-detail-panel="abilities"' +
      (activeTab === "abilities" ? "" : " hidden") + '><h3>Abilities</h3>' + renderUnitAbilities(unit) + '</div>',
    notes: '<div id="army-unit-panel-notes" role="tabpanel" aria-labelledby="army-unit-tab-notes" data-unit-detail-panel="notes"' +
      (activeTab === "notes" ? "" : " hidden") + '>' + renderUnitNotes(unit, rosterUnit) + '</div>'
  };
  const points = unit.points ?? unit.metadata?.points;
  const wounds = unit.wounds ?? "—";
  const unitStatus = unit.status ?? "Status unavailable";
  return '<section class="battle-shell__army-dialog prototype-unit-dialog" role="dialog" aria-modal="true" aria-labelledby="prototype-unit-title">' +
    '<header class="battle-shell__army-dialog-header"><button type="button" data-army-back>← Army list</button><h2 id="prototype-unit-title">' +
    escapeHtml(unit.name ?? unit.id) + '</h2><button type="button" data-close-army-roster>Close</button></header>' +
    '<p>' + (Number.isFinite(points) ? escapeHtml(points) + ' pts · ' : '') + escapeHtml(unitStatus) +
    ' · ' + escapeHtml(wounds) + ' Wounds remaining</p>' +
    '<div class="prototype-unit-tabs" role="tablist" aria-label="' + escapeHtml(unit.name ?? unit.id) + ' army reference">' +
    tabButtons + '</div>' +
    dataPanels.profile + dataPanels.weapons + dataPanels.abilities + dataPanels.notes + '</section>';
}
