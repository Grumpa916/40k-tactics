import test from "node:test";
import assert from "node:assert/strict";
import { createBattle, BATTLE_STATUS } from "../../src/state/battle.js";

test("creates a battle in setup", () => {
  assert.deepEqual(
    createBattle({ id: "b1" }),
    {
      id: "b1",
      missionId: null,
      status: BATTLE_STATUS.SETUP,
      round: 0,
      activePlayerId: null,
      firstPlayerId: null
    }
  );
});
