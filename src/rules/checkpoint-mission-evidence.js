import {
  getEnemyUnitDestructionsForTurn,
  getFriendlyUnitDestructionsForTurn,
  getTurnSnapshot
} from './scoring-evidence-state.js';
import { getMissionEvidenceCondition } from './mission-evidence-conditions.js';
import { getPunishmentCondemnedUnitsLeftThisTurn } from './punishment-condemnation.js';
import { getCleanseActionState, getPlunderActionState } from './secondary-mission-action-state.js';
import { getBeaconScoringEvidence } from './beacon-mission-state.js';
import { getTemptingTargetScoringEvidence } from './tempting-target-state.js';
import { getBurdenOfTrustScoringEvidence } from './burden-of-trust-state.js';
import {
  getConsecrateReviewState,
  isOpponentHomeObjectiveForPlayer,
  isPlayerHomeObjective
} from './consecrate-state.js';

const OBJECTIVE_CONTROL_TYPES = new Set([
  'control-non-home', 'count-non-home', 'count-objectives', 'control-more',
  'control-objectives', 'control-central', 'control-home', 'new-non-home-control', 'control-opponent-home', 'control-selected-tempting-target', 'burden-trust-guarded-objectives'
]);

function objectiveText(objective) {
  return `${objective?.name ?? ''} ${objective?.id ?? ''} ${objective?.layoutObjective ?? ''}`;
}

function isHomeObjective(objective) {
  return /home/i.test(objectiveText(objective));
}

function controlledBy(objective, playerId) {
  return objective?.control?.controlState === 'controlled' && objective?.control?.controllerId === playerId;
}

function newNonHomeControlCount(state, playerId, objectives) {
  const snapshot = getTurnSnapshot(state, state.turn ?? 0);
  if (!snapshot) return null;
  const startById = new Map((snapshot.objectives ?? []).map((objective) => [objective.id, objective]));
  const relevant = objectives.filter((objective) => !isHomeObjective(objective));
  if (!relevant.every((objective) => startById.has(objective.id))) return null;
  return relevant.filter((objective) =>
    controlledBy(objective, playerId) && !controlledBy(startById.get(objective.id), playerId)
  ).length;
}

// Only explicit recorded facts qualify. Approximate positions cannot prove mission ranges.
export function missionConditionEvidence(state, playerId, item) {
  const condition = typeof item === 'object' ? item?.condition ?? getMissionEvidenceCondition(item?.summary) : getMissionEvidenceCondition(item);
  const objectives = state.objectives ?? [];
  const known = objectives.length > 0 && objectives.every(o => o.control != null);
  const controlled = objectives.filter(o => controlledBy(o, playerId));
  const enemy = objectives.filter(o => o.control?.controlState === 'controlled' && o.control.controllerId !== playerId);
  const nonHome = controlled.filter(o => !isHomeObjective(o));
  const central = controlled.filter(o => /cent(er|ral)/i.test(objectiveText(o)));
  let count = null, detail = '', requiresTabletopConfirmation = false;
  const type = condition?.type;

  if (known) {
    if (type === 'control-non-home') count = Number(nonHome.length >= condition.minimum);
    if (type === 'count-non-home') count = nonHome.length;
    if (type === 'count-objectives') count = controlled.length;
    if (type === 'control-more') count = Number(controlled.length > enemy.length);
    if (type === 'control-objectives') count = Number(controlled.length >= condition.minimum);
    if (type === 'control-central') count = Number(central.length >= condition.minimum);
    if (type === 'control-home') {
      const home = controlled.filter((objective) => isPlayerHomeObjective(state, objective, playerId));
      count = Number(home.length >= (condition.minimum ?? 1));
      detail = home.length + ' home objectives controlled.';
    }
    if (type === 'control-opponent-home') {
      const opponentHome = controlled.filter((objective) => isOpponentHomeObjectiveForPlayer(state, objective, playerId));
      count = Number(opponentHome.length >= (condition.minimum ?? 1));
      detail = opponentHome.length + ' opponent-home objectives controlled.';
    }
    if (type === 'new-non-home-control') {
      const newlyControlled = newNonHomeControlCount(state, playerId, objectives);
      count = newlyControlled == null ? null : Number(newlyControlled >= (condition.minimum ?? 1));
      detail = newlyControlled == null
        ? 'Turn-start objective snapshot is unavailable.'
        : newlyControlled + ' newly controlled non-home objectives recorded this turn.';
    }
  }

  if (OBJECTIVE_CONTROL_TYPES.has(type) && !detail) {
    const current = objectives.filter(o => o.controlRecordedAt?.turn === state.turn && o.controlRecordedAt?.round === state.battle?.round).length;
    detail = controlled.length + ' objectives controlled; ' + nonHome.length + ' non-home; opponent ' + enemy.length +
      '. Control confirmations: ' + current + ' this turn, ' + (objectives.length - current) + ' carried forward or undated.';
  }

  if (type === 'destroy-enemy' || type === 'count-destroyed') {
    const destroyed = getEnemyUnitDestructionsForTurn(state, playerId, state.turn ?? 0);
    count = type === 'count-destroyed' ? destroyed.length : Number(destroyed.length >= condition.minimum);
    detail = destroyed.length + ' enemy destructions recorded this turn.';
  }

  if (type === 'kill-more-than-last-losses') {
    const turn = state.turn ?? 0;
    const destroyed = getEnemyUnitDestructionsForTurn(state, playerId, turn).length;
    const losses = turn > 0 ? getFriendlyUnitDestructionsForTurn(state, playerId, turn - 1).length : 0;
    count = Number(destroyed > losses);
    detail = destroyed + ' enemy destructions this turn versus ' + losses + ' friendly units lost last turn.';
  }

  if (type === 'cleanse-objectives') {
    const cleanse = getCleanseActionState(state, { playerId, turn: state.turn ?? 0, round: state.battle?.round ?? 0 });
    count = Number(cleanse.cleansedCount >= (condition.minimum ?? 1));
    detail = cleanse.cleansedCount + ' distinct non-home objective' + (cleanse.cleansedCount === 1 ? '' : 's') +
      ' confirmed cleansed this turn; ' + cleanse.pendingCount + ' Cleanse Action' + (cleanse.pendingCount === 1 ? '' : 's') + ' awaiting completion review.';
  }

  if (type === 'plunder-this-turn') {
    const plunder = getPlunderActionState(state, { playerId, turn: state.turn ?? 0, round: state.battle?.round ?? 0 });
    count = Number(plunder.completedCount >= (condition.minimum ?? 1));
    detail = plunder.completedCount + ' Plunder terrain area' + (plunder.completedCount === 1 ? '' : 's') + ' recorded this turn.';
  }

  if (type === 'burden-trust-guarded-objectives') {
    const burden = getBurdenOfTrustScoringEvidence(state, playerId, { instanceId: item?.instanceId ?? null });
    count = burden.count;
    detail = burden.detail;
    requiresTabletopConfirmation = burden.requiresTabletopConfirmation === true;
  }

  if (type === 'control-selected-tempting-target') {
    const target = getTemptingTargetScoringEvidence(state, playerId, { instanceId: item?.instanceId ?? null });
    count = target.count;
    detail = target.detail;
  }

  if (type === 'beacon-outside-deployment-zone' || type === 'beacon-outside-territory') {
    const beacon = getBeaconScoringEvidence(state, playerId, type);
    count = beacon.count;
    detail = beacon.detail;
  }

  if (type === 'condemned-left') {
    const left = getPunishmentCondemnedUnitsLeftThisTurn(state, playerId);
    count = Number(left.length >= (condition.minimum ?? 1));
    detail = left.length + ' condemned enemy unit' + (left.length === 1 ? '' : 's') + ' recorded as leaving the battlefield this turn.';
  }

  if (type === 'consecrated-count' || type === 'consecrated-opponent-home') {
    const consecrate = getConsecrateReviewState(state, { playerId });
    if (!consecrate.active) {
      count = null;
      detail = 'Consecrate mission state is unavailable for this player.';
    } else if (type === 'consecrated-count') {
      const minimum = condition.minimum ?? 0;
      const maximum = condition.maximum ?? Infinity;
      count = Number(consecrate.consecratedCount >= minimum && consecrate.consecratedCount <= maximum);
      detail = consecrate.consecratedCount + ' objectives are recorded as consecrated.';
    } else {
      count = Number(consecrate.opponentHomeConsecrated === true);
      detail = consecrate.opponentHomeConsecrated
        ? 'The opponent home objective is recorded as consecrated.'
        : 'The opponent home objective is not recorded as consecrated.';
    }
  }

  return {
    status: count == null || requiresTabletopConfirmation ? 'Needs tabletop confirmation' : count > 0 ? 'Completed in recorded state' : 'Not completed in recorded state',
    count,
    detail,
    ...(requiresTabletopConfirmation ? { requiresTabletopConfirmation: true } : {})
  };
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
