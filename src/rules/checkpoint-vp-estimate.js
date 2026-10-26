import { missionConditionEvidence } from './checkpoint-mission-evidence.js';
import { getMissionEvidenceCondition } from './mission-evidence-conditions.js';
import { getRemainingPrimaryVictoryPoints } from '../engine/victory-points-ledger.js';

// Advisory only. A scoring award always comes from the player's separate
// confirmation, because map positions and carried-forward control can be stale.
export function estimateCheckpointVp(state, playerId, mission) {
  if (mission?.category !== 'primary') return null;
  const windows = mission.scoringWindows ?? [];
  const items = windows.flatMap(window => window.items ?? []);
  if (!items.length) return null;

  let points = 0, evaluated = 0, incomplete = false;
  for (const item of items) {
    const condition = item.condition ?? getMissionEvidenceCondition(item.summary);
    const vp = Number(item.vp);
    if (!condition || !Number.isInteger(vp) || vp <= 0) { incomplete = true; continue; }
    let count = missionConditionEvidence(state, playerId, item).count;
    if (count == null && ['count-non-home', 'count-objectives'].includes(condition.type)) {
      const objectives = state.objectives ?? [];
      if (objectives.length) {
        count = objectives.filter(objective => objective.control?.controlState === 'controlled' &&
          objective.control.controllerId === playerId &&
          (condition.type !== 'count-non-home' || !/home/i.test(objective.name ?? objective.id))).length;
        incomplete = true;
      }
    }
    if (count == null) { incomplete = true; continue; }
    evaluated += 1;
    points += vp * (/\bper\b/i.test(item.summary ?? '') ? count : Number(count > 0));
  }
  if (!evaluated || (incomplete && !points)) return null;
  const remaining = getRemainingPrimaryVictoryPoints(state, playerId);
  return { points: Math.min(points, remaining), partial: incomplete, capped: points > remaining };
}
