import { primaryWindowDue } from '../rules/checkpoint-mission-evidence.js';
import { evaluateScoringCheckpoint } from '../engine/scoring-check-coordinator.js';
import { getMissionActionReviews } from '../rules/mission-action-state.js';
import { getBattlePrimaryMissionDefinitions } from '../data/primary-mission-catalog.js';

export function getScoringCheckpointReminder(state, { previousPhase, missionDefinitions=[], perspectivePlayerId=null } = {}) {
  const timing=previousPhase==='command'&&state.phase==='movement'?'command-phase':state.phase==='end_turn'&&previousPhase!=='end_turn'?'end-of-turn':null;
  if (!timing) return null;
  const activePlayerId=state.activePlayer??state.battle?.activePlayerId;
  const players=state.players??[];
  const groups=players.filter(player=>timing==='end-of-turn'||player.id===activePlayerId).map(player=>{
    const checkpoint=player.id===activePlayerId?timing:'end-of-opponent-turn';
    const review=evaluateScoringCheckpoint(state,{checkpoint,scoringPlayerId:player.id,activePlayerId,primaryDefinitions:missionDefinitions});
    return {playerId:player.id,playerName:player.name??player.id,checkpoint,review,
      actions:getMissionActionReviews(state,{playerId:player.id,checkpoint})};
  });
  const setup=state.battlefieldMap?.missionSetup;
  const primaries=setup?.myDisposition&&setup?.opponentDisposition
    ? getBattlePrimaryMissionDefinitions(setup.myDisposition,setup.opponentDisposition)
    : null;
  const myPlayer=perspectivePlayerId??players[0]?.id;
  for (const group of groups) {
    group.primaryReference=primaries?(group.playerId===myPlayer?primaries.myMission:primaries.opponentMission):null;
    group.primaryScoringWindows=(group.primaryReference?.scoring??[]).filter(window =>
      primaryWindowDue(window.when, group.checkpoint, state.battle?.round));
  }
  const activeName=players.find(p=>p.id===activePlayerId)?.name??'active player';
  return {timing,label:`End of ${activeName}'s ${timing==='command-phase'?'Command phase':'turn'}`,
    activePlayerId,scoringPlayerId:activePlayerId,groups,
    missions:groups.flatMap(group=>[
      ...(group.primaryReference?[`${group.playerName}: ${group.primaryReference.name}`]:[]),
      ...[...group.review.primary,...group.review.secondary].map(item=>`${group.playerName}: ${item.definitionName??item.definitionId}`)
    ])};
}

