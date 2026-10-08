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
  RECORD_CHARGE_OUTCOME: "charge.record_outcome",
  RESOLVE_ATTACK: "combat.resolve_attack"
});

export const commandTypeList = Object.freeze(Object.values(COMMAND_TYPES));
