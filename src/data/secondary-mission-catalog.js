/**
 * 11th-edition Chapter Approved 2026–27 secondary mission name catalog.
 *
 * Scope: card names and Fixed/Tactical availability only. The catalog deliberately
 * does not claim to encode card-side-specific scoring rules, VP tiers, or timing.
 * Those remain manual-review inputs until both Attacker and Defender card faces
 * have been individually checked against the mission pack.
 *
 * Candidate-name cross-check: IRONBUILT-LLC/ironbuilt-data,
 * datasets/wh40k-11e-missions.json, version 2026.08.25-primary-timing-audit.
 * That community dataset is not treated as an authoritative scoring source.
 */
export const SECONDARY_MISSION_CATALOG_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  catalogScope: "names-only",
  rulesVerified: false,
  candidateDatasetVersion: "2026.08.25-primary-timing-audit",
  candidateDatasetUrl: "https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/main/datasets/wh40k-11e-missions.json",
  rulesReferenceUrl: "https://www.warhammer-community.com/en-gb/articles/p3i6aa3h/the-chapter-approved-deck-what-is-it-and-how-does-it-work/"
});

const cardNames = [
  ["a-grievous-blow", "A Grievous Blow", true],
  ["a-tempting-target", "A Tempting Target", false],
  ["assassination", "Assassination", true],
  ["beacon", "Beacon", false],
  ["behind-enemy-lines", "Behind Enemy Lines", false],
  ["bring-it-down", "Bring it Down", true],
  ["burden-of-trust", "Burden of Trust", false],
  ["centre-ground", "Centre Ground", false],
  ["cleanse", "Cleanse", false],
  ["defend-stronghold", "Defend Stronghold", false],
  ["display-of-might", "Display of Might", false],
  ["engage-on-all-fronts", "Engage on All Fronts", true],
  ["forward-position", "Forward Position", false],
  ["no-prisoners", "No Prisoners", false],
  ["outflank", "Outflank", false],
  ["overwhelming-force", "Overwhelming Force", false],
  ["plunder", "Plunder", false],
  ["secure-no-mans-land", "Secure No Man's Land", false]
];

export const SECONDARY_MISSION_CATALOG = Object.freeze(cardNames.map(([slug, name, fixedAvailable]) =>
  Object.freeze({
    id: "secondary-" + slug,
    name,
    category: "secondary",
    fixedAvailable,
    availableModes: Object.freeze(fixedAvailable ? ["fixed", "tactical"] : ["tactical"]),
    rulesConfigured: false,
    conditions: Object.freeze([])
  })
));
