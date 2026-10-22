import { getEnemyUnitDestructionsForTurn } from './scoring-evidence-state.js';

// Evaluate only explicit recorded facts. Approximate marker positions cannot
// establish range, visibility, or wholly-within mission requirements.
export function missionConditionEvidence(state, playerId, summary) {
  const objectives = state.objectives ?? [];
  const known = objectives.length > 0 && objectives.every(o => o.control != null);
  const controlled = objectives.filter(o => o.control?.controlState === 'controlled' && o.control.controllerId === playerId);
  const enemy = objectives.filter(o => o.control?.controlState === 'controlled' && o.control.controllerId !== playerId);
  const nonHome = controlled.filter(o => !/home/i.test(o.name ?? o.id));
  const central = controlled.filter(o => /cent(er|ral)/i.test(o.name ?? o.id));
  const text = String(summary).toLowerCase();
  let count = null;
  let detail = '';
  if (/^control (at least one |a )non-home objective\.$/.test(text)) {
    count = known ? Number(nonHome.length > 0) : null;
    detail = `${nonHome.length} non-home objectives recorded under your control.`;
  } else if (/^per (controlled non-home objective|objective controlled)\.$/.test(text)) {
    count = known ? (text.includes('non-home') ? nonHome.length : controlled.length) : null;
    detail = `${count ?? 'Unknown'} qualifying objectives recorded.`;
  } else if (text === 'control more objectives than your opponent.') {
    count = known ? Number(controlled.length > enemy.length) : null;
    detail = `Recorded control: you ${controlled.length}, opponent ${enemy.length}.`;
  } else if (/^control (two|three|four) or more objectives\.$/.test(text)) {
    const threshold = text.includes('two') ? 2 : text.includes('three') ? 3 : 4;
    count = known ? Number(controlled.length >= threshold) : null;
    detail = `${controlled.length} objectives recorded under your control.`;
  } else if (text === 'control at least one central objective.') {
    count = known ? Number(central.length > 0) : null;
    detail = `${central.length} central objectives recorded under your control.`;
  } else if (text === 'destroy at least one enemy unit this turn.' || text === 'per enemy unit destroyed this turn.') {
    const destroyed = getEnemyUnitDestructionsForTurn(state, playerId, state.turn ?? 0);
    count = text.startsWith('per') ? destroyed.length : Number(destroyed.length > 0);
    detail = `${destroyed.length} enemy destructions recorded this turn.`;
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
