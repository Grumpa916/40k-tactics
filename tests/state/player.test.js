import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, PLAYER_ROLES } from "../../src/state/player.js";

test("creates a valid player", () => {
  assert.deepEqual(
    createPlayer({ id: "p1", name: "Player 1", role: PLAYER_ROLES.PLAYER_ONE }),
    { id: "p1", name: "Player 1", role: "player_one" }
  );
});
