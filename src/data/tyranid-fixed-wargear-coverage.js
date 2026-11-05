import { getTyranidDatasheetDetails } from "./tyranid-datasheet-details.js";

/**
 * Fixed-equipment coverage derived only from explicit weapon listings already
 * recorded in the local 11e Tyranid datasheet catalog. This is NOT a fresh
 * certification of the October GW Faction Pack/Codex.
 *
 * Excludes multi-mode, mixed-composition or possible replacement-weapon
 * datasheets pending exact per-model option review. Never infer selectable
 * options simply from multiple listed profiles.
 */
const SINGLE_MODEL_FIXED = Object.freeze([
  "tyranid-prime-with-lash-whip", "neurotyrant", "broodlord", "the-swarmlord",
  "lictor", "deathleaper", "neurolictor", "parasite-of-mortrex",
  "exocrine", "haruspex", "psychophage", "the-red-terror", "mawloc",
  "norn-assimilator", "toxicrene", "trygon", "winged-tyranid-prime",
  "hive-crone", "tyrannocyte", "hierophant", "harridan",
  "screamer-killer", "sporocyst", "malanthrope", "barbed-hierodule",
  "dimachaeron", "scythed-hierodule"
]);
const UNIFORM_MODEL_FIXED = Object.freeze([
  "raveners", "neurogaunts", "barbgaunts", "biovores", "pyrovores",
  "von-ryan-s-leapers", "hormagaunts", "genestealers", "gargoyles",
  "tyranid-warriors-with-melee-bio-weapons", "venomthropes"
]);
const NO_CONVENTIONAL_WEAPONS = Object.freeze(["mucolid-spores", "spore-mines"]);

function createFixedOnly(id, perModel) {
  const details = getTyranidDatasheetDetails("tyranids:" + id);
  if (!details || !Array.isArray(details.weapons) || !details.weapons.length ||
      details.weapons.some(weapon => !weapon.name || weapon.equipment === "Wargear option")) {
    throw new Error("Fixed-only Tyranid coverage requires explicit catalog weapon evidence: " + id);
  }
  return Object.freeze({
    reviewedAt: "2026-11-04",
    sourceName: "Existing local Tyranid datasheet transcription (independent full official wargear check pending)",
    sourceUrl: details.dataSource?.sourceUrl ?? "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
    coverageSource: "local-datasheet-default-weapons",
    officialWargearCertification: "pending",
    fixed: Object.freeze(details.weapons.map(weapon => Object.freeze({
      name: weapon.name,
      profiles: Object.freeze([weapon.name]),
      ...(perModel ? { perModel: 1 } : { count: 1 })
    })))
  });
}

export const TYRANID_FIXED_WARGEAR_COVERAGE = Object.freeze({
  ...Object.fromEntries(SINGLE_MODEL_FIXED.map(id => ["tyranids:" + id, createFixedOnly(id, false)])),
  ...Object.fromEntries(UNIFORM_MODEL_FIXED.map(id => ["tyranids:" + id, createFixedOnly(id, true)])),
  ...Object.fromEntries(NO_CONVENTIONAL_WEAPONS.map(id => ["tyranids:" + id, Object.freeze({
    reviewedAt: "2026-11-04",
    sourceName: "Local datasheet explicitly lists no conventional weapons; ability effects require manual rules handling",
    sourceUrl: getTyranidDatasheetDetails("tyranids:" + id)?.dataSource?.sourceUrl,
    coverageSource: "local-datasheet-empty-weapons",
    officialWargearCertification: "pending",
    noEquipment: true
  })]))
});

/** Explicitly unresolved weapon alternatives or mixed-model profile groupings. */
export const TYRANID_COMPLEX_LOADOUT_REVIEW = Object.freeze([
  "tyranids:old-one-eye",
  "tyranids:zoanthropes",
  "tyranids:maleceptor",
  "tyranids:norn-emissary",
  "tyranids:harpy",
  "tyranids:hyperadapted-raveners"
]);
