import { getConsecrateReviewState } from '../rules/consecrate-state.js';
import { getScoringCheckpointReminder } from '../application/scoring-checkpoint-reminders.js';
import { bindConsecrateReview, renderConsecrateReviewSection } from './consecrate-review.js';

/**
 * The live end-of-turn checkpoint must have a usable screen. In particular,
 * Consecrate review is optional: tabletop actions and VP remain player-confirmed.
 * An unfinished mission review must never trap a saved game in end_turn.
 */
export function renderEndTurnContent(state, { perspectivePlayerId = null } = {}) {
  const consecrate = getConsecrateReviewState(state);
  const scoringDue = Boolean(getScoringCheckpointReminder(state, {
    previousPhase: 'fight',
    perspectivePlayerId
  }));
  const consecrateContent = consecrate.required
    ? renderConsecrateReviewSection(state)
    : consecrate.active && consecrate.reviewedThisTurn
      ? '<p role="status">Consecrate review recorded for this turn.</p>'
      : '';
  return '<style>' +
    '.battle-end-turn{display:grid;gap:14px;padding:clamp(16px,3vw,30px);max-width:940px;margin:0 auto;}' +
    '.battle-end-turn h2,.battle-end-turn h3{margin:0;}' +
    '.battle-end-turn p{margin:0;line-height:1.5;}' +
    '.battle-end-turn [data-open-scoring-checkpoint],.battle-end-turn [data-consecrate-review-form] button{min-height:48px;padding:12px 16px;font:inherit;font-weight:700;border-radius:8px;border:1px solid #8a9fc0;background:#293b50;color:#fff;cursor:pointer;touch-action:manipulation;}' +
    '.battle-end-turn .battle-consecrate-review{display:grid;gap:12px;border:1px solid #60778e;border-radius:12px;padding:16px;background:#142231;}' +
    '.battle-end-turn .battle-consecrate-review__row{display:grid;gap:6px;padding:10px 0;}' +
    '.battle-end-turn .battle-consecrate-review__row span{display:grid;gap:4px;}' +
    '.battle-end-turn .battle-consecrate-review__row select{max-width:100%;min-height:48px;font:inherit;padding:8px;border-radius:8px;}' +
    '.battle-end-turn .battle-consecrate-review__confirm{display:flex;gap:10px;align-items:center;}' +
    '.battle-end-turn .battle-consecrate-review__confirm input{width:22px;height:22px;flex-shrink:0;}' +
    '.battle-end-turn [data-consecrate-review-form]{display:grid;gap:12px;}' +
    '</style>' +
    '<section class="battle-end-turn" data-end-turn-screen aria-label="End of turn review">' +
    '<h2>End of turn</h2>' +
    '<p>Confirm Primary and Secondary scores with your opponent. Scoring remains manual, and you can correct VP or CP from the scoreboard.</p>' +
    (scoringDue ? '<div><button type="button" data-open-scoring-checkpoint>Review mission scoring</button></div>' : '') +
    consecrateContent +
    '<p>When you are ready, use <strong>Finish turn</strong> above to continue to the opponent. You may finish without recording a Consecrate selection; unrecorded objectives are not marked as consecrated.</p>' +
    '</section>';
}

export function createEndTurnScreen(container, { session, perspectivePlayerId = null } = {}) {
  if (!container || typeof session?.getState !== 'function' || typeof session?.subscribe !== 'function') {
    throw new TypeError('End-of-turn screen needs a container and game session.');
  }
  function render() {
    if (session.getState()?.phase !== 'end_turn') return;
    container.innerHTML = renderEndTurnContent(session.getState(), { perspectivePlayerId });
    bindConsecrateReview(container, session);
  }
  render();
  const unsubscribe = session.subscribe(render);
  return { render, destroy() { unsubscribe(); } };
}
