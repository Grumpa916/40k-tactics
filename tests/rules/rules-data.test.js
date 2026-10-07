import test from "node:test";
import assert from "node:assert/strict";
import { RULE_SET_VERSIONS, createRuleSet } from "../../src/rules/rule-set.js";
import { createGameData } from "../../src/data/game-data.js";
import { createRuleContext } from "../../src/rules/rule-context.js";

test("rule set and game data establish a matching deterministic context", () => {
  const ruleSet = createRuleSet({ id: RULE_SET_VERSIONS.CORE_10TH });
  const data = createGameData({ ruleSetId: ruleSet.id, units: [{ id: "u1" }] });
  const random = () => 0.25;
  const context = createRuleContext({ ruleSet, data, random });

  assert.equal(context.ruleSet.id, RULE_SET_VERSIONS.CORE_10TH);
  assert.equal(context.data.units[0].id, "u1");
  assert.equal(context.random(), 0.25);
});

test("rule context rejects mismatched rule data", () => {
  const ruleSet = createRuleSet();
  const data = createGameData({ ruleSetId: "different-rules" });
  assert.throws(
    () => createRuleContext({ ruleSet, data }),
    /must match the active rule set/
  );
});

test("game data does not expose mutable source arrays", () => {
  const units = [{ id: "u1" }];
  const data = createGameData({ ruleSetId: RULE_SET_VERSIONS.CORE_10TH, units });
  units.push({ id: "u2" });
  assert.equal(data.units.length, 1);
});
