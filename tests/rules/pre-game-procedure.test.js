import test from "node:test";
import assert from "node:assert/strict";
import {
  PRE_GAME_ABILITY_RULES,
  PRE_GAME_RULESET_ID,
  getPreGameAbilityRules
} from "../../src/rules/pre-game-procedure.js";

test("pre-game ability prompts are owned by the fixed 11th-edition ruleset", () => {
  assert.equal(PRE_GAME_RULESET_ID, "warhammer-40000-11th-edition");
  assert.deepEqual(PRE_GAME_ABILITY_RULES.map((rule) => rule.id), [
    "infiltrators", "scouts"
  ]);
  assert.equal(PRE_GAME_ABILITY_RULES[0].timing, "deployment");
  assert.equal(PRE_GAME_ABILITY_RULES[1].timing, "resolve-pre-battle-abilities");
});

test("Infiltrators prompt preserves the 8-inch separation and whole-unit condition", () => {
  const [infiltrators] = getPreGameAbilityRules();
  assert.match(infiltrators.appliesWhen, /Every model/);
  assert.match(infiltrators.procedure, /more than 8 inches horizontally/);
  assert.equal(infiltrators.requiresTabletopVerification, true);
});

test("Scouts prompt describes the three current pre-battle choices and Scout move limit", () => {
  const scouts = getPreGameAbilityRules().find((rule) => rule.id === "scouts");
  assert.equal(scouts.choices.length, 3);
  assert.match(scouts.choices[0], /Strategic Reserves/);
  assert.match(scouts.choices[1], /wholly within your deployment zone/);
  assert.match(scouts.choices[2], /Dedicated Transport/);
  assert.match(scouts.scoutMove.maximumDistance, /X inches/);
  assert.match(scouts.scoutMove.afterMoving, /more than 8 inches horizontally/);
});

test("display callers cannot mutate the canonical ruleset", () => {
  const displayRules = getPreGameAbilityRules();
  displayRules[1].choices.push("user-added rule");
  assert.equal(PRE_GAME_ABILITY_RULES[1].choices.length, 3);
});
