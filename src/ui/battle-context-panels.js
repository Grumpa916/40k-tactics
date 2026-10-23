import { assessUnitStrength, unitNeedsBattleShockTest } from "../rules/battle-shock.js";
import { UNIT_STATUS, isUnitBattleShocked } from "../state/unit-status.js";
import { resolveUnitCasualtyOptions, getLatestCasualtyEvent } from "../rules/live-casualty-state.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function playerName(state, playerId) {
  return state.players?.find((player) => player.id === playerId)?.name ?? playerId ?? "Unknown player";
}

function humanizeEventType(type) {
  return String(type ?? "event")
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" · ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function casualtyOptionControls(unit, options) {
  if (!options?.canRecord) return "";
  if (options.mode === "simple") {
    return '<button type="button" class="battle-context__casualty-quick" data-record-casualty="' +
      escapeHtml(unit.id) + '">−1 model</button>';
  }
  if (options.mode === "weapon-choice") {
    return '<div class="battle-context__casualty-choices">' + options.choices.map((choice) =>
      '<button type="button" data-record-casualty="' + escapeHtml(unit.id) + '" data-casualty-selection="' +
      escapeHtml(choice.name) + '">' + escapeHtml(choice.name) + '</button>').join("") + '</div>';
  }
  if (options.mode === "complex") {
    const selectors = options.slots.map((slot) =>
      '<label>' + escapeHtml(slot.label) + '<select data-casualty-slot="' + escapeHtml(slot.id) + '">' +
      '<option value="">Select…</option>' + slot.choices.map((choice) =>
        '<option value="' + escapeHtml(choice.name) + '">' + escapeHtml(choice.name) + '</option>').join("") +
      '</select></label>').join("");
    const optional = options.optional.map((item) => '<label class="battle-context__check"><input type="checkbox" ' +
      'data-casualty-optional="' + escapeHtml(item.name) + '"> ' + escapeHtml(item.name) + '</label>').join("");
    return '<div class="battle-context__casualty-complex">' + selectors + optional +
      '<button type="button" data-record-casualty="' + escapeHtml(unit.id) + '">Record casualty</button></div>';
  }
  return "";
}

function casualtyControls(unit, state) {
  const options = resolveUnitCasualtyOptions(state, unit);
  const remaining = Number.isInteger(unit.modelsRemaining) ? unit.modelsRemaining :
    Number.isInteger(unit.modelCount) ? unit.modelCount : null;
  const initial = Number.isInteger(unit.initialModelCount) ? unit.initialModelCount :
    Number.isInteger(unit.modelCount) ? unit.modelCount : null;
  const countText = remaining == null || initial == null ? "" :
    '<span>' + remaining + ' / ' + initial + ' models remaining</span>';
  const latest = getLatestCasualtyEvent(state, unit.id);
  const undo = latest ? '<button type="button" data-undo-casualty="' + escapeHtml(unit.id) + '">Undo casualty</button>' : "";
  const details = options?.canRecord
    ? '<details class="battle-context__casualty-entry"><summary>Record casualty</summary>' + casualtyOptionControls(unit, options) + '</details>'
    : "";
  return { meta: countText, controls: details + undo };
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
  const eligible = units.filter((unit) => unitNeedsBattleShockTest(unit, state) === true);
  const reviewCount = units.filter((unit) => unitNeedsBattleShockTest(unit, state) === null).length;
  const rows = units.map((unit) => {
    const assessment = assessUnitStrength(unit);
    const shocked = isUnitBattleShocked(unit);
    const testRecordedThisTurn = (Array.isArray(state.history) ? state.history : []).some((event) =>
      event?.type === "battle_shock.test_recorded" && event.payload?.unitId === unit.id &&
      event.payload?.round === state.battle?.round && event.payload?.turn === state.turn);
    const casualtyStatus = casualtyControls(unit, state);
    const badges = [];
    if (unit.status === UNIT_STATUS.DESTROYED) {
      badges.push('<span class="battle-context__badge battle-context__badge--danger">Destroyed</span>');
    } else if (shocked) {
      badges.push('<span class="battle-context__badge battle-context__badge--danger">Battle-shocked</span>');
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
    return '<li><div class="battle-context__reference-title"><strong>' + escapeHtml(name) + '</strong>' +
      costText + unavailable + '</div>' + (detail ? '<span>' + escapeHtml(detail) + '</span>' : '') + '</li>';
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
  const stratagems = Array.isArray(gameData.stratagems) ? gameData.stratagems : [];
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
    if (!match) return [];
    const ruleText = match.ruleName && match.rule ? ` · ${match.ruleName}: ${match.rule}` : match.rule ? ` · ${match.rule}` : "";
    return [{ ...match, playerId: player.id, description: `${match.forceDisposition} · ${match.detachmentPoints} DP${ruleText}` }];
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
    renderDataList(rulesFor(stratagems, yourPlayerId), "No stratagem catalog is connected to this battle yet.") +
    '</section><section class="battle-context__reference-group"><h3>Opponent stratagems</h3>' +
    renderDataList(rulesFor(stratagems, opponentPlayerId), "No opponent stratagem catalog is connected to this battle yet.") +
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
  return String(key ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function renderArmyRosterOverlay(state = {}, playerId) {
  const roster = state.armyRosters?.[playerId] ?? null;
  const units = state.units?.filter((unit) => unit.ownerId === playerId) ?? [];
  const rosterUnits = roster?.units ?? [];
  const rows = rosterUnits.length ? rosterUnits.map((rosterUnit) => {
    const live = units.find((unit) => unit.rosterUnitId === rosterUnit.id || unit.id === rosterUnit.id);
    const status = live?.status ?? rosterUnit.status ?? "unknown";
    const modelCount = Number.isInteger(live?.modelsRemaining) ? live.modelsRemaining :
      Number.isInteger(rosterUnit.modelCount) ? rosterUnit.modelCount : null;
    return '<li class="battle-context__army-unit"><button type="button" data-army-unit-detail="' + escapeHtml(rosterUnit.id) +
      '" data-army-player-id="' + escapeHtml(playerId) + '"><strong>' + escapeHtml(rosterUnit.name) + '</strong>' +
      '<span>' + (modelCount == null ? 'Models unknown' : escapeHtml(modelCount) + ' model' + (modelCount === 1 ? '' : 's')) +
      ' · ' + escapeHtml(status) + '</span></button></li>';
  }).join("") : '<li>No saved roster units are available.</li>';
  return '<section class="battle-context__army-overlay"><header><h2>' + escapeHtml(roster?.name ?? playerName(state, playerId)) +
    '</h2><button type="button" data-close-army-overlay aria-label="Close army list">×</button></header><p>' +
    escapeHtml(roster?.faction ?? 'Faction not recorded') + (roster?.detachment ? ' · ' + escapeHtml(roster.detachment) : '') +
    '</p><ul>' + rows + '</ul></section>';
}

export function renderArmyUnitDialog(state = {}, playerId, rosterUnitId) {
  const rosterUnit = state.armyRosters?.[playerId]?.units?.find((unit) => unit.id === rosterUnitId);
  if (!rosterUnit) return '';
  const c = rosterUnit.datasheet?.characteristics ?? {};
  const characteristics = Object.entries(c).map(([key, value]) =>
    '<span><small>' + escapeHtml(displayLabel(key)) + '</small><strong>' + escapeHtml(value) + '</strong></span>').join('');
  const weapons = (rosterUnit.datasheet?.weapons ?? []).map((weapon) => '<tr><th>' + escapeHtml(weapon.name) + '</th>' +
    '<td>' + escapeHtml(weapon.range ?? '—') + '</td><td>' + escapeHtml(weapon.attacks ?? '—') + '</td><td>' +
    escapeHtml(weapon.skill ?? '—') + '</td><td>' + escapeHtml(weapon.strength ?? '—') + '</td><td>' +
    escapeHtml(weapon.ap ?? '—') + '</td><td>' + escapeHtml(weapon.damage ?? '—') + '</td></tr>').join('');
  const abilities = (rosterUnit.datasheet?.abilities ?? []).map((ability) => '<details><summary>' + escapeHtml(ability.name) +
    '</summary><p>' + escapeHtml(ability.description ?? '') + '</p></details>').join('');
  return '<section class="battle-context__unit-dialog"><header><h2>' + escapeHtml(rosterUnit.name) +
    '</h2><button type="button" data-close-army-unit-detail aria-label="Close unit detail">×</button></header>' +
    '<div class="battle-context__stat-grid">' + (characteristics || '<span>Characteristics unavailable.</span>') + '</div>' +
    '<div class="battle-context__weapon-table"><table><thead><tr><th>Weapon</th><th>Range</th><th>A</th><th>Skill</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>' +
    (weapons || '<tr><td colspan="7">Weapon profiles unavailable.</td></tr>') + '</tbody></table></div>' +
    '<div class="battle-context__ability-list">' + (abilities || '<p>Ability text unavailable.</p>') + '</div></section>';
}
