import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { resolveUnitAttack } from "../../src/engine/combat-transitions.js";

const weapon = {
  id: "laser", name: "Laser", type: "ranged",
  characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
};

const meleeWeapon = {
  id: "blade", name: "Blade", type: "melee",
  characteristics: { attacks: 2, strength: 8, ap: 1, damage: 2 }
};

function activeState() {
  return createGameState({
    phase: "shooting", turn: 1, activePlayer: "p1",
    battle: { id: "battle-1", missionId: null, status: "active", round: 1, activePlayerId: "p1" },
    units: [
      { id: "attacker", ownerId: "p1", name: "Attacker", status: "deployed", wounds: 5, profile: { characteristics: { ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 3 } } },
      { id: "target", ownerId: "p2", name: "Target", status: "deployed", wounds: 5, profile: { characteristics: { ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 3 } } }
    ]
  });
}

test("combat transition resolves an attack from unit and weapon data", () => {
  const state = activeState();
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker", targetId: "target", weapon,
    random: () => values[index++]
  });
  assert.equal(next.units.find((unit) => unit.id === "target").wounds, 1);
  assert.equal(next.history.at(-1).type, "combat.attack_resolved");
});

test("Fight attacks require a current-turn Fight activation", () => {
  const state = { ...activeState(), phase: "fight" };
  assert.throws(
    () => resolveUnitAttack(state, {
      attackerId: "attacker", targetId: "target", weapon: meleeWeapon
    }),
    /activated first/
  );

  const previousTurn = {
    type: "fight.unit_activated",
    payload: {
      unitId: "attacker",
      round: 1,
      turn: 0,
      fightsFirst: false
    }
  };
  assert.throws(
    () => resolveUnitAttack({ ...state, history: [previousTurn] }, {
      attackerId: "attacker", targetId: "target", weapon: meleeWeapon
    }),
    /activated first/
  );
});

test("Fight attacks are allowed after a current-turn activation", () => {
  const state = {
    ...activeState(),
    phase: "fight",
    history: [{
      type: "fight.unit_activated",
      payload: {
        unitId: "attacker",
        round: 1,
        turn: 1,
        fightsFirst: true
      }
    }]
  };
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;

  const next = resolveUnitAttack(state, {
    attackerId: "attacker",
    targetId: "target",
    weapon: meleeWeapon,
    random: () => values[index++]
  });

  assert.equal(next.units.find((unit) => unit.id === "target").wounds, 1);
  assert.equal(next.history.at(-1).type, "combat.attack_resolved");
  assert.equal(next.history.at(-1).payload.phase, "fight");
  assert.equal(next.history.at(-1).payload.turn, 1);
});

test("Fight attacks reject ranged weapons after activation", () => {
  const state = {
    ...activeState(),
    phase: "fight",
    history: [{
      type: "fight.unit_activated",
      payload: {
        unitId: "attacker",
        round: 1,
        turn: 1,
        fightsFirst: false
      }
    }]
  };

  assert.throws(
    () => resolveUnitAttack(state, {
      attackerId: "attacker",
      targetId: "target",
      weapon
    }),
    /require a melee weapon/
  );
});

test("combat transition marks a target destroyed when wounds reach zero", () => {
  const state = activeState();
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker", targetId: "target",
    weapon: { ...weapon, characteristics: { ...weapon.characteristics, damage: 3 } },
    random: () => values[index++]
  });
  const target = next.units.find((unit) => unit.id === "target");
  assert.equal(target.wounds, 0);
  assert.equal(target.status, "destroyed");
});

test("combat transition preserves unknown wounds instead of falsely destroying the target", () => {
  const state = {
    ...activeState(),
    units: activeState().units.map((unit) =>
      unit.id === "target" ? { ...unit, wounds: null } : unit
    )
  };
  const values = [0.1, 0.1, 0.1, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker",
    targetId: "target",
    weapon,
    random: () => values[index++]
  });
  const target = next.units.find((unit) => unit.id === "target");
  assert.equal(target.wounds, null);
  assert.equal(target.status, "deployed");
  assert.equal(next.history.at(-1).payload.stateDelta.target.woundsBefore, null);
  assert.equal(next.history.at(-1).payload.stateDelta.target.woundsAfter, null);
});

test("combat transition rejects attacks outside combat phases", () => {
  assert.throws(
    () => resolveUnitAttack(
      { ...activeState(), phase: "movement" },
      { attackerId: "attacker", targetId: "target", weapon }
    ),
    /shooting or fight/
  );
});

test("combat transition records a replayable combat event payload", () => {
  const state = activeState();
  const values = [0.9, 0.9, 0.9, 0.9, 0.1, 0.1];
  let index = 0;
  const next = resolveUnitAttack(state, {
    attackerId: "attacker", targetId: "target", weapon,
    random: () => values[index++]
  });
  const event = next.history.at(-1);

  assert.equal(event.type, "combat.attack_resolved");
  assert.equal(event.payload.attackerId, "attacker");
  assert.equal(event.payload.targetId, "target");
  assert.equal(event.payload.weaponId, "laser");
  assert.equal(event.payload.phase, "shooting");
  assert.equal(event.payload.round, 1);
  assert.equal(event.payload.turn, 1);
  assert.equal(event.payload.profile.damage, 2);
  assert.equal(event.payload.result.damage.totalDamage, 4);
  assert.deepEqual(event.payload.stateDelta.target, {
    woundsBefore: 5,
    woundsAfter: 1,
    statusBefore: "deployed",
    statusAfter: "deployed"
  });
});

test("combat transition preserves data-driven hit, wound, and save modifiers", () => {
  const state = activeState();
  const modifiedState = {
    ...state,
    units: state.units.map((unit) => unit.id === "target"
      ? { ...unit, profile: { characteristics: { ballisticSkill: 4, toughness: 4, save: 4, hitModifier: 0, woundModifier: 1, saveReroll: "failed", saveRerollCount: 1 } } }
      : unit
    )
  };
  const modifiedWeapon = { ...weapon, characteristics: { ...weapon.characteristics, attacks: 1, damage: 1 } };
  const values = [0.5, 0.8, 0.0, 0.99];
  let index = 0;
  const next = resolveUnitAttack(modifiedState, { attackerId: "attacker", targetId: "target", weapon: modifiedWeapon, random: () => values[index++] });
  const event = next.history.at(-1);
  assert.equal(event.payload.profile.hitModifier, 0);
  assert.equal(event.payload.profile.woundModifier, 1);
  assert.equal(event.payload.profile.saveReroll, "failed");
  assert.equal(event.payload.result.wounds.modifiedTarget, 3);
  assert.equal(event.payload.result.saves.reroll.rerolledCount, 1);
  assert.equal(event.payload.result.damage.totalDamage, 0);
});


test("Shooting attacks require a current-turn Shooting activation", () => {
  const state = { ...activeState(), history: [] };
  assert.throws(
    () => resolveUnitAttack(state, {
      attackerId: "attacker", targetId: "target", weapon
    }),
    /Shooting attack requires the unit to be activated/
  );

  const activated = {
    ...state,
    history: [{
      type: "shooting.unit_activated",
      payload: { unitId: "attacker", round: 1, turn: 1 }
    }]
  };
  const next = resolveUnitAttack(activated, {
    attackerId: "attacker", targetId: "target", weapon,
    random: () => 0.99
  });
  assert.equal(next.history.at(-1).payload.phase, "shooting");
});

test("Shooting attacks reject melee weapons", () => {
  const state = {
    ...activeState(),
    history: [{
      type: "shooting.unit_activated",
      payload: { unitId: "attacker", round: 1, turn: 1 }
    }]
  };
  assert.throws(
    () => resolveUnitAttack(state, {
      attackerId: "attacker", targetId: "target", weapon: meleeWeapon
    }),
    /require a ranged weapon/
  );
});
