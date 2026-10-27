import { getBattleShockEligibility, isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { getTyranidDecisionReminders, TYRANID_DECISION_IDS } from '../rules/tyranid-decision-reminders.js';
import {
  getPunishmentCondemnationCandidates,
  isPunishmentCondemnationRequired,
  PUNISHMENT_CONDEMNATION_MAP_NOTE
} from '../rules/punishment-condemnation.js';
const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function hasBattleShockTestInCurrentTurn(state, unitId, round, turn) {
  return (Array.isArray(state.history) ? state.history : []).some((event) =>
    event?.type === "battle_shock.test_recorded" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === round &&
    event?.payload?.turn === turn);
}

function renderPunishmentCondemnationReminder(state) {
  const playerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
  if (!isPunishmentCondemnationRequired(state, { playerId })) return "";
  const candidates = getPunishmentCondemnationCandidates(state, { playerId });
  if (!candidates.length) return "";
  const suggested = new Set(candidates.filter((candidate) => candidate.likelyQualifier).slice(0, 3).map((candidate) => candidate.unitId));
  const rows = candidates.map((candidate, index) => {
    const hints = [];
    if (candidate.recordedPreviousTurnKiller) hints.push('Recorded killer last turn');
    if (candidate.mapSuggestsObjectiveRange) hints.push('Map suggests objective range — verify');
    if (!hints.length) hints.push('Fallback / tabletop-confirmed qualifier only');
    const checked = suggested.has(candidate.unitId) || (!suggested.size && index === 0);
    return '<label class="punishment-reminder__unit"><input type="checkbox" name="condemned-unit" value="' +
      escapeHtml(candidate.unitId) + '"' + (checked ? ' checked' : '') + '><span><strong>' +
      escapeHtml(candidate.unitName) + '</strong><small>' + escapeHtml(hints.join(' · ')) + '</small></span></label>';
  }).join('');
  return '<div class="punishment-reminder__backdrop"><style>' +
    '.punishment-reminder__backdrop{position:fixed;inset:0;z-index:1500;display:grid;place-items:center;padding:18px;background:rgba(8,7,12,.76)}' +
    '.punishment-reminder{width:min(760px,96vw);max-height:88vh;overflow:auto;padding:18px;border:1px solid #b99bdd;border-radius:12px;background:#211b2a;color:#fff;box-shadow:0 18px 60px rgba(0,0,0,.5)}' +
    '.punishment-reminder__kicker{font-size:.78rem;font-weight:800;letter-spacing:.08em;color:#cdb8e5}.punishment-reminder h2{margin:6px 0 8px}.punishment-reminder p{margin:7px 0}' +
    '.punishment-reminder__list{display:grid;gap:8px;margin:14px 0}.punishment-reminder__unit{display:flex;gap:10px;align-items:flex-start;padding:11px;border:1px solid #54445f;border-radius:9px;background:#18141e}' +
    '.punishment-reminder__unit input{width:24px;height:24px;flex:0 0 auto}.punishment-reminder__unit span{display:grid;gap:3px}.punishment-reminder__unit small{color:#d1c7d9}' +
    '.punishment-reminder__note{font-size:.88rem;color:#d1c7d9}.punishment-reminder__actions{display:flex;justify-content:flex-end}.punishment-reminder__actions button{min-height:48px;padding:10px 16px;border:1px solid #b99bdd;border-radius:8px;background:#41314f;color:#fff;font:inherit;font-weight:800}' +
    '</style><section class="punishment-reminder" role="dialog" aria-modal="true" aria-labelledby="punishment-reminder-title">' +
    '<div class="punishment-reminder__kicker">START OF TURN · PUNISHMENT</div><h2 id="punishment-reminder-title">Select condemned enemy units</h2>' +
    '<p>Select <strong>1–3 enemy units</strong> that qualify on the tabletop. Qualifying units are on the battlefield and are within range of an objective and/or destroyed one of your units in the previous turn. If none qualify, select any one enemy unit on the battlefield.</p>' +
    '<p class="punishment-reminder__note">The app preselects its best recorded candidates to reduce taps. Review them against the physical table before recording. ' + escapeHtml(PUNISHMENT_CONDEMNATION_MAP_NOTE) + '</p>' +
    '<form data-punishment-condemnation-form data-player-id="' + escapeHtml(playerId) + '"><div class="punishment-reminder__list">' + rows + '</div>' +
    '<label class="punishment-reminder__note"><input type="checkbox" name="tabletop-confirmed" value="yes" required> I confirmed the selected units qualify using the tabletop positions/rules.</label>' +
    '<div class="punishment-reminder__actions"><button type="submit">Record condemned units</button></div></form></section></div>';
}

function renderBattleShockReminder(state, reminder) {
  if (!reminder || state?.battle?.status !== "active" || state.phase !== "command") return "";
  const round = state.battle?.round ?? 0;
  const turn = state.turn ?? 0;
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  if (reminder.playerId !== activePlayerId || reminder.round !== round || reminder.turn !== turn) return "";
  const units = (Array.isArray(state.units) ? state.units : []).filter((unit) => {
    if (unit.ownerId !== reminder.playerId ||
        hasBattleShockTestInCurrentTurn(state, unit.id, round, turn)) return false;
    const eligibility = getBattleShockEligibility(unit);
    return eligibility.requiresTest === true;
  });
  if (!units.length) return "";
  const untrackedCount = (Array.isArray(state.units) ? state.units : []).filter((unit) =>
    unit.ownerId === reminder.playerId &&
    !hasBattleShockTestInCurrentTurn(state, unit.id, round, turn) &&
    getBattleShockEligibility(unit).requiresTest === null
  ).length;

  const rows = units.map((unit) => {
    const eligibility = getBattleShockEligibility(unit);
    const unknown = eligibility.requiresTest === null;
    const reason = isUnitBattleShocked(unit)
      ? "Already Battle-shocked — test required"
      : unknown
        ? "Strength is not tracked — check the physical unit and datasheet"
        : "At or below half-strength";
    const confirmed = unknown ? "true" : "false";
    const unitId = escapeHtml(unit.id);
    return '<li class="battle-shock-reminder__unit"><div><strong>' +
      escapeHtml(unit.name ?? unit.id) + '</strong><small>' + escapeHtml(reason) + '</small></div>' +
      '<div class="battle-shock-reminder__results">' +
      '<button type="button" data-battle-shock-result="passed" data-unit-id="' + unitId +
      '" data-eligibility-confirmed="' + confirmed + '">Passed</button>' +
      '<button type="button" data-battle-shock-result="failed" data-unit-id="' + unitId +
      '" data-eligibility-confirmed="' + confirmed + '">Failed</button>' +
      '</div></li>';
  }).join("");
  return '<div class="battle-shock-reminder__backdrop"><section class="battle-shock-reminder" role="dialog" ' +
    'aria-modal="true" aria-labelledby="battle-shock-reminder-title"><div class="battle-shock-reminder__kicker">COMMAND PHASE</div>' +
    '<h2 id="battle-shock-reminder-title">Battle-shock checks</h2>' +
    '<p>Review these units now. Enter the actual result from the table.</p>' +
    (untrackedCount ? '<p class="battle-shock-reminder__note">' + untrackedCount +
      ' additional unit(s) have untracked strength. Check Unit Status and the physical unit/card; they are not assumed to need a test.</p>' : '') +
    '<ul class="battle-shock-reminder__list">' + rows + '</ul>' +
    '<div class="battle-shock-reminder__actions"><button type="button" data-dismiss-battle-shock-reminder>Review later</button></div>' +
    '</section></div>';
}

export function tyranidDecisionContextKey(decision, state) {
  return [
    decision?.id ?? "",
    state?.battle?.round ?? 0,
    state?.turn ?? 0,
    state?.activePlayer ?? state?.battle?.activePlayerId ?? ""
  ].join(":");
}

function renderTyranidDecisionReminder(decision) {
  if (!decision) return "";
  if (decision.id === TYRANID_DECISION_IDS.HYPER_ADAPTATIONS) {
    const options = (decision.options ?? []).map((option) =>
      '<li class="tyranid-decision-reminder__option"><div><strong>' + escapeHtml(option.name) +
      '</strong><p>' + escapeHtml(option.summary) + '</p></div>' +
      '<button type="button" data-faction-decision-choice="' + escapeHtml(option.id) +
      '" data-faction-decision-id="' + escapeHtml(decision.id) +
      '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Choose</button></li>'
    ).join("");
    return '<div class="tyranid-decision-reminder__backdrop"><section class="tyranid-decision-reminder" role="dialog" ' +
      'aria-modal="true" aria-labelledby="tyranid-hyper-adaptations-title"><div class="tyranid-decision-reminder__kicker">ROUND 1 · INVASION FLEET</div>' +
      '<h2 id="tyranid-hyper-adaptations-title">Choose Hyper-adaptations</h2>' +
      '<p>' + escapeHtml(decision.description) + ' Choose one adaptation for this battle.</p>' +
      '<ul class="tyranid-decision-reminder__options">' + options + '</ul>' +
      '<p class="tyranid-decision-reminder__note">The choice is recorded in battle history. Attack effects are a reference reminder; combat results are still resolved at the table.</p>' +
      '</section></div>';
  }
  if (decision.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) {
    const carriers = (decision.carriers ?? []).map(escapeHtml).join(", ");
    return '<div class="tyranid-decision-reminder__backdrop"><section class="tyranid-decision-reminder" role="dialog" ' +
      'aria-modal="true" aria-labelledby="tyranid-shadow-in-the-warp-title"><div class="tyranid-decision-reminder__kicker">COMMAND PHASE · ONCE PER BATTLE</div>' +
      '<h2 id="tyranid-shadow-in-the-warp-title">Shadow in the Warp</h2>' +
      '<p>' + escapeHtml(decision.description) + '</p>' +
      '<p><strong>Available from:</strong> ' + carriers + '</p>' +
      '<p>Using it records the decision only. Resolve the required enemy Battle-shock tests at the table and check the applicable Synapse/Psychic modifiers.</p>' +
      '<div class="tyranid-decision-reminder__actions"><button type="button" data-use-faction-decision="' +
      escapeHtml(decision.id) + '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Use now</button>' +
      '<button type="button" data-dismiss-faction-decision="' + escapeHtml(decision.id) +
      '" data-faction-player-id="' + escapeHtml(decision.playerId) + '">Not now</button></div>' +
      '</section></div>';
  }
  return "";
}

export function renderDecisionReminderHost(state, {
  perspectivePlayerId = null,
  battleShockReminder = null,
  dismissedTyranidDecisionContextKey = null
} = {}) {
  const punishment = renderPunishmentCondemnationReminder(state);
  if (punishment) return punishment;
  const playerId = perspectivePlayerId ?? state?.players?.[0]?.id ?? null;
  const decisions = getTyranidDecisionReminders(state, playerId);
  const hyperAdaptation = decisions.find((decision) =>
    decision.id === TYRANID_DECISION_IDS.HYPER_ADAPTATIONS);
  const shadowInTheWarp = decisions.find((decision) =>
    decision.id === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP &&
    tyranidDecisionContextKey(decision, state) !== dismissedTyranidDecisionContextKey);
  const factionDecision = hyperAdaptation ?? shadowInTheWarp;
  if (factionDecision) return renderTyranidDecisionReminder(factionDecision);
  return renderBattleShockReminder(state, battleShockReminder);
}
