export const BATTLE_STATUS = Object.freeze({
  SETUP: "setup",
  DEPLOYMENT: "deployment",
  ACTIVE: "active",
  COMPLETE: "complete"
});

export function createBattle({
  id,
  missionId = null,
  status = BATTLE_STATUS.SETUP,
  round = 0,
  activePlayerId = null,
  firstPlayerId = null
} = {}) {
  if (!id) {
    throw new TypeError("Battle id is required.");
  }
  if (!Object.values(BATTLE_STATUS).includes(status)) {
    throw new RangeError("Unknown battle status: " + status);
  }
  return { id, missionId, status, round, activePlayerId, firstPlayerId };
}
