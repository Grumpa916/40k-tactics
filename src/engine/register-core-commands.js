import { recordRulesReminderUse, setUnitBattleNote } from './rules-reminder-transitions.js';
import { recordVenatariAbilityUse } from './venatari-ability-transitions.js';
import { transferMapReserve } from './map-reserve-transitions.js';
import { updateDeploymentWorkspace } from './deployment-workspace-transitions.js';
import { setManualBattleShock } from "./manual-battle-shock-transitions.js";
import { reviewMissionAction } from "./mission-action-transitions.js";
import { finishCombatActivation } from "./combat-activation-transitions.js";
import { updatePreparation } from "./event-preparation-transitions.js";
import { recordPunishmentCondemnation } from "./punishment-transitions.js";
import { recordConsecrateReview } from "./consecrate-transitions.js";
import { recordSmokeAndMirrorsMarkerRemoval } from "./smoke-and-mirrors-removal-transitions.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { applyArmyRosterToBattle } from "./army-roster-transitions.js";
import { setPreGameRoles, setBattleSize } from "./battle-setup-transitions.js";
import { registerCommandHandler } from "./command-engine.js";
import { recordUnitCasualty, undoUnitCasualty } from './unit-casualty-transitions.js';
import {
  startBattle,
  enterDeployment,
  deployUnit,
  startFirstTurn,
  changePhase,
  endTurn,
  advanceBattleRound,
  completeBattle,
  recordObjectiveControl
} from "./state-transitions.js";
import { resolveUnitAttack } from "./combat-transitions.js";
import { resolveNormalMove, resolveAdvance, recordFallBack, recordStationary, undoMovementAction } from "./movement-transitions.js";
import { refineMovementAction, undoMovementRefinement } from './movement-refinement-transitions.js';
import { recordCustodesKatahUse } from './custodes-katah-transitions.js';
import { recordChargeOutcome, recordChargeDeclined } from "./charge-transitions.js";
import { recordShootingActivation, completeShootingPhase } from "./shooting-transitions.js";
import { recordFightActivation, completeFightPhase } from "./fight-transitions.js";
import { recordCommandPointChange } from "./command-points-ledger.js";
import { adjustVictoryPoints, recordVictoryPointsAward, undoLatestVictoryPointsAward } from "./victory-points-ledger.js";
import { recordSecondaryMissionScore } from "./secondary-mission-scoring.js";
import { useSecondaryMissionRedraw } from "./secondary-mission-redraw.js";
import { discardTacticalSecondariesForCommandPoint } from "./tactical-secondary-discard.js";
import { recordBattleShockTest } from "./battle-shock-transitions.js";
import { recordFactionAbilityDecision } from "./faction-ability-transitions.js";
import { startTurnClock, pauseTurnClock } from "./turn-clock-transitions.js";
import {
  setDeploymentPlanPosition,
  clearDeploymentPlanPosition,
  clearDeploymentPlan,
  setActualDeploymentPosition,
  adjustLiveMapPosition,
  declareUnitReserve,
  setEventCompanionMissionSetup
} from "./battlefield-map-transitions.js";
import { drawSecondaryMission, setSecondaryMissionMode } from "../rules/secondary-mission-lifecycle.js";

export function registerCoreCommandHandlers() {
  const handlers = [
    [COMMAND_TYPES.RECORD_RULES_REMINDER_USE, (state, command) => recordRulesReminderUse(state, command.payload)],
    [COMMAND_TYPES.RECORD_VENATARI_ABILITY_USE, (state, command) => recordVenatariAbilityUse(state, command.payload)],
    [COMMAND_TYPES.SET_UNIT_BATTLE_NOTE, (state, command) => setUnitBattleNote(state, command.payload)],
    [COMMAND_TYPES.TRANSFER_MAP_RESERVE, (state, command) => transferMapReserve(state, command.payload)],
    [COMMAND_TYPES.UPDATE_DEPLOYMENT_WORKSPACE, (state, command) => updateDeploymentWorkspace(state, command.payload)],
    [COMMAND_TYPES.UPDATE_PREPARATION, (state, command) => updatePreparation(state, command.payload)],
    [COMMAND_TYPES.START_BATTLE, (state, command) => startBattle(state, command.payload)],
    [COMMAND_TYPES.APPLY_ARMY_ROSTER_TO_BATTLE, (state, command) => applyArmyRosterToBattle(state, command.payload)],
    [COMMAND_TYPES.ENTER_DEPLOYMENT, (state) => enterDeployment(state)],
    [COMMAND_TYPES.DEPLOY_UNIT, (state, command) => deployUnit(state, command.payload)],
    [COMMAND_TYPES.SET_DEPLOYMENT_PLAN_POSITION, (state, command) => setDeploymentPlanPosition(state, command.payload)],
    [COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN_POSITION, (state, command) => clearDeploymentPlanPosition(state, command.payload)],
    [COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN, (state, command) => clearDeploymentPlan(state, command.payload)],
    [COMMAND_TYPES.SET_ACTUAL_DEPLOYMENT_POSITION, (state, command) => setActualDeploymentPosition(state, command.payload)],
    [COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION, (state, command) => adjustLiveMapPosition(state, command.payload)],
    [COMMAND_TYPES.DECLARE_UNIT_RESERVE, (state, command) => declareUnitReserve(state, command.payload)],
    [COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, (state, command) => setEventCompanionMissionSetup(state, command.payload)],
    [COMMAND_TYPES.SET_PRE_GAME_ROLES, (state, command) => setPreGameRoles(state, command.payload)],
    [COMMAND_TYPES.SET_BATTLE_SIZE, (state, command) => setBattleSize(state, command.payload)],
    [COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL, (state, command) => recordObjectiveControl(state, command.payload)],
    [COMMAND_TYPES.RECORD_PUNISHMENT_CONDEMNATION, (state, command) => recordPunishmentCondemnation(state, command.payload)],
    [COMMAND_TYPES.RECORD_CONSECRATE_REVIEW, (state, command) => recordConsecrateReview(state, command.payload)],
    [COMMAND_TYPES.RECORD_SMOKE_AND_MIRRORS_MARKER_REMOVAL, (state, command) => recordSmokeAndMirrorsMarkerRemoval(state, command.payload)],
    [COMMAND_TYPES.START_FIRST_TURN, (state, command) => startFirstTurn(state, command.payload)],
    [COMMAND_TYPES.CHANGE_PHASE, (state, command) => changePhase(state, command.payload)],
    [COMMAND_TYPES.END_TURN, (state, command) => endTurn(state, command.payload)],
    [COMMAND_TYPES.ADVANCE_BATTLE_ROUND, (state) => advanceBattleRound(state)],
    [COMMAND_TYPES.COMPLETE_BATTLE, (state) => completeBattle(state)],
    [COMMAND_TYPES.RESOLVE_NORMAL_MOVE, (state, command) => resolveNormalMove(state, command.payload)],
    [COMMAND_TYPES.RECORD_FALL_BACK, (state, command) => recordFallBack(state, command.payload)],
    [COMMAND_TYPES.RESOLVE_ADVANCE, (state, command) => resolveAdvance(state, command.payload)],
    [COMMAND_TYPES.RECORD_STATIONARY, (state, command) => recordStationary(state, command.payload)],
    [COMMAND_TYPES.REFINE_MOVEMENT_ACTION, (state, command) => refineMovementAction(state, command.payload)],
    [COMMAND_TYPES.UNDO_MOVEMENT_REFINEMENT, (state, command) => undoMovementRefinement(state, command.payload)],
    [COMMAND_TYPES.UNDO_MOVEMENT_ACTION, (state, command) => undoMovementAction(state, command.payload)],
    [COMMAND_TYPES.RECORD_CUSTODES_KATAH_USE, (state, command) => recordCustodesKatahUse(state, command.payload)],
    [COMMAND_TYPES.RECORD_UNIT_CASUALTY, (state, command) => recordUnitCasualty(state, command.payload)],
    [COMMAND_TYPES.UNDO_UNIT_CASUALTY, (state, command) => undoUnitCasualty(state, command.payload)],
    [COMMAND_TYPES.RECORD_CHARGE_OUTCOME, (state, command) => recordChargeOutcome(state, command.payload)],
    [COMMAND_TYPES.RECORD_CHARGE_DECLINED, (state, command) => recordChargeDeclined(state, command.payload)],
    [COMMAND_TYPES.RECORD_SHOOTING_ACTIVATION, (state, command) => recordShootingActivation(state, command.payload)],
    [COMMAND_TYPES.COMPLETE_SHOOTING_PHASE, (state) => completeShootingPhase(state)],
    [COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, (state, command) => recordFightActivation(state, command.payload)],
    [COMMAND_TYPES.COMPLETE_FIGHT_PHASE, (state, command) => completeFightPhase(state, command.payload)],
    [COMMAND_TYPES.FINISH_COMBAT_ACTIVATION, (state, command) => finishCombatActivation(state, command.payload)],
    [COMMAND_TYPES.REVIEW_MISSION_ACTION, (state, command) => reviewMissionAction(state, command.payload)],
    [COMMAND_TYPES.RESOLVE_ATTACK, (state, command, context) =>
      resolveUnitAttack(state, { ...command.payload, random: context.random ?? Math.random })
    ],
    [COMMAND_TYPES.RECORD_COMMAND_POINT_CHANGE, (state, command) => recordCommandPointChange(state, command.payload)],
    [COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK, (state, command) => setManualBattleShock(state, command.payload)],
    [COMMAND_TYPES.RECORD_BATTLE_SHOCK_TEST, (state, command) => recordBattleShockTest(state, command.payload)],
    [COMMAND_TYPES.RECORD_FACTION_ABILITY_DECISION, (state, command) => recordFactionAbilityDecision(state, command.payload)],
    [COMMAND_TYPES.START_TURN_CLOCK, (state, command) => startTurnClock(state, command.payload)],
    [COMMAND_TYPES.PAUSE_TURN_CLOCK, (state, command) => pauseTurnClock(state, command.payload)],
    [COMMAND_TYPES.RECORD_VICTORY_POINTS, (state, command) => recordVictoryPointsAward(state, command.payload)],
    [COMMAND_TYPES.ADJUST_VICTORY_POINTS, (state, command) => adjustVictoryPoints(state, command.payload)],
    [COMMAND_TYPES.UNDO_LATEST_VICTORY_POINTS_AWARD, (state, command) => undoLatestVictoryPointsAward(state, command.payload)],
    [COMMAND_TYPES.DRAW_SECONDARY_MISSION, (state, command) => drawSecondaryMission(state, command.payload)],
    [COMMAND_TYPES.SET_SECONDARY_MISSION_MODE, (state, command) => setSecondaryMissionMode(state, command.payload)],
    [COMMAND_TYPES.RECORD_SECONDARY_MISSION_SCORE, (state, command) => recordSecondaryMissionScore(state, command.payload)],
    [COMMAND_TYPES.USE_SECONDARY_MISSION_REDRAW, (state, command) => useSecondaryMissionRedraw(state, command.payload)],
    [COMMAND_TYPES.DISCARD_TACTICAL_SECONDARIES_FOR_CP, (state, command) => discardTacticalSecondariesForCommandPoint(state, command.payload)]
  ];

  for (const [type, handler] of handlers) registerCommandHandler(type, handler);
}
