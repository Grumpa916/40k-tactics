import { deploymentUnits, formationFor, preparationIssues, reserveSummary } from './event-preparation.js';

export function isCombinedDeployment(state) {
  return state.preparation?.mode === 'combined' && state.battle?.status === 'deployment';
}
export function deploymentWorkspaceIssues(state) {
  return [...new Set([
    ...preparationIssues(state,'mission'),
    ...preparationIssues(state,'roles'),
    ...preparationIssues(state,'secondaries'),
    ...preparationIssues(state,'formations'),
    ...preparationIssues(state,'deployment'),
    ...preparationIssues(state,'first-turn')
  ])];
}
export function deploymentWorkspaceSummary(state) {
  return (state.players ?? []).map(player => {
    const units = deploymentUnits(state).filter(unit=>unit.ownerId===player.id);
    const unplaced = units.filter(unit=>formationFor(state,unit).kind==='field' && !state.battlefieldMap?.actualDeployment?.[unit.id]);
    const reserve = reserveSummary(state,player.id);
    return {player,units,unplaced,reserve,needsReserveReview:!!(reserve.count && (reserve.unknown || reserve.limit == null || reserve.points>reserve.limit) && !state.preparation?.reserveReview?.[player.id])};
  });
}
