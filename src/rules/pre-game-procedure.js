/**
 * Ruleset-owned pre-game ability references for Warhammer 40,000 11th edition.
 *
 * These are procedural prompts, not tabletop legality checks. The battlefield
 * map is approximate and does not contain authoritative deployment-zone geometry.
 * Keep these rules in the ruleset rather than making users configure them per battle.
 */
export const PRE_GAME_RULESET_ID = "warhammer-40000-11th-edition";

export const PRE_GAME_PROCEDURE_STEPS = Object.freeze([
  Object.freeze({ id: "confirm-mission", title: "Confirm the mission", detail: "Follow the selected mission pack's setup sequence, battlefield layout, and special instructions." }),
  Object.freeze({ id: "confirm-armies", title: "Confirm both armies", detail: "Check both rosters and note unit abilities that affect pre-game setup." }),
  Object.freeze({ id: "terrain-objectives", title: "Set up terrain and objectives", detail: "Use the mission instructions; the app map does not infer or validate tabletop placement." }),
  Object.freeze({ id: "pre-battle-abilities", title: "Review pre-battle abilities", detail: "Resolve relevant abilities at their rules-defined timing, including Scouts and Infiltrators when applicable." }),
  Object.freeze({ id: "actual-deployment", title: "Record actual deployment", detail: "Record each non-destroyed unit's starting position or explicitly declare it in reserves." }),
  Object.freeze({ id: "first-turn", title: "Confirm the first player", detail: "Record the first player at the timing required by the mission's setup sequence, then begin the first turn." })
]);

export function getPreGameProcedureSteps() {
  return PRE_GAME_PROCEDURE_STEPS.map((step) => ({ ...step }));
}

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
