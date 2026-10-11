// Starter name-only catalog for the roster picker.
// These entries are convenience candidates, not verified datasheets or a complete faction roster.
// Add full characteristics/points only after source review.
export const ARMY_UNIT_CATALOG = Object.freeze([
  ...[
    "Hive Tyrant", "Winged Hive Tyrant", "Neurotyrant", "Tervigon", "Tyrannofex",
    "Exocrine", "Maleceptor", "Psychophage", "Screamer-Killer", "Carnifexes",
    "Termagants", "Hormagaunts", "Neurogaunts", "Genestealers", "Barbgaunts",
    "Zoanthropes", "Tyranid Warriors", "Gargoyles", "Lictor", "Deathleaper"
  ].map((name) => Object.freeze({
    id: "tyranids:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    faction: "Tyranids",
    sourceName: "Candidate unit name; verify against current datasheet",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
    verificationStatus: "name-only-unverified"
  })),
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
