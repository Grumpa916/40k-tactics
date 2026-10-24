import { getEnemyUnitDestructionsForTurn } from './scoring-evidence-state.js';
import { getMissionEvidenceCondition } from './mission-evidence-conditions.js';

// Only explicit recorded facts qualify. Approximate positions cannot prove mission ranges.
export function missionConditionEvidence(state, playerId, item) {
  const condition = typeof item === 'object' ? item?.condition ?? getMissionEvidenceCondition(item?.summary) : getMissionEvidenceCondition(item);
  const objectives = state.objectives ?? [];
  const known = objectives.length > 0 && objectives.every(o => o.control != null);
  const controlled = objectives.filter(o => o.control?.controlState === 'controlled' && o.control.controllerId === playerId);
  const enemy = objectives.filter(o => o.control?.controlState === 'controlled' && o.control.controllerId !== playerId);
  const nonHome = controlled.filter(o => !/home/i.test(o.name ?? o.id));
  const central = controlled.filter(o => /cent(er|ral)/i.test(o.name ?? o.id));
  let count = null, detail = '';
  const type = condition?.type;
  if (known) {
    if (type === 'control-non-home') count = Number(nonHome.length >= condition.minimum);
    if (type === 'count-non-home') count = nonHome.length;
    if (type === 'count-objectives') count = controlled.length;
    if (type === 'control-more') count = Number(controlled.length > enemy.length);
    if (type === 'control-objectives') count = Number(controlled.length >= condition.minimum);
    if (type === 'control-central') count = Number(central.length >= condition.minimum);
  }
  if (type && !['destroy-enemy', 'count-destroyed'].includes(type)) {
    const current = objectives.filter(o => o.controlRecordedAt?.turn === state.turn && o.controlRecordedAt?.round === state.battle?.round).length;
    detail = controlled.length + ' objectives controlled; ' + nonHome.length + ' non-home; opponent ' + enemy.length +
      '. Control confirmations: ' + current + ' this turn, ' + (objectives.length - current) + ' carried forward or undated. Confirm at this checkpoint.';
  }
  if (type === 'destroy-enemy' || type === 'count-destroyed') {
    const destroyed = getEnemyUnitDestructionsForTurn(state, playerId, state.turn ?? 0);
    count = type === 'count-destroyed' ? destroyed.length : Number(destroyed.length >= condition.minimum);
    detail = destroyed.length + ' enemy destructions recorded this turn.';
  }
  return { status: count == null ? 'Needs tabletop confirmation' : count > 0 ? 'Completed in recorded state' : 'Not completed in recorded state', count, detail };
}

// Catalog timing labels contain separate round-qualified alternatives.
export function primaryWindowDue(when, checkpoint, round) {
  return String(when).split(/\s*[/;]\s*/).some(part => {
    const text = part.toLowerCase();
    const match = text.match(/r(\d+)(?:[–-](\d+)|(\+))?/);
    if (match && (!Number.isInteger(round) || round < +match[1] || (!match[3] && round > +(match[2] ?? match[1])))) return false;
    if (checkpoint === 'command-phase') return text.includes('command');
    if (checkpoint === 'end-of-opponent-turn') return text.includes('either player') || text.includes("opponent");
    if (checkpoint === 'end-of-turn') return text.includes('end of your turn') || text.includes('either player') || text.includes('end of turn');
    return checkpoint === 'end-of-battle' && text.includes('end of battle');
  });
}
