import { getEndgameContext } from './endgame-context.js';
import { getEndgameEvidence, getEvidenceLessons } from './endgame-evidence.js';
// Read-only review of recorded evidence. Never reconstruct past choices from the final map.
const number = value => typeof value === 'number' && Number.isFinite(value);
const frame = p => ({ round: Number.isInteger(p.round) ? p.round : null, turn: Number.isInteger(p.turn) ? p.turn : null });

export function getEndgameReview(state, { playerId = state.players?.[0]?.id, unitLabels = new Map() } = {}) {
  const history = Array.isArray(state.history) ? state.history : [];
  const roster = new Map((state.units ?? []).filter(Boolean).map(u => [u.id, {...u,name:unitLabels.get(u.id) ?? u.name}]));
  const reversedIds = new Set(), reversedIndices = new Set();
  for (const event of history) {
    if (['victory_points.award_undone', 'victory_points.adjustment_undone'].includes(event?.type)) {
      const p = event.payload ?? {};
      if (p.originalAwardEventId != null) reversedIds.add(p.originalAwardEventId);
      if (Number.isInteger(p.originalAwardEventIndex)) reversedIndices.add(p.originalAwardEventIndex);
    }
  }
  const scores = history.flatMap((e, index) => {
    if (!['victory_points.awarded', 'victory_points.adjusted'].includes(e?.type) || reversedIndices.has(index) || (e.id && reversedIds.has(e.id))) return [];
    const p = e.payload ?? {};
    if (!p.playerId || !number(p.amount)) return [];
    return [{ ...frame(p), playerId:p.playerId, amount:p.amount, reason:p.reason ?? 'Recorded score',
      category:e.type === 'victory_points.adjusted' ? 'adjustment' : ['primary','secondary'].includes(p.category) ? p.category : 'other' }];
  });
  const players = (state.players ?? []).map(p => {
    const entries = scores.filter(s => s.playerId === p.id);
    const categories = Object.fromEntries(['primary','secondary','other','adjustment'].map(c => [c, entries.filter(s => s.category === c).reduce((sum,s) => sum+s.amount,0)]));
    const ledgerTotal = entries.reduce((sum,s) => sum+s.amount,0);
    const total = number(state.victoryPoints?.[p.id]) ? state.victoryPoints[p.id] : null;
    return { id:p.id, name:p.name ?? p.id, total, ledgerTotal, categories, entries:entries.length,
      unallocated: total == null ? null : total-ledgerTotal };
  });
  const roundKeys = [...new Set(scores.map(s => s.round))].sort((a,b) => (a ?? Infinity)-(b ?? Infinity));
  const rounds = roundKeys.map(round => ({round, players:players.map(p => {
    const entries = scores.filter(s => s.round === round && s.playerId === p.id);
    return {playerId:p.id, total:entries.reduce((sum,s) => sum+s.amount,0), recorded:entries.length > 0};
  })}));
  const units = new Map();
  const unitSummary = id => {
    if (!id) return null;
    if (!units.has(id)) {
      const u = roster.get(id);
      units.set(id, {id, name:u?.name ?? id, ownerId:u?.ownerId ?? null, status:u?.status ?? 'unknown',
        attacks:0, recordedDamage:0, damageEntries:0, woundsRemoved:0, woundEntries:0,
        damageReceived:0, receivedEntries:0, expectedDamage:0, comparableDamage:0, comparisons:0,
        kills:0, charges:0, failedCharges:0, declinedCharges:0, actions:0, completedActions:0});
    }
    return units.get(id);
  };
  for (const id of roster.keys()) unitSummary(id);
  const moments = [];
  const reviewed = new Map(history.filter(e => e?.type === 'mission_action.reviewed').map(e => [e.payload?.actionKey,e.payload]));
  let attacks = 0, comparisons = 0, unknownOwners = 0;
  for (const [index,event] of history.entries()) {
    const p = event?.payload ?? {};
    if (event?.type === 'combat.attack_resolved') {
      attacks++;
      // Precision and attached leaders may use a different source or damage recipient.
      const attacker = unitSummary(p.sourceAttackerId ?? p.attackerId);
      const delta = p.stateDelta?.target;
      const target = unitSummary(delta?.unitId ?? p.allocationTargetId ?? p.targetId);
      if (!attacker?.ownerId || !target?.ownerId) unknownOwners++;
      if (attacker) {
        attacker.attacks++;
        if (number(p.actualDamage) && p.actualDamage >= 0) {attacker.recordedDamage += p.actualDamage; attacker.damageEntries++;}
        if (number(p.actualDamage) && p.actualDamage >= 0 && number(p.expectedDamage) && p.expectedDamage >= 0) {
          attacker.comparableDamage += p.actualDamage; attacker.expectedDamage += p.expectedDamage; attacker.comparisons++; comparisons++;
        }
        if (number(delta?.woundsBefore) && number(delta?.woundsAfter)) {
          attacker.woundsRemoved += Math.max(0,delta.woundsBefore-delta.woundsAfter); attacker.woundEntries++;
        }
      }
      if (target && number(p.actualDamage) && p.actualDamage >= 0) {target.damageReceived += p.actualDamage; target.receivedEntries++;}
      if (delta?.statusAfter === 'destroyed' && delta.statusBefore && delta.statusBefore !== 'destroyed') {
        if (attacker && target && attacker.ownerId && target.ownerId && attacker.ownerId !== target.ownerId) attacker.kills++;
        moments.push({...frame(p),index,text:`${target?.name ?? 'Unknown unit'} was destroyed by ${attacker?.name ?? 'an unrecorded attacker'} (${p.phase ?? 'combat'}).`});
      }
    }
    if (event?.type === 'charge.outcome_recorded') {
      const u=unitSummary(p.unitId); if (!u) continue;
      if (p.outcome === 'declined') u.declinedCharges++;
      if (['successful','failed'].includes(p.outcome)) {u.charges++; if(p.outcome === 'failed') u.failedCharges++;}
    }
    if (event?.type === 'shooting.unit_activated' && p.missionInstanceId) {
      const u=unitSummary(p.unitId); if (!u) continue;
      u.actions++;
      if (reviewed.get([p.round,p.turn,p.unitId].join(':'))?.outcome === 'completed') u.completedActions++;
    }
  }
  const scoreSwings = players.length === 2 ? rounds.filter(r => r.round > 0 && r.players.every(p => p.recorded)).map(r => ({
    round:r.round, margin:r.players[0].total-r.players[1].total
  })).sort((a,b)=>Math.abs(b.margin)-Math.abs(a.margin)) : [];
  const largestSwing = scoreSwings.find(s=>s.margin !== 0) ?? null;
  const own=players.find(p=>p.id===playerId), enemy=players.find(p=>p.id!==playerId);
  const ownUnits=[...units.values()].filter(u=>u.ownerId===playerId);
  const evidence=getEndgameEvidence(state,scores,unitLabels);
  const context=getEndgameContext(state,unitLabels);
  for(const round of evidence.rounds) for(const player of round.players) {
    player.lost=[...new Map(context.losses.filter(l=>l.destroyed && l.round===round.round && l.ownerId===player.playerId).map(l=>[l.unitId,l.unitName])).values()];
  }
  const lessons=getEvidenceLessons(evidence,playerId);
  if (own && enemy && own.unallocated === 0 && enemy.unallocated === 0 && own.entries && enemy.entries && enemy.categories.primary > own.categories.primary) {
    lessons.push({kind:'Possible improvement',evidence:`Recorded Primary scoring: ${own.categories.primary} VP for ${own.name}, ${enemy.categories.primary} VP for ${enemy.name}.`,
      advice:'Review how you protected objective holders before scoring checkpoints. This gap alone does not prove that a different move would have scored.'});
  }
  const failed=ownUnits.reduce((n,u)=>n+u.failedCharges,0), charges=ownUnits.reduce((n,u)=>n+u.charges,0);
  if(failed && !lessons.some(l=>l.kind==='Charge planning')) lessons.push({kind:'Possible improvement',evidence:`${failed} of ${charges} recorded charge attempts failed.`,advice:'Plan a fallback for important charges. A failed charge is not itself a mistake; modifiers, rerolls and alternatives are not fully recorded.'});
  const expected=ownUnits.reduce((n,u)=>n+u.expectedDamage,0), actual=ownUnits.reduce((n,u)=>n+u.comparableDamage,0), pairs=ownUnits.reduce((n,u)=>n+u.comparisons,0);
  if(pairs && expected > actual + 2) lessons.push({kind:'Outcome context',evidence:`Across ${pairs} attacks with saved estimates, recorded damage was ${actual.toFixed(1)} against ${expected.toFixed(1)} expected.`,advice:'Allow a margin when planning to remove a crucial target. Below-average damage does not establish bad target selection or prove bad dice.'});
  const actionUnit=ownUnits.filter(u=>u.completedActions).sort((a,b)=>b.completedActions-a.completedActions)[0];
  if(actionUnit) lessons.push({kind:'Contribution to recognise',evidence:`${actionUnit.name} completed ${actionUnit.completedActions} confirmed mission action(s).`,advice:'Include mission work when assessing this unit, not just damage. Action completion and VP awards are tracked separately.'});
  const evidenceGaps = [
    'Only entered results are included. An absent event does not mean a unit did nothing or a scoring opportunity was missed.',
    'Past legal alternatives, line of sight, exact range, modifiers and Advisor recommendations are not captured well enough to grade individual decisions.',
    'Damage estimates are baselines, not promises. This review does not attribute a result to dice luck or award missed VP.'
  ];
  if(attacks !== comparisons) evidenceGaps.push(`${attacks-comparisons} of ${attacks} attack entries lack a usable expected-versus-actual comparison.`);
  if(unknownOwners) evidenceGaps.push(`${unknownOwners} attack entries have incomplete unit ownership; no side-specific conclusion is drawn from those entries.`);
  if(players.some(p=>p.total == null || p.unallocated !== 0)) evidenceGaps.push('Some score totals are missing or do not reconcile with the scoring history. Unallocated VP are shown separately, without assigning them to a round or mission.');
  return {largestSwing,complete:state.battle?.status === 'complete',playerId,players,rounds,scores,units:[...units.values()],moments,
    lessons:lessons.slice(0,6),evidence,context,evidenceGaps,coverage:{attacks,comparisons,scoreEntries:scores.length}};
}
