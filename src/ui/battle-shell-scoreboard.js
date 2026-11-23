import { isManualScoringEnabled } from '../config/feature-flags.js';
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from '../rules/secondary-mission-lifecycle.js';
import { getCorrectableSecondaryAwards } from '../engine/secondary-score-correction.js';
import { renderScoreReason, renderScoreTransactions } from './scoreboard-transactions.js';
import { getCommandPointBalance } from "../engine/command-points-ledger.js";
import { getVictoryPointScore } from "../engine/victory-points-ledger.js";
import { formatElapsedTime, getTurnClockElapsedMs } from "../state/turn-clock.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderSecondaryCorrection(state,playerId) {
  const awards=getCorrectableSecondaryAwards(state,playerId);
  const cards=getSecondaryMissionHistory(state,playerId);
  const choices=cards.flatMap(card=>{
    const existing=awards.filter(award=>award.instanceId===card.instanceId);
    const options=existing.map(award=>'<option value="'+escapeHtml(card.instanceId)+'|'+award.index+'">'+escapeHtml(card.definition?.name??card.definitionId)+' · round '+award.round+' · '+award.amount+' VP</option>');
    if(!existing.length && card.status!==SECONDARY_MISSION_STATUS.SCORED)
      options.push('<option value="'+escapeHtml(card.instanceId)+'|new">'+escapeHtml(card.definition?.name??card.definitionId)+' · '+escapeHtml(card.status)+' · unscored</option>');
    return options;
  }).join('');
  if(!choices)return '';
  const rounds=Array.from({length:Math.max(1,state.battle?.round??1)},(_,index)=>
    '<option value="'+(index+1)+'" '+(index+1===(state.battle?.round??1)?'selected':'')+'>Round '+(index+1)+'</option>').join('');
  return '<details class="score-secondary-correction"><summary>Correct a secondary card</summary><p>Choose a recorded card, enter its correct VP and scoring round. A discarded card can be scored if it was actually completed.</p>'+
    '<label>Card<select data-score-secondary-card>'+choices+'</select></label>'+
    '<label>Correct VP<input data-score-secondary-amount type="number" min="0" max="15" step="1" value="5"></label>'+
    '<label>Scored in<select data-score-secondary-round>'+rounds+'</select></label>'+
    '<button type="button" data-correct-secondary-score>Save secondary correction</button></details>';
}

export function phaseLabel(phase) {
  if (phase === "setup") return "Battle Setup & Saves";
  if (phase === "deployment") return "Deployment";
  return ({
    command: "Command",
    movement: "Movement",
    shooting: "Shooting",
    charge: "Charge",
    fight: "Fight",
    review: "Endgame review"
  })[phase] ?? phase;
}

export function renderScoreAdjustOverlay(
  state,
  players,
  scoreAdjustPlayerId,
  scoreAdjustCollapsed = false,
  scoreAdjustMessage = "",
  scoreAdjustKind = "both"
) {
  const scorePlayer = players.find((player) => player.id === scoreAdjustPlayerId);
  if (!scorePlayer) return "";
  const showVp = isManualScoringEnabled() && (scoreAdjustKind === "both" || scoreAdjustKind === "vp");
  const showSecondary = scoreAdjustKind === "secondary" || showVp;
  const showCp = scoreAdjustKind === "both" || scoreAdjustKind === "cp";
  const current = (showSecondary ? '<strong>' + getVictoryPointScore(state, scorePlayer.id) + ' VP</strong>' : '') +
    (showCp ? '<strong>' + getCommandPointBalance(state, scorePlayer.id) + ' CP</strong>' : '');
  const controls = (showVp ? '<span>Victory Points</span><button type="button" data-score-adjust-kind="vp" data-score-adjust-amount="-1">−1</button><button type="button" data-score-adjust-kind="vp" data-score-adjust-amount="1">+1</button>' : '') +
    (showCp ? '<span>Command Points</span><button type="button" data-score-adjust-kind="cp" data-score-adjust-amount="-1">−1</button><button type="button" data-score-adjust-kind="cp" data-score-adjust-amount="1">+1</button>' : '');
  return '<div class="battle-shell__score-adjust-backdrop" data-score-adjust-backdrop><section class="battle-shell__score-adjust' +
    (scoreAdjustCollapsed ? ' is-collapsed' : '') + '" data-score-adjust-view="' + escapeHtml(scoreAdjustKind) +
    '" role="dialog" aria-modal="true"><header><h2>' + escapeHtml(scorePlayer.name ?? scorePlayer.id) +
    '</h2><div><button type="button" data-toggle-score-adjust-collapse aria-label="' +
    (scoreAdjustCollapsed ? 'Expand score adjustment' : 'Minimize score adjustment') + '">' +
    (scoreAdjustCollapsed ? '□' : '−') +
    '</button><button type="button" data-close-score-adjust aria-label="Close">×</button></div></header><div class="battle-shell__score-adjust-current">' +
    current + '</div>' + (showVp ? renderScoreReason('vp') : '') + (showCp ? renderScoreReason('cp') : '') + '<div class="battle-shell__score-adjust-grid">' + controls +
    '</div><p class="battle-shell__score-adjust-message" role="status">' + escapeHtml(scoreAdjustMessage) + '</p>' + renderScoreTransactions(state, scorePlayer.id, scoreAdjustKind) + (showSecondary ? renderSecondaryCorrection(state,scorePlayer.id) : '') + '</section></div>';
}

export function renderStatusSummaryContent(state, viewedPhase) {
  const round = state.battle?.round ?? 0;
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const players = Array.isArray(state.players) ? state.players : [];
  const playerSummary = players.map((player) => {
    const vp = getVictoryPointScore(state, player.id);
    const cp = getCommandPointBalance(state, player.id);
    const elapsed = formatElapsedTime(getTurnClockElapsedMs(state, player.id));
    const active = player.id === activePlayerId ? " is-active" : "";
    const vpControl = isManualScoringEnabled()
      ? '<button type="button" class="battle-shell__summary-value" data-open-score-adjust="' + escapeHtml(player.id) +
        '" data-open-score-adjust-kind="vp" aria-label="Adjust Victory Points for ' + escapeHtml(player.name ?? player.id) + '">' + vp + ' VP</button>'
      : '<span class="battle-shell__summary-value">' + vp + ' VP</span><button type="button" class="battle-shell__summary-value" data-open-score-adjust="' + escapeHtml(player.id) + '" data-open-score-adjust-kind="secondary">Correct secondary</button>';
    return '<div class="battle-shell__player-summary' + active + '">' +
      '<strong>' + escapeHtml(player.name ?? player.id) + '</strong>' +
      vpControl +
      '<button type="button" class="battle-shell__summary-value" data-open-score-adjust="' + escapeHtml(player.id) +
      '" data-open-score-adjust-kind="cp" aria-label="Adjust Command Points for ' + escapeHtml(player.name ?? player.id) + '">' + cp + ' CP</button>' +
      '<button type="button" class="battle-shell__summary-time" data-toggle-turn-clock aria-label="Open turn clock"><time data-clock-player-elapsed="' +
      escapeHtml(player.id) + '">' + elapsed + '</time></button></div>';
  }).join("");
  return '<div class="battle-shell__round-summary"><strong>Round ' + (round || "—") + '</strong>' +
    '<span>' + escapeHtml(phaseLabel(state.phase ?? viewedPhase)) + '</span></div>' +
    '<div class="battle-shell__player-summaries">' + playerSummary + '</div>';
}

export function renderScoreAdjustStyles() {
  return '<style>.battle-shell__player-summary{appearance:none;color:inherit;text-align:left;cursor:pointer}' +
    '.battle-shell__score-adjust-backdrop{position:fixed;inset:0;z-index:10050;background:#0009;display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.battle-shell__score-adjust{max-height:90dvh;overflow:auto;width:min(460px,92vw);background:#171b20;border:1px solid #5b6876;border-radius:14px;padding:18px;box-shadow:0 18px 50px #000b}' +
    '.battle-shell__score-adjust header{display:flex;justify-content:space-between;align-items:center;gap:12px}' +
    '.battle-shell__score-adjust header>div{display:flex;gap:8px}.battle-shell__score-adjust header h2{margin:0}' +
    '.battle-shell__score-adjust header button{font-size:24px;min-width:46px}.battle-shell__score-adjust-current{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}' +
    '.battle-shell__score-adjust-current strong{font-size:24px;padding:12px;border:1px solid #44505c;border-radius:10px;text-align:center}' +
    '.battle-shell__score-adjust-grid{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center}' +
    '.battle-shell__score-adjust-grid button{min-width:76px;min-height:52px;font-size:20px;font-weight:800}' +
    '.battle-shell__score-adjust-message{min-height:1.3em;margin:10px 0 0}.battle-shell__score-adjust.is-collapsed{width:min(360px,86vw);padding:10px 12px}' +
    '.battle-shell__score-adjust.is-collapsed .battle-shell__score-adjust-current,.battle-shell__score-adjust.is-collapsed .battle-shell__score-adjust-grid,.battle-shell__score-adjust.is-collapsed .battle-shell__score-adjust-message{display:none}.score-transaction-reason{display:grid;gap:6px;margin:12px 0}.score-transaction-reason select{min-height:44px;font:inherit}.score-transactions{margin-top:14px}.score-transactions ol{padding-left:22px;max-height:190px;overflow:auto}.score-transactions li{margin:10px 0}.score-transactions small{display:block}.battle-shell__score-adjust.is-collapsed .score-transactions,.battle-shell__score-adjust.is-collapsed .score-transaction-reason{display:none}</style>';
}
