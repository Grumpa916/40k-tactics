import { COMMAND_TYPES } from '../commands/game-commands.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const reasons = {
  vp: [['adjustment','Score correction'],['missed','Missed score'],['entry','Entry correction']],
  cp: [['adjustment','Balance correction'],['stratagem','Stratagem spend'],['spend','Other CP spend'],['gain','Manual CP gain']]
};
export function renderScoreReason(kind) {
  return `<label class="score-transaction-reason">${kind.toUpperCase()} reason<select data-score-reason="${kind}">${reasons[kind].map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>`;
}
export function scoreboardAdjustmentCommand(state, { playerId, kind, amount, reason = 'adjustment' }) {
  if (!['cp','vp'].includes(kind) || !Number.isInteger(amount) || amount === 0) throw new Error('Choose a non-zero whole-point change.');
  if (!reasons[kind].some(([id])=>id===reason)) throw new Error('Choose a valid reason.');
  const context = { playerId, amount, turn: state.turn ?? 0, round: state.battle?.round ?? 0 };
  if (kind === 'vp') return { type: COMMAND_TYPES.ADJUST_VICTORY_POINTS, payload: {
    ...context, reason: reasons.vp.find(([id])=>id===reason)[1]
  } };
  const spend = ['stratagem','spend'].includes(reason);
  if (spend && amount > 0) throw new Error('Use −1 to record CP spending, or select Balance correction.');
  if (reason === 'gain' && amount < 0) throw new Error('Use +1 for a CP gain, or select Balance correction.');
  return { type: COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, payload: {
    ...context, reason: spend ? 'spend' : reason === 'gain' ? 'gain' : 'adjustment',
    note: reasons.cp.find(([id])=>id===reason)[1] + ' · Scoreboard'
  } };
}
export function renderScoreTransactions(state, playerId, kind = 'both') {
  const allowed = new Set(['command_points.changed','victory_points.awarded','victory_points.adjusted','victory_points.award_undone','victory_points.adjustment_undone']);
  const entries = (state.history ?? []).filter(event => allowed.has(event.type) && event.payload?.playerId === playerId &&
    (kind === 'both' || (kind === 'cp') === (event.type === 'command_points.changed'))).slice(-8).reverse();
  const rows = entries.map(event => {
    const p=event.payload, cp=event.type==='command_points.changed', undone=event.type.endsWith('_undone');
    const before=cp?p.balanceBefore:p.scoreBefore, after=cp?p.balanceAfter:p.scoreAfter;
    const amount=Number.isFinite(before)&&Number.isFinite(after)?after-before:undone?-p.amount:p.amount;
    const label=(undone?'Reversal · ':'')+(p.note || p.reason || 'Recorded change');
    return `<li><strong>${esc(Number.isFinite(amount)?(amount>0?'+':'')+amount:'—')} ${cp?'CP':'VP'}</strong> · ${esc(label)}<small>Round ${esc(p.round ?? '—')} · Turn ${esc(p.turn ?? '—')}${p.phase?' · '+esc(p.phase):''}${Number.isFinite(after)?' · Balance '+esc(after):''}</small></li>`;
  }).join('');
  return `<details class="score-transactions" open><summary>Recent changes · ${entries.length}</summary>${rows?'<ol>'+rows+'</ol>':'<p>No recorded changes yet.</p>'}</details>`;
}
