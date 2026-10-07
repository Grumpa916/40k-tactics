export const RULE_SET_VERSIONS = Object.freeze({
  CORE_10TH: "10th-edition-core",
});

export function createRuleSet({ id = RULE_SET_VERSIONS.CORE_10TH, version = 1 } = {}) {
  if (!id || typeof id !== "string") {
    throw new TypeError("A rule set id is required.");
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new RangeError("Rule set version must be a positive integer.");
  }
  return Object.freeze({ id, version });
}
