import { createRuleSet } from "./rule-set.js";

export function createRuleContext({ ruleSet, data, random = Math.random } = {}) {
  if (!ruleSet || typeof ruleSet.id !== "string") {
    throw new TypeError("A rule set is required.");
  }
  if (!data || data.ruleSetId !== ruleSet.id) {
    throw new Error("Rule data must match the active rule set.");
  }
  if (typeof random !== "function") {
    throw new TypeError("A random function is required.");
  }

  return Object.freeze({
    ruleSet: createRuleSet(ruleSet),
    data,
    random
  });
}
