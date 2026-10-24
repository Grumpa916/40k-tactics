// Space Marines faction metadata from the current official Faction Pack.
// Rules text is intentionally summarized here; combat-facing implementation
// remains a separate, reviewed step.
export const SPACE_MARINES_RULES_SOURCE = Object.freeze({
  sourceName: "Games Workshop Space Marines Faction Pack",
  sourceUrl: "https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf",
  reviewedAt: "2026-10-24",
  version: "current official faction pack"
});

export const SPACE_MARINES_ARMY_RULES = Object.freeze({
  name: "Oath of Moment",
  timing: "Start of your Command phase",
  effect: "Select one enemy unit as your Oath of Moment target until the start of your next Command phase. Adeptus Astartes attacks targeting it can re-roll Hit rolls; the Codex: Space Marines bonus also improves Wound rolls when the army has no Blood Angels, Dark Angels, Deathwatch or Space Wolves units.",
  implementationStatus: "reference-only",
  source: SPACE_MARINES_RULES_SOURCE
});

export const ARMOURED_SPEARTIP_STRATAGEMS = Object.freeze([
  Object.freeze({
    name: "Machine Wrath", cpCost: 1, category: "Epic Deed",
    timing: "Any phase, after a Heavy Transport with Deadly Demise is destroyed and you roll a 6 for Deadly Demise",
    phases: Object.freeze(["command", "movement", "shooting", "charge", "fight", "end"]),
    description: "The destroyed Heavy Transport can make a Normal or Fall Back move before resolving Deadly Demise and Emergency Disembarkation; special passage and Desperate Escape rules apply."
  }),
  Object.freeze({
    name: "Ceramite Sledgehammer", cpCost: 1, category: "Strategic Ploy",
    timing: "Your Movement phase, after selecting an Adeptus Astartes Transport that has not moved",
    phases: Object.freeze(["movement"]),
    description: "Until the phase ends, the Transport can move through terrain features; a Heavy Transport can also pass through non-Monster, non-Vehicle enemy models and Engagement Range, but cannot end there. Desperate Escape rules apply."
  }),
  Object.freeze({
    name: "Armour of Contempt", cpCost: 1, category: "Strategic Ploy",
    timing: "Opponent's Shooting or Fight phase, after an enemy unit selects its targets",
    phases: Object.freeze(["shooting", "fight"]),
    description: "Choose the targeted Adeptus Astartes unit; until the phase ends, worsen the Armour Penetration of attacks targeting it by 1."
  }),
  Object.freeze({
    name: "Advanced Deployment", cpCost: 1, category: "Strategic Ploy",
    timing: "Your Movement phase, after selecting an Adeptus Astartes Transport that has not moved",
    phases: Object.freeze(["movement"]),
    description: "The selected Transport can Advance and still allow its passengers to disembark. Disembarking units count as having made a Normal move and cannot charge unless the Transport has Assault Ramp."
  }),
  Object.freeze({
    name: "Rapid Embarkation", cpCost: 1, category: "Wargear",
    timing: "End of the Fight phase",
    phases: Object.freeze(["fight"]),
    description: "An Adeptus Astartes Infantry unit not within Engagement Range can embark in an eligible Heavy Transport if it is wholly within 6 inches."
  }),
  Object.freeze({
    name: "Purgation Doctrine", cpCost: 1, category: "Battle Tactic",
    timing: "Your Shooting phase, before an Adeptus Astartes unit shoots",
    phases: Object.freeze(["shooting"]),
    description: "A unit that has not shot gains +1 to Hit for its ranged attacks this phase; if it disembarked from a Heavy Transport this turn, those attacks also gain +1 to Wound."
  })
]);

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
  name, forceDisposition, detachmentPoints,
  stratagemCatalogStatus: name === "Armoured Speartip" ? "complete" : "not-imported",
  ...(name === "Armoured Speartip" ? { stratagems: ARMOURED_SPEARTIP_STRATAGEMS } : {}),
  source: SPACE_MARINES_RULES_SOURCE
})));

export const SPACE_MARINES_RULES_DATA = Object.freeze({
  faction: "Space Marines", edition: "11th", source: SPACE_MARINES_RULES_SOURCE,
  armyRules: Object.freeze([SPACE_MARINES_ARMY_RULES]), detachments: SPACE_MARINES_DETACHMENTS
});
