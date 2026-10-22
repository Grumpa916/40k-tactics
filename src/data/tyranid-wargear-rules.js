const REVIEWED_AT = "2026-10-22";

function selection(name, profiles = [name]) {
  return Object.freeze({ name, profiles: Object.freeze(profiles) });
}
function fixed(name, { perModel = 0, count = 0, profiles = [name] } = {}) {
  return Object.freeze({ ...selection(name, profiles), perModel, count });
}
function slot(id, { count = 0, perModel = 0, choices = [] } = {}) {
  return Object.freeze({ id, count, perModel, choices: Object.freeze(choices.map((choice) =>
    typeof choice === "string" ? selection(choice) : selection(choice.name, choice.profiles)
  )) });
}
function optional(name, { perModel = 1, allOrNone = false, profiles = [name] } = {}) {
  return Object.freeze({ ...selection(name, profiles), perModel, allOrNone });
}
function rule(sourceUrl, body) {
  return Object.freeze({
    reviewedAt: REVIEWED_AT,
    sourceName: "40k.app current Tyranids datasheet wargear options",
    sourceUrl,
    ...body
  });
}

/**
 * Declarative loadout rules for Tyranid datasheets that currently expose weapon choices.
 * These rules are reviewed against the current 11th-edition Warhammer App-derived
 * datasheet presentation. They intentionally model weapon/equipment legality only;
 * points surcharges remain in the points layer.
 */
export const TYRANID_WARGEAR_RULES = Object.freeze({
  "tyranids:hive-tyrant": rule("https://www.40k.app/factions/tyranids/units/hive-tyrant", {
    slots: Object.freeze([
      slot("primary", { count: 1, choices: [
        "Monstrous bonesword and lash whip", "Heavy venom cannon", "Stranglethorn cannon", "Monstrous scything talons"
      ] }),
      slot("secondary", { count: 1, choices: [
        "Monstrous scything talons", "Heavy venom cannon", "Stranglethorn cannon"
      ] })
    ]),
    constraints: Object.freeze([
      Object.freeze({ type: "max", selection: "Heavy venom cannon", max: 1 }),
      Object.freeze({ type: "max", selection: "Stranglethorn cannon", max: 1 }),
      Object.freeze({ type: "mutually-exclusive", selections: Object.freeze(["Heavy venom cannon", "Stranglethorn cannon"]) })
    ])
  }),
  "tyranids:winged-hive-tyrant": rule("https://www.40k.app/factions/tyranids/units/winged-hive-tyrant", {
    fixed: Object.freeze([fixed("Tyrant talons", { count: 1 })]),
    slots: Object.freeze([
      slot("primary", { count: 1, choices: [
        "Monstrous bonesword and lash whip", "Heavy venom cannon", "Stranglethorn cannon", "Monstrous scything talons"
      ] })
    ])
  }),
  "tyranids:tervigon": rule("https://www.40k.app/factions/tyranids/units/tervigon", {
    fixed: Object.freeze([fixed("Stinger salvoes", { count: 1 })]),
    slots: Object.freeze([
      slot("primary-melee", { count: 1, choices: [
        { name: "Massive scything talons", profiles: ["Massive scything talons (strike)", "Massive scything talons (sweep)"] },
        "Massive crushing claws"
      ] })
    ])
  }),
  "tyranids:tyrannofex": rule("https://www.40k.app/factions/tyranids/units/tyrannofex", {
    fixed: Object.freeze([
      fixed("Stinger salvoes", { count: 1 }),
      fixed("Powerful limbs", { count: 1 })
    ]),
    slots: Object.freeze([
      slot("main-gun", { count: 1, choices: ["Fleshborer hive", "Acid spray", "Rupture cannon"] })
    ])
  }),
  "tyranids:termagants": rule("https://www.40k.app/factions/tyranids/units/termagants", {
    fixed: Object.freeze([fixed("Chitinous claws and teeth", { perModel: 1 })]),
    slots: Object.freeze([
      slot("ranged-weapon", { perModel: 1, choices: [
        "Fleshborer", "Termagant devourer", "Termagant spinefists", "Shardlauncher", "Spike rifle", "Strangleweb"
      ] })
    ]),
    constraints: Object.freeze([
      Object.freeze({ type: "same-baseline", selections: Object.freeze(["Fleshborer", "Termagant devourer", "Termagant spinefists"]) }),
      Object.freeze({ type: "max-per-models", selection: "Shardlauncher", models: 10, maxEach: 1 }),
      Object.freeze({ type: "max-per-models", selection: "Spike rifle", models: 10, maxEach: 1 }),
      Object.freeze({ type: "max-per-models", selection: "Strangleweb", models: 10, maxEach: 1 })
    ])
  }),
  "tyranids:carnifexes": rule("https://www.40k.app/factions/tyranids/units/carnifexes", {
    fixed: Object.freeze([fixed("Chitinous claws and teeth", { perModel: 1 })]),
    slots: Object.freeze([
      slot("extra-talons-slot", { perModel: 1, choices: [
        "Carnifex extra scything talons", "Deathspitters with slimer maggots", "Devourers with brainleech worms",
        "Heavy venom cannon", "Stranglethorn cannon", "Carnifex crushing claws"
      ] }),
      slot("scything-talons-slot", { perModel: 1, choices: [
        "Carnifex scything talons", "Deathspitters with slimer maggots", "Devourers with brainleech worms", "Carnifex crushing claws"
      ] })
    ]),
    optional: Object.freeze([
      optional("Bio-plasma"),
      optional("Spine banks")
    ])
  }),
  "tyranids:hive-guard": rule("https://www.40k.app/factions/tyranids/units/hive-guard", {
    fixed: Object.freeze([fixed("Chitinous claws and teeth", { perModel: 1 })]),
    slots: Object.freeze([
      slot("ranged-weapon", { perModel: 1, choices: ["Shockcannon", "Impaler cannon"] })
    ])
  }),
  "tyranids:tyrant-guard": rule("https://www.40k.app/factions/tyranids/units/tyrant-guard", {
    slots: Object.freeze([
      slot("melee-loadout", { perModel: 1, choices: [
        "Scything talons and rending claws", "Bone cleaver, lash whip and rending claws", "Crushing claws and rending claws"
      ] })
    ])
  }),
  "tyranids:tyranid-warriors-with-ranged-bio-weapons": rule("https://www.40k.app/factions/tyranids/units/tyranid-warriors-with-ranged-bio-weapons", {
    fixed: Object.freeze([fixed("Tyranid Warrior claws and talons", { perModel: 1 })]),
    slots: Object.freeze([
      slot("ranged-weapon", { perModel: 1, choices: ["Devourer", "Deathspitter", "Spinefists", "Barbed strangler", "Venom cannon"] })
    ]),
    constraints: Object.freeze([
      Object.freeze({ type: "max-per-models", selection: "Barbed strangler", models: 3, maxEach: 1 }),
      Object.freeze({ type: "max-per-models", selection: "Venom cannon", models: 3, maxEach: 1 })
    ])
  }),
  "tyranids:ripper-swarms": rule("https://www.40k.app/factions/tyranids/units/ripper-swarms", {
    fixed: Object.freeze([fixed("Chitinous claws and teeth", { perModel: 1 })]),
    optional: Object.freeze([optional("Spinemaws", { allOrNone: true })])
  })
});

export function getTyranidWargearRuleSet(datasheetId) {
  return TYRANID_WARGEAR_RULES[datasheetId] ?? null;
}

export function getTyranidWargearSelections(datasheetId) {
  const ruleSet = getTyranidWargearRuleSet(datasheetId);
  if (!ruleSet) return [];
  const values = [
    ...(ruleSet.fixed ?? []),
    ...(ruleSet.optional ?? []),
    ...(ruleSet.slots ?? []).flatMap((item) => item.choices ?? [])
  ];
  const seen = new Set();
  return values.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
