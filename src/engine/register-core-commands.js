import { COMMAND_TYPES } from "../commands/game-commands.js";
import { registerCommandHandler } from "./command-engine.js";
import {
  startBattle,
  enterDeployment,
  deployUnit,
  startFirstTurn,
  changePhase,
  endTurn,
  advanceBattleRound,
  completeBattle
} from "./state-transitions.js";
import { resolveUnitAttack } from "./combat-transitions.js";
import { resolveNormalMove, resolveAdvance, recordFallBack, recordStationary } from "./movement-transitions.js";
import { recordChargeOutcome } from "./charge-transitions.js";
import { recordShootingActivation, completeShootingPhase } from "./shooting-transitions.js";
import { recordFightActivation, completeFightPhase } from "./fight-transitions.js";
import { recordCommandPointChange } from "./command-points-ledger.js";
import { adjustVictoryPoints, recordVictoryPointsAward, undoLatestVictoryPointsAward } from "./victory-points-ledger.js";
import { recordSecondaryMissionScore } from "./secondary-mission-scoring.js";
import { useSecondaryMissionRedraw } from "./secondary-mission-redraw.js";
import { discardTacticalSecondariesForCommandPoint } from "./tactical-secondary-discard.js";
import { setDeploymentPlanPosition, clearDeploymentPlanPosition, clearDeploymentPlan } from "./battlefield-map-transitions.js";
import { drawSecondaryMission, setSecondaryMissionMode } from "../rules/secondary-mission-lifecycle.js";

export function registerCoreCommandHandlers() {
  const handlers = [
    [COMMAND_TYPES.START_BATTLE, (state, command) => startBattle(state, command.payload)],
    [COMMAND_TYPES.ENTER_DEPLOYMENT, (state) => enterDeployment(state)],
    [COMMAND_TYPES.DEPLOY_UNIT, (state, command) => deployUnit(state, command.payload)],
    [COMMAND_TYPES.SET_DEPLOYMENT_PLAN_POSITION, (state, command) => setDeploymentPlanPosition(state, command.payload)],
    [COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN_POSITION, (state, command) => clearDeploymentPlanPosition(state, command.payload)],
    [COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN, (state, command) => clearDeploymentPlan(state, command.payload)],
    [COMMAND_TYPES.START_FIRST_TURN, (state, command) => startFirstTurn(state, command.payload)],
    [COMMAND_TYPES.CHANGE_PHASE, (state, command) => changePhase(state, command.payload)],
    [COMMAND_TYPES.END_TURN, (state, command) => endTurn(state, command.payload)],
    [COMMAND_TYPES.ADVANCE_BATTLE_ROUND, (state) => advanceBattleRound(state)],
    [COMMAND_TYPES.COMPLETE_BATTLE, (state) => completeBattle(state)],
    [COMMAND_TYPES.RESOLVE_NORMAL_MOVE, (state, command) =>
      resolveNormalMove(state, command.payload)],
    [COMMAND_TYPES.RECORD_FALL_BACK, (state, command) =>
      recordFallBack(state, command.payload)],
    [COMMAND_TYPES.RESOLVE_ADVANCE, (state, command) => resolveAdvance(state, command.payload)],
    [COMMAND_TYPES.RECORD_STATIONARY, (state, command) => recordStationary(state, command.payload)],
    [COMMAND_TYPES.RECORD_CHARGE_OUTCOME, (state, command) =>
      recordChargeOutcome(state, command.payload)],
    [COMMAND_TYPES.RECORD_SHOOTING_ACTIVATION, (state, command) =>
      recordShootingActivation(state, command.payload)],
    [COMMAND_TYPES.COMPLETE_SHOOTING_PHASE, (state) => completeShootingPhase(state)],
    [COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, (state, command) =>
      recordFightActivation(state, command.payload)],
    [COMMAND_TYPES.COMPLETE_FIGHT_PHASE, (state) => completeFightPhase(state)],
    [COMMAND_TYPES.RESOLVE_ATTACK, (state, command, context) =>
      resolveUnitAttack(state, { ...command.payload, random: context.random ?? Math.random })
    ],
    [COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, (state, command) =>
      recordCommandPointChange(state, command.payload)],
    [COMMAND_TYPES.RECORD_VICTORY_POINTS, (state, command) =>
      recordVictoryPointsAward(state, command.payload)],
    [COMMAND_TYPES.ADJUST_VICTORY_POINTS, (state, command) =>
      adjustVictoryPoints(state, command.payload)],
    [COMMAND_TYPES.UNDO_LATEST_VICTORY_POINTS_AWARD, (state, command) =>
      undoLatestVictoryPointsAward(state, command.payload)],
    [COMMAND_TYPES.DRAW_SECONDARY_MISSION, (state, command) =>
      drawSecondaryMission(state, command.payload)],
    [COMMAND_TYPES.SET_SECONDARY_MISSION_MODE, (state, command) =>
      setSecondaryMissionMode(state, command.payload)],
    [COMMAND_TYPES.RECORD_SECONDARY_MISSION_SCORE, (state, command) =>
      recordSecondaryMissionScore(state, command.payload)],
    [COMMAND_TYPES.USE_SECONDARY_MISSION_REDRAW, (state, command) =>
      useSecondaryMissionRedraw(state, command.payload)],
    [COMMAND_TYPES.DISCARD_TACTICAL_SECONDARIES_FOR_CP, (state, command) =>
      discardTacticalSecondariesForCommandPoint(state, command.payload)]
  ];

  for (const [type, handler] of handlers) {
    registerCommandHandler(type, handler);
  }
}
