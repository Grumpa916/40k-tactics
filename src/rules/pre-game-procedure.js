/**
 * Ruleset-owned pre-game ability references for Warhammer 40,000 11th edition.
 *
 * These are procedural prompts, not tabletop legality checks. The battlefield
 * map is approximate and does not contain authoritative deployment-zone geometry.
 * Keep these rules in the ruleset rather than making users configure them per battle.
 */
export const PRE_GAME_RULESET_ID = "warhammer-40000-11th-edition";

export const PRE_GAME_PROCEDURE_STEPS = Object.freeze([
  {id:'confirm-armies',title:'Confirm submitted armies',detail:'Use the mustered rosters and recorded Force Dispositions.'},
  {id:'confirm-mission',title:'Determine missions and layout',detail:'Resolve both Primary Missions and use the organiser’s layout or random result.'},
  {id:'terrain-objectives',title:'Create the battlefield',detail:'Place terrain areas, then features from the official layout.'},
  {id:'roles',title:'Determine attacker and defender',detail:'Agree table edges; roll off and let the winner choose roles.'},
  {id:'secondaries',title:'Reveal secondary choices',detail:'Choose privately, reveal together, then record modes and Fixed cards.'},
  {id:'formations',title:'Declare battle formations',detail:'Privately declare passengers, then strategic reserves; reveal together.'},
  {id:'actual-deployment',title:'Deploy armies',detail:'Alternate from Defender; apply Titanic skips and Infiltrators here.'},
  {id:'redeploy',title:'Redeploy units',detail:'Alternate applicable redeploy rules from Attacker.'},
  {id:'first-turn',title:'Determine first turn',detail:'Roll off; the winner takes first turn.'},
  {id:'pre-battle-abilities',title:'Resolve pre-battle rules',detail:'Alternate from the first player, including Scouts at this timing.'}
].map(Object.freeze));

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

