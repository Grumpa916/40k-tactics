// Space Marines faction metadata from the current official Faction Pack.
// Rules text is intentionally summarized here; combat-facing implementation
// remains a separate, reviewed step.
export const SPACE_MARINES_RULES_SOURCE = Object.freeze({
  sourceName: "Games Workshop Space Marines Faction Pack",
  sourceUrl: "https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf",
  reviewedAt: "2026-10-23",
  version: "current official faction pack"
});

export const SPACE_MARINES_ARMY_RULES = Object.freeze({
  name: "Oath of Moment",
  timing: "Start of your Command phase",
  effect: "Select one enemy unit as your Oath of Moment target until the start of your next Command phase. Adeptus Astartes attacks targeting it can re-roll Hit rolls; the Codex: Space Marines bonus also improves Wound rolls when the army has no Blood Angels, Dark Angels, Deathwatch or Space Wolves units.",
  implementationStatus: "reference-only",
  source: SPACE_MARINES_RULES_SOURCE
});

export const SPACE_MARINES_DETACHMENTS = Object.freeze([
  ["Fulguris Task Force", "Disruption", 1], ["Librarius Conclave", "Reconnaissance", 1],
  ["Subversion Assets", "Reconnaissance", 1], ["1st Company Task Force", "Priority Assets", 2],
  ["Anvil Siege Force", "Take and Hold", 2], ["Armoured Speartip", "Take and Hold", 3],
  ["Bastion Task Force", "Take and Hold", 2], ["Blade of Ultramar", "Priority Assets", 3],
  ["Ceramite Sentinels", "Take and Hold", 3], ["Emperor's Shield", "Priority Assets", 2],
  ["Firestorm Assault Force", "Purge the Foe", 2], ["Forgefather's Seekers", "Purge the Foe", 2],
  ["Gladius Task Force", "Priority Assets", 3], ["Hammer of Avernii", "Priority Assets", 2],
  ["Headhunter Task Force", "Priority Assets", 2], ["Ironstorm Spearhead", "Purge the Foe", 2],
  ["Orbital Assault Force", "Take and Hold", 2], ["Reclamation Force", "Take and Hold", 2],
  ["Shadowmark Talon", "Disruption", 2], ["Spearpoint Task Force", "Disruption", 2],
  ["Stormlance Task Force", "Disruption", 3], ["Vanguard Spearhead", "Reconnaissance", 2]
].map(([name, forceDisposition, detachmentPoints]) => Object.freeze({
  name, forceDisposition, detachmentPoints, source: SPACE_MARINES_RULES_SOURCE
})));

export const SPACE_MARINES_RULES_DATA = Object.freeze({
  faction: "Space Marines", edition: "11th", source: SPACE_MARINES_RULES_SOURCE,
  armyRules: Object.freeze([SPACE_MARINES_ARMY_RULES]), detachments: SPACE_MARINES_DETACHMENTS
});

