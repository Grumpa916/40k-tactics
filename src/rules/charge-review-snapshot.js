import { getChargeSuccessProbability } from './tactical-charge-opportunity.js';
import { getCustodesChargeAdvisorContext } from './custodes-tactical-advisor.js';

// Save the model available at the decision, never reconstruct it from the final army.
// Availability assumes a re-roll on failure; it is not a record that one was used.
export function getChargeReviewSnapshot(state, unit, targetIds, measuredDistances) {
  const distances = targetIds.map(id => measuredDistances[id]);
  if (!distances.length || distances.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0)) return null;
  const measuredDistance = Math.max(...distances);
  const baseProbability = getChargeSuccessProbability(measuredDistance);
  const context = getCustodesChargeAdvisorContext(state, { playerId:unit.ownerId, unitId:unit.id, baseProbability });
  return { version:1, measuredDistance, baseProbability, successProbability:context.adjustedProbability,
    rerollAvailable:context.rerollCharge, rerollRule:context.ruleName };
}
