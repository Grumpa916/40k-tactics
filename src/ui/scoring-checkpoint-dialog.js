import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from '../rules/secondary-mission-lifecycle.js';
import { renderScoringCheckpointGroups, bindScoringActionReview } from './scoring-checkpoint-review.js';
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderScoringCheckpointDialog(state,scoringReminder) {
  const reminderPlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const tacticalDiscardCards = scoringReminder?.timing === "end-of-turn" &&
    getSecondaryMissionMode(state, reminderPlayerId) === SECONDARY_MISSION_MODES.TACTICAL && reminderPlayerId
    ? getSecondaryMissionHistory(state, reminderPlayerId).filter((item) =>
        item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
        item.definition?.missionMode === SECONDARY_MISSION_MODES.TACTICAL)
    : [];
  const tacticalDiscardForm = tacticalDiscardCards.length
    ? '<section class="battle-tactical-discard"><h3>Discard Tactical cards for +1 CP</h3>' +
      '<p>At the end of your own turn, discard one or more active Tactical cards to gain 1 CP total.</p>' +
      '<form data-tactical-discard-form>' +
      tacticalDiscardCards.map((item) =>
        '<label><input type="checkbox" name="discard-instance" value="' + escapeHtml(item.instanceId) + '">' +
        escapeHtml(item.definition?.name ?? item.definitionId) + '</label>'
      ).join("") +
      '<button type="submit">Discard selected cards and gain +1 CP</button></form></section>'
    : "";
  const reminderMarkup = scoringReminder ? '<link rel="stylesheet" href="' + new URL('./styles/scoring-checkpoints.css',import.meta.url).href + '"><div class="battle-scoring-reminder__backdrop">' +
    '<section class="battle-scoring-reminder" role="dialog" aria-modal="true" aria-labelledby="battle-scoring-reminder-title">' +
    '<h2 id="battle-scoring-reminder-title">Scoring checkpoint</h2>' +
    '<p>' + escapeHtml(scoringReminder.label) + '. Record any Primary or Secondary score shown below before continuing.</p>' +
    renderScoringCheckpointGroups(state, scoringReminder) +
    (scoringReminder.groups ? '' : '<ul>' + (scoringReminder.missions.map((mission) => '<li>' + escapeHtml(mission) + '</li>').join("") ||
      '<li>Review your mission cards and confirm any points earned.</li>') + '</ul>') +
    tacticalDiscardForm +
    '<div class="battle-scoring-reminder__actions">' + (scoringReminder.groups ? '' : '<button type="button" data-review-scoring>Review scoring</button>') +
    '<button type="button" data-dismiss-scoring-reminder>Done / continue</button></div></section></div>' : "";
  return reminderMarkup;
}
export function refreshScoringCheckpointDialog(container,state,reminder,session) {
  const host=container.querySelector?.('[data-scoring-reminder-host]');
  if (!host) return;
  host.innerHTML=renderScoringCheckpointDialog(state,reminder);
  bindScoringActionReview(host,session,message=>{
    const node=host.ownerDocument?.createElement?.('p');
    if (node) {node.setAttribute('role','alert');node.textContent=message;host.append(node);}
  });
}
