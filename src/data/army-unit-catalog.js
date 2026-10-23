import { getTyranidAttachmentMetadata } from "./tyranid-leader-bodyguard-compatibility.js";
import { getTyranidDatasheetDetails } from "./tyranid-datasheet-details.js";
import { getRulesDataRevisionForFaction } from "./rules-data-revisions.js";
import { ADEPTUS_CUSTODES_ARMY_CATALOG } from "./adeptus-custodes-army-catalog.js";
import { SPACE_MARINES_ARMY_CATALOG } from "./space-marines-army-catalog.js";

const TYRANID_RULES_REVISION = getRulesDataRevisionForFaction("Tyranids");

function applyReviewedTyranidCorrections(id, details) {
  if (!details) return details;
  if (id !== "tyranids:sky-slasher-swarms") return details;
  // Current 11th-edition Legends data: claws and teeth are fixed; Spinemaws
  // are optional for any number of models, rather than default equipment.
  return {
    ...details,
    weapons: (details.weapons ?? []).map((weapon) =>
      weapon.name === "Spinemaws" ? { ...weapon, equipment: "Wargear option" } : weapon
    )
  };
}

// Tyranid roster catalog. Full profiles are source-reviewed from linked datasheet references;
// official GW cross-check remains explicit metadata and may still be pending.
export const ARMY_UNIT_CATALOG = Object.freeze([
  ...ADEPTUS_CUSTODES_ARMY_CATALOG,
  ...SPACE_MARINES_ARMY_CATALOG,
  ...[
    "Hive Tyrant",
    "Winged Hive Tyrant",
    "Neurotyrant",
    "Tervigon",
    "Tyrannofex",
    "Exocrine",
    "Maleceptor",
    "Psychophage",
    "Screamer-Killer",
    "Carnifexes",
    "Termagants",
    "Hormagaunts",
    "Neurogaunts",
    "Genestealers",
    "Barbgaunts",
    "Biovores",
    "Hive Guard",
    "Zoanthropes",
    "Gargoyles",
    "Lictor",
    "Deathleaper",
    "Neurolictor",
    "Pyrovores",
    "Von Ryan’s Leapers",
    "Ripper Swarms",
    "Parasite of Mortrex",
    "Haruspex",
    "The Red Terror",
    "Mucolid Spores",
    "Spore Mines",
    "Venomthropes",
    "Harpy",
    "Hive Crone",
    "Harridan",
    "Hierophant",
    "Tyrannocyte",
    "Sporocyst",
    "Trygon",
    "Mawloc",
    "Norn Assimilator",
    "Norn Emissary",
    "Toxicrene",
    "Broodlord",
    "The Swarmlord",
    "Old One Eye",
    "Tyranid Prime with Lash Whip",
    "Winged Tyranid Prime",
    "Hyperadapted Raveners",
    "Raveners",
    "Tyrant Guard",
    "Tyranid Warriors with Melee Bio-weapons",
    "Tyranid Warriors with Ranged Bio-weapons", "Malanthrope", "Barbed Hierodule", "Dimachaeron", "Scythed Hierodule", "Sky-slasher Swarms"
  ].map((name) => {
    const id = "tyranids:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const attachmentMetadata = getTyranidAttachmentMetadata(id);
    const details = applyReviewedTyranidCorrections(id, getTyranidDatasheetDetails(id));
    const {
      defaultModelCount, defaultPoints, pointsOptions, dataSource: reviewedSource,
      ...datasheetProfile
    } = details ?? {};
    return Object.freeze({
      id,
      name,
      faction: "Tyranids",
      sourceName: reviewedSource?.sourceName ?? "Candidate unit name; verify against current datasheet",
      sourceUrl: reviewedSource?.sourceUrl ?? "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
      reviewedAt: reviewedSource?.reviewedAt ?? null,
      pointsSourceName: TYRANID_RULES_REVISION?.points
        ? `${TYRANID_RULES_REVISION.points.name} (${TYRANID_RULES_REVISION.points.revisionLabel})`
        : reviewedSource?.pointsSourceName ?? null,
      pointsSourceUrl: TYRANID_RULES_REVISION?.points?.sourceUrl ?? reviewedSource?.pointsSourceUrl ?? null,
      rulesDataRevisionId: TYRANID_RULES_REVISION?.revisionId ?? null,
      officialRulesCrossCheck: reviewedSource?.officialRulesCrossCheck ?? "pending",
      verificationStatus: reviewedSource?.status ?? "name-only-unverified",
      ...(defaultModelCount != null ? { defaultModelCount } : {}),
      ...(defaultPoints != null ? { defaultPoints } : {}),
      ...(pointsOptions ? { pointsOptions } : {}),
      ...(details || attachmentMetadata ? { datasheet: { ...datasheetProfile, ...(attachmentMetadata ?? {}) } } : {})
    });
  }),
  ...[
    // Remaining generic entries are intentionally kept as name-only candidates
    // for future factions; Space Marines are supplied by the reviewed import
    // catalog above.
  ].map((name) => Object.freeze({
    id: "space-marines:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    faction: "Space Marines",
    sourceName: "Candidate unit name; verify against current datasheet",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
    verificationStatus: "name-only-unverified"
  }))
]);

export function getArmyUnitCandidateLabel(unit) {
  if (!unit || typeof unit !== "object") return "Unit · verify";
  if (!unit.datasheet) {
    return unit.verificationStatus === "points-reviewed"
      ? unit.name + " · points only; details incomplete"
      : unit.name + " · name only; verify";
  }
  if (unit.officialRulesCrossCheck === "verified") {
    return unit.name + " · details; official cross-check complete";
  }
  return unit.name + " · details; official cross-check pending";
}

export function findArmyUnitCandidates({ faction, query = "" } = {}) {
  const normalizedFaction = String(faction ?? "").trim().toLowerCase();
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  if (!normalizedFaction) return [];
  return ARMY_UNIT_CATALOG.filter((unit) =>
    unit.faction.toLowerCase() === normalizedFaction &&
    (!normalizedQuery || unit.name.toLowerCase().includes(normalizedQuery))
  );
}
