import { getBattlePrimaryMissions, getEventCompanionMapLayout } from './event-companion-map-catalog.js';
import { evaluatePreGameReadiness } from './pre-game-readiness.js';
import { getSecondaryMissionMode, getSecondaryMissionHistory } from './secondary-mission-lifecycle.js';

export const PREPARATION_STEPS = [
  ['mission', 'Missions & layout', 'Confirm submitted Force Dispositions and both Primary Missions. Use the organiser’s layout or the agreed random result.'],
  ['terrain', 'Create battlefield', 'Place terrain areas, then features using the official diagram. Confirm the physical table is ready.'],
  ['roles', 'Attacker & defender', 'Agree which table edges correspond to the layout. Roll off; the winner chooses attacker and defender.'],
  ['secondaries', 'Reveal secondary choices', 'First make choices privately on paper or physical cards. Reveal together, then record both players below. Tactical players shuffle their decks; draw in Command.'],
  ['formations', 'Declare battle formations', 'Privately note passengers first, then strategic reserves. Reveal together and record below. Confirm transport eligibility/capacity and reserve exceptions against the tabletop rules.'],
  ['deployment', 'Deploy armies', 'Alternate placements starting with Defender. After placing a Titanic unit, skip your next placement. Infiltrators apply here; confirm distances on the table.'],
  ['redeployment', 'Redeploy units', 'Alternate applicable redeployment rules starting with Attacker. Confirm resolved, declined or none. Reserve transfers here are recorded separately.'],
  ['first-turn', 'Determine first turn', 'Roll off now. The winner takes the first turn. Record the result below.'],
  ['pre-battle', 'Resolve pre-battle rules', 'Alternate from the first player. Resolve Scouts and applicable faction/mission rules, or confirm none. Verify eligible reserve setup and Scout distances on the table.'],
  ['ready', 'Begin battle', 'All setup checkpoints are confirmed. Begin Round 1, Command phase.']
].map(([id, title, detail]) => Object.freeze({ id, title, detail }));
export function preparationStep(state) { return state.preparation?.step ?? (state.battle?.status === 'deployment' ? 'deployment' : 'mission'); }
export function rosterUnit(state, unit) {
  return state.armyRosters?.[unit.ownerId]?.units?.find(x => x.id === unit.metadata?.rosterUnitId) ?? unit;
}
export function attachmentParent(state, unit) {
  const id = rosterUnit(state, unit).attachedToBodyguardId;
  return id ? state.units.find(x => x.ownerId === unit.ownerId && (x.metadata?.rosterUnitId === id || x.id === id))?.id : null;
}
export function deploymentUnits(state) { return (state.units ?? []).filter(u => u.status !== 'destroyed' && !attachmentParent(state, u)); }
export function formationFor(state, unit) {
  return state.preparation?.formations?.[attachmentParent(state, unit) ?? unit.id] ?? { kind: 'field' };
}
export function reserveSummary(state, playerId) {
  const limit = ({ incursion:1000, strike_force:2000 })[state.battleSetup?.battleSize] ?? state.armyRosters?.[playerId]?.pointsLimit ?? null;
  let points = 0, unknown = 0, count = 0;
  for (const unit of (state.units ?? []).filter(u => u.ownerId === playerId && u.status !== 'destroyed')) {
    const f = formationFor(state, unit);
    const carrier = state.preparation?.formations?.[f.transportId];
    if (!(f.kind === 'reserve' || (f.kind === 'embarked' && carrier?.kind === 'reserve'))) continue;
    count++;
    const cost = rosterUnit(state, unit).points ?? unit.metadata?.points;
    if (Number.isFinite(cost) && cost >= 0) points += cost; else unknown++;
  }
  return { points, unknown, count, limit: limit == null ? null : limit / 2 };
}
export function preparationIssues(state, step = preparationStep(state)) {
  const issues = [];
  const readiness = evaluatePreGameReadiness(state);
  if (step === 'mission') {
    issues.push(...readiness.missing.filter(x => x.id !== 'battle-roles').map(x => x.label));
    const setup = state.battlefieldMap?.missionSetup;
    const missions = setup?.myDisposition && setup?.opponentDisposition ? getBattlePrimaryMissions(setup.myDisposition, setup.opponentDisposition) : null;
    if (!missions || !getEventCompanionMapLayout(missions.myMission, missions.opponentMission, setup.layout)?.verified) issues.push('Confirm both Force Dispositions and a supported event layout');
  }
  if (step === 'roles') issues.push(...readiness.missing.filter(x => x.id === 'battle-roles').map(x => x.label));
  if (step === 'secondaries') for (const p of state.players ?? []) {
    const mode = getSecondaryMissionMode(state, p.id);
    const cards = getSecondaryMissionHistory(state, p.id).filter(x => x.status === 'active');
    if (!mode) issues.push('Choose secondary mode for ' + p.name);
    if (mode === 'fixed' && cards.length !== 2) issues.push('Record exactly two Fixed cards for ' + p.name);
  }
  if (step === 'formations') {
    for (const p of state.players ?? []) {
      const s = reserveSummary(state, p.id);
      if ((s.count && (s.unknown || s.limit == null || s.points > s.limit)) && !state.preparation?.reserveReview?.[p.id])
        issues.push('Record tabletop reserve review / exception for ' + p.name);
    }
    for (const u of deploymentUnits(state)) {
      const f = formationFor(state, u);
      if (f.kind === 'embarked') {
        const t = state.units.find(x => x.id === f.transportId && x.ownerId === u.ownerId && x.status !== 'destroyed');
        if (!t || t.id === u.id || attachmentParent(state, t) || formationFor(state, t).kind === 'embarked') issues.push('Invalid transport for ' + u.name);
      }
      const keywords = rosterUnit(state, u).datasheet?.keywords ?? u.keywords ?? [];
      if (f.kind === 'reserve' && keywords.some(k => String(k).toUpperCase() === 'FORTIFICATION')) issues.push('Fortification cannot enter strategic reserves: ' + u.name);
    }
  }
  if (['deployment','redeployment','pre-battle'].includes(step)) for (const u of deploymentUnits(state)) {
    if (formationFor(state, u).kind === 'field' && !state.battlefieldMap?.actualDeployment?.[u.id]) issues.push('Place ' + u.name);
  }
  if (step === 'first-turn' && !state.players?.some(p => p.id === state.preparation?.firstPlayerId)) issues.push('Record the first-turn roll winner');
  return issues;
}
