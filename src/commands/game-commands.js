export const COMMAND_TYPES = Object.freeze({
  START_BATTLE: "battle.start",
  ENTER_DEPLOYMENT: "battle.enter_deployment",
  DEPLOY_UNIT: "unit.deploy",
  START_FIRST_TURN: "turn.start_first",
  CHANGE_PHASE: "turn.change_phase",
  CHANGE_ACTIVE_PLAYER: "turn.change_active_player",
  COMPLETE_BATTLE: "battle.complete"
});

export const commandTypeList = Object.freeze(Object.values(COMMAND_TYPES));
