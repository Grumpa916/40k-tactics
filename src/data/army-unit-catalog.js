import { getTyranidAttachmentMetadata } from "./tyranid-leader-bodyguard-compatibility.js";
import { getTyranidDatasheetDetails } from "./tyranid-datasheet-details.js";

// Starter name-only catalog for the roster picker.
// These entries are convenience candidates, not verified datasheets or a complete faction roster.
// Add full characteristics/points only after source review.
export const ARMY_UNIT_CATALOG = Object.freeze([
  ...[
    "Hive Tyrant", "Winged Hive Tyrant", "Neurotyrant", "Tervigon", "Tyrannofex",
    "Exocrine", "Maleceptor", "Psychophage", "Screamer-Killer", "Carnifexes",
    "Termagants", "Hormagaunts", "Neurogaunts", "Genestealers", "Barbgaunts", "Biovores", "Hive Guard",
    "Zoanthropes", "Tyranid Warriors", "Gargoyles", "Lictor", "Deathleaper", "Neurolictor", "Pyrovores",
    "Von Ryan's Leapers", "Ripper Swarms", "Parasite of Mortrex", "Haruspex",
    "Broodlord", "The Swarmlord", "Old One Eye", "Tyranid Prime with Lash Whip",
    "Winged Tyranid Prime", "Hyperadapted Raveners", "Raveners", "Tyrant Guard", "Tyranid Warriors with Melee Bio-weapons",
    "Tyranid Warriors with Ranged Bio-weapons"
  ].map((name) => {
    const id = "tyranids:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const attachmentMetadata = getTyranidAttachmentMetadata(id);
    const details = getTyranidDatasheetDetails(id);
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
      officialRulesCrossCheck: reviewedSource?.officialRulesCrossCheck ?? "pending",
      verificationStatus: reviewedSource?.status ?? "name-only-unverified",
      ...(defaultModelCount != null ? { defaultModelCount } : {}),
      ...(defaultPoints != null ? { defaultPoints } : {}),
      ...(pointsOptions ? { pointsOptions } : {}),
      ...(details || attachmentMetadata ? { datasheet: { ...datasheetProfile, ...(attachmentMetadata ?? {}) } } : {})
    });
  }),
  ...[
    "Captain", "Lieutenant", "Librarian", "Chaplain", "Intercessor Squad",
    "Assault Intercessor Squad", "Infernus Squad", "Hellblaster Squad",
    "Terminator Squad", "Aggressor Squad", "Redemptor Dreadnought",
    "Gladiator Lancer", "Repulsor", "Scout Squad", "Eliminator Squad"
  ].map((name) => Object.freeze({
    id: "space-marines:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    faction: "Space Marines",
    sourceName: "Candidate unit name; verify against current datasheet",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
    verificationStatus: "name-only-unverified"
  }))
]);

export function findArmyUnitCandidates({ faction, query = "" } = {}) {
  const normalizedFaction = String(faction ?? "").trim().toLowerCase();
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  if (!normalizedFaction) return [];
  return ARMY_UNIT_CATALOG.filter((unit) =>
    unit.faction.toLowerCase() === normalizedFaction &&
    (!normalizedQuery || unit.name.toLowerCase().includes(normalizedQuery))
  );
}
