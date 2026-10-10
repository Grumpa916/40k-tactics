/**
 * Ruleset-owned pre-game ability references for Warhammer 40,000 11th edition.
 *
 * These are procedural prompts, not tabletop legality checks. The battlefield
 * map is approximate and does not contain authoritative deployment-zone geometry.
 * Keep these rules in the ruleset rather than making users configure them per battle.
 */
export const PRE_GAME_RULESET_ID = "warhammer-40000-11th-edition";

export const PRE_GAME_ABILITY_RULES = Object.freeze([
  Object.freeze({
    id: "infiltrators",
    name: "Infiltrators",
    timing: "deployment",
    appliesWhen: "Every model in the unit has Infiltrators.",
    procedure: "The unit may be set up anywhere on the battlefield more than 8 inches horizontally from the opponent's deployment zone and all enemy units.",
    requiresTabletopVerification: true
  }),
  Object.freeze({
    id: "scouts",
    name: "Scouts",
    timing: "resolve-pre-battle-abilities",
    appliesWhen: "Every model in the unit has Scouts X inches.",
    choices: Object.freeze([
      "If the unit is in Strategic Reserves, set it up wholly within your deployment zone.",
      "If the unit is wholly within your deployment zone, it can make a Scout move.",
      "A Dedicated Transport wholly within your deployment zone can make a Scout move if every embarked model has Scouts."
    ]),
    scoutMove: Object.freeze({
      maximumDistance: "The X inches stated by the unit's Scouts ability.",
      afterMoving: "The unit must finish more than 8 inches horizontally from all enemy units."
    }),
    requiresTabletopVerification: true
  })
]);

/**
 * Return a fresh, display-safe list so callers can render prompts without
 * mutating the ruleset's canonical definitions.
 */
export function getPreGameAbilityRules() {
  return PRE_GAME_ABILITY_RULES.map((rule) => ({
    ...rule,
    choices: rule.choices ? [...rule.choices] : undefined,
    scoutMove: rule.scoutMove ? { ...rule.scoutMove } : undefined
  }));
}
