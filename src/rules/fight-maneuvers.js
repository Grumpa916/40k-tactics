import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getBattleUnitDatasheet, getCombatFormationMembers } from './battle-unit-reference.js';
import { getActiveCustodesDetachmentStratagemUse } from './stratagem-use-state.js';

// Stored allowances only. The repo has no core Pile In or Consolidate distance,
// so the tabletop confirmation does not invent one. The old 3″/5″ Overrun
// sentence was the 10th-edition movement the fight recheck called out.
const ALLOWANCES = [
  { test: /unstoppable destroyer/i, pileIn: 'Pile in up to 4″.', consolidate: 'Consolidate up to 4″.' },
  { test: /adrenalised onslaught/i, pileIn: 'Pile in 3″ further.', consolidate: 'Consolidate 3″ further.' },
  { test: /lightning wrath/i, pileIn: 'Pile in up to D3+3″.' },
  { test: /dacatarai/i, pileIn: 'Subtract 2″ from the pile-in move.', consolidate: 'Subtract 2″ from the consolidation move.' },
  { test: /tactical focus/i, consolidate: 'Consolidate up to D3+3″.' },
  { test: /overrun/i, consolidate: 'Consolidate 3″ farther while ending in Engagement Range, or make a Normal move up to 6″ if the unit is in Synapse range and not engaged.' },
  { test: /emperor'?s domain/i, consolidate: 'The objective consolidation mode is allowed regardless of Before Moving restrictions.' }
];

function textsFor(state, unit) {
  const members = getCombatFormationMembers(state, unit);
  const blobs = [];
  for (const member of members.length ? members : [unit]) {
    const sheet = getBattleUnitDatasheet(state, member);
    for (const ability of sheet?.abilities ?? []) blobs.push(ability.name + ' ' + (ability.description ?? ''));
    const roster = state?.armyRosters?.[member.ownerId]?.units?.find(item => item.id === member.metadata?.rosterUnitId) ?? member;
    for (const upgrade of roster?.unitUpgrades ?? []) blobs.push(typeof upgrade === 'string' ? upgrade : upgrade?.name ?? '');
    const wrath = getActiveCustodesDetachmentStratagemUse(state, { unitId: member.id, stratagemId: 'lightning-wrath' });
    if (wrath) blobs.push('Lightning Wrath');
  }
  for (const event of state?.history ?? []) {
    if (event.payload?.round !== state.battle?.round || event.payload?.turn !== state.turn) continue;
    blobs.push(event.payload?.ruleName ?? '', event.payload?.stratagemId ?? '', event.payload?.katahName ?? '');
  }
  return blobs.filter(Boolean);
}

export function fightManeuverNotes(state, unit) {
  const pileIn = [];
  const consolidate = [];
  const seen = new Set();
  for (const text of textsFor(state, unit)) {
    for (const allowance of ALLOWANCES) {
      if (!allowance.test.test(text)) continue;
      for (const [key, list] of [['pileIn', pileIn], ['consolidate', consolidate]]) {
        const note = allowance[key];
        if (note && !seen.has(note)) { seen.add(note); list.push(note); }
      }
    }
  }
  return { pileIn, consolidate };
}

function recorded(state, type, unitId) {
  return (state.history ?? []).some(event => event.type === type && event.payload?.unitId === unitId &&
    event.payload?.round === state.battle?.round && event.payload?.turn === state.turn);
}

export function pileInOffer(state, unitId) {
  if (state?.phase !== 'fight' || !unitId) return null;
  const unit = state.units?.find(item => item.id === unitId && item.status === 'deployed');
  if (!unit) return null;
  return { unitId, recorded: recorded(state, 'fight.pile_in_recorded', unitId), ...fightManeuverNotes(state, unit) };
}

export function consolidateOffer(state, unitId) {
  if (state?.phase !== 'fight' || !unitId) return null;
  const fought = (state.history ?? []).some(event => event.type === 'fight.unit_activated' &&
    event.payload?.unitId === unitId && (event.payload?.actionType ?? 'fight') === 'fight' &&
    event.payload?.turn === state.turn);
  if (!fought) return null;
  const unit = state.units?.find(item => item.id === unitId);
  if (!unit) return null;
  return { unitId, recorded: recorded(state, 'fight.consolidate_recorded', unitId), ...fightManeuverNotes(state, unit) };
}

function maneuverEvent(state, type, unitId) {
  const unit = state.units?.find(item => item.id === unitId && item.status === 'deployed');
  if (!unit || state.phase !== 'fight') throw new Error('Record this fight maneuver for a deployed unit during the Fight phase.');
  if (recorded(state, type, unitId)) throw new Error('This fight maneuver is already recorded for this unit this turn.');
  const notes = fightManeuverNotes(state, unit);
  return appendHistoryEntry(state, createEvent(type, {
    unitId, playerId: unit.ownerId, round: state.battle.round, turn: state.turn, phase: state.phase,
    pileInNotes: notes.pileIn, consolidateNotes: notes.consolidate, recordedCpChange: 0
  }));
}

export function recordPileIn(state, { unitId } = {}) {
  return maneuverEvent(state, 'fight.pile_in_recorded', unitId);
}

export function recordConsolidate(state, { unitId } = {}) {
  const offer = consolidateOffer(state, unitId);
  if (!offer) throw new Error('Consolidate is recorded after the unit has been selected to fight.');
  return maneuverEvent(state, 'fight.consolidate_recorded', unitId);
}

// Heroic Intervention is named in stored datasheets, without a range or CP cost.
// Counteroffensive is not stored anywhere in this repo, so it is not offered.
export const COUNTEROFFENSIVE_RULE = null;

export function heroicInterventionOffer(state) {
  if (state?.phase !== 'charge' || state.battle?.status !== 'active') return null;
  const active = state.activePlayer ?? state.battle?.activePlayerId;
  const history = state.history ?? [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index];
    if (event.type !== 'charge.outcome_recorded') continue;
    if (event.payload?.turn !== state.turn || event.payload?.round !== state.battle.round) break;
    if (event.payload?.outcome !== 'successful' || event.payload?.playerId !== active) return null;
    const triggerKey = 'heroic:' + index;
    const answered = history.some(item => item.type === 'fight.heroic_intervention_recorded' && item.payload?.triggerKey === triggerKey);
    if (answered) return null;
    const reactor = (state.players ?? []).find(player => player.id !== active)?.id ?? null;
    if (!reactor) return null;
    return { triggerKey, enemyUnitId: event.payload.unitId, playerId: reactor };
  }
  return null;
}

export function recordHeroicIntervention(state, { triggerKey, unitId, eligibleConfirmed } = {}) {
  const offer = heroicInterventionOffer(state);
  if (!offer || offer.triggerKey !== triggerKey) throw new Error('Heroic Intervention is not available for this charge.');
  if (eligibleConfirmed !== true) throw new Error('Confirm Heroic Intervention eligibility on the table before recording it.');
  const unit = state.units?.find(item => item.id === unitId && item.ownerId === offer.playerId && item.status === 'deployed');
  if (!unit) throw new Error('Choose one of your deployed units for Heroic Intervention.');
  return appendHistoryEntry(state, createEvent('fight.heroic_intervention_recorded', {
    unitId, playerId: offer.playerId, enemyUnitId: offer.enemyUnitId, triggerKey,
    round: state.battle.round, turn: state.turn, phase: state.phase, recordedCpChange: 0
  }));
}
