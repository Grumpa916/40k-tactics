export const COMMAND_TYPES = Object.freeze({
  START_BATTLE: "battle.start",
  ENTER_DEPLOYMENT: "battle.enter_deployment",
  DEPLOY_UNIT: "unit.deploy",
  START_FIRST_TURN: "turn.start_first",
  CHANGE_PHASE: "turn.change_phase",
  END_TURN: "turn.end",
  ADVANCE_BATTLE_ROUND: "battle_round.advance",
  COMPLETE_BATTLE: "battle.complete",
  RESOLVE_NORMAL_MOVE: "unit.normal_move",
  RECORD_FALL_BACK: "unit.record_fall_back",
  RECORD_CHARGE_OUTCOME: "charge.record_outcome",
  RECORD_SHOOTING_ACTIVATION: "shooting.record_activation",
  COMPLETE_SHOOTING_PHASE: "shooting.complete_phase",
  RECORD_FIGHT_ACTIVATION: "fight.record_activation",
  COMPLETE_FIGHT_PHASE: "fight.complete_phase",
  RESOLVE_ATTACK: "combat.resolve_attack"
});

export const commandTypeList = Object.freeze(Object.values(COMMAND_TYPES));
