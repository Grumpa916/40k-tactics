// Tyranid detachment stratagem summaries referenced against 40K.app.
// Effects are concise paraphrases; per-detachment status reflects catalog coverage.
const ALL_PHASES = Object.freeze(["command", "movement", "shooting", "charge", "fight", "end"]);
const source = (slug) => Object.freeze({
  sourceName: "40K.app",
  sourceUrl: "https://www.40k.app/factions/tyranids/detachments/" + slug,
  reviewedAt: "2026-10-23",
  version: "11th edition reference"
});
const entry = (name, cpCost, category, timing, phases, description) => Object.freeze({
  name, cpCost, category, timing,
  phases: phases === "all" ? ALL_PHASES : Object.freeze(phases),
  description
});
const catalog = (slug, stratagems) => Object.freeze({
  status: "complete",
  ...source(slug),
  stratagems: Object.freeze(stratagems)
});

export const TYRANID_DETACHMENT_STRATAGEM_DATA = Object.freeze({
  "Ambush Predators": catalog("ambush-predators", [
    entry("Hypersensory Adaptations", 1, "Strategic Ploy", "Start of your Shooting phase", ["shooting"], "Choose a visible enemy unit within 12 inches of an eligible Vanguard organism; its detection range increases by 6 inches."),
    entry("Counterpredation", 1, "Battle Tactic", "Fight phase, when an eligible Vanguard organism is selected to fight", ["fight"], "Attacks by the selected unit against a hidden target gain +1 Strength and +1 AP."),
    entry("Scanner Gheist", 1, "Strategic Ploy", "End of your opponent's Fight phase", ["fight"], "Place an unengaged Deathleaper, Lictor, or Neurolictor unit into Strategic Reserves.")
  ]),
  "Assimilation Swarm": catalog("assimilation-swarm", [
    entry("Broodguard Impulse", 1, "Epic Deed", "Any phase, when a Harvester unit is destroyed", "all", "Until battle end, Tyranids attacks against the enemy unit that destroyed it gain +1 to wound."),
    entry("Reclaim Biomass", 1, "Strategic Ploy", "Any phase, when a Tyranids unit is destroyed before its last model is removed", "all", "Use a nearby Harvester to regenerate one friendly Tyranids unit within 6 inches of it."),
    entry("Tyrannoformed", 1, "Strategic Ploy", "Command phase", ["command"], "A Harvester on an objective you control keeps that objective under your control until the opponent has greater Level of Control at a phase end."),
    entry("Ablative Carapace", 2, "Epic Deed", "Opponent's Shooting or Fight phase, after targets are selected", ["shooting", "fight"], "The targeted Harvester gains Feel No Pain 5+, improved to 4+ while in range of an objective you control."),
    entry("Secure Biomass", 1, "Strategic Ploy", "Fight phase, before the unit fights", ["fight"], "The unit's melee weapons gain Lethal Hits; Harvester melee attacks also score Critical Hits on unmodified 5+."),
    entry("Rapacious Hunger", 1, "Battle Tactic", "Your Fight phase, after the unit destroys an enemy unit", ["fight"], "The unit immediately regenerates; a Harvester restoring wounds with this effect can regain up to 3.")
  ]),
  "Crusher Stampede": catalog("crusher-stampede", [
    entry("Corrosive Viscera", 1, "Strategic Ploy", "Opponent's Shooting or Fight phase, when a non-Flying Monster with Deadly Demise is destroyed", ["shooting", "fight"], "Resolve that Monster's Deadly Demise mortal wounds automatically instead of rolling."),
    entry("Rampaging Monstrosities", 1, "Battle Tactic", "Fight phase, before an eligible Monster unit fights", ["fight"], "The unit can re-roll its melee Hit rolls for the phase."),
    entry("Savage Roar", 1, "Battle Tactic", "Fight phase, after an enemy unit targets a Monster", ["fight"], "The enemy takes a Battle-shock test and suffers -1 to Hit when attacking that Monster; if the test fails, it also suffers -1 to wound."),
    entry("Untrammelled Ferocity", 1, "Strategic Ploy", "Your Movement phase, before an eligible Monster moves", ["movement"], "The Monster can move through non-TITANIC models and terrain up to 4 inches high; it may also cross taller terrain at risk of Battle-shock. It can pass through Engagement Range but cannot finish there."),
    entry("Swarm-guided Salvoes", 1, "Battle Tactic", "Your Shooting phase, before an eligible Monster shoots", ["shooting"], "Its ranged weapons gain Ignores Cover, and its attacks can ignore modifiers to Ballistic Skill and Hit rolls."),
    entry("Massive Impact", 1, "Epic Deed", "Your Charge phase, after a Monster ends a Charge move", ["charge"], "Choose an enemy unit in Engagement Range; roll six D6 and inflict one mortal wound for each 4+.")
  ]),
  "Invasion Fleet": catalog("invasion-fleet", [
    entry("Rapid Regeneration", 1, "Battle Tactic", "Opponent's Shooting or Fight phase, after targets are selected", ["shooting", "fight"], "The targeted Tyranids unit gains Feel No Pain 6+, or 5+ while within Synapse Range."),
    entry("Adrenal Surge", 2, "Battle Tactic", "Fight phase", ["fight"], "Eligible Tyranids units gain Critical Hits on unmodified Hit rolls of 5+ for the phase."),
    entry("Death Frenzy", 1, "Strategic Ploy", "Fight phase, after an enemy unit targets a Tyranids unit", ["fight"], "A model destroyed before fighting can, on a 4+, fight after the attacking unit finishes, then be removed."),
    entry("Overrun", 1, "Strategic Ploy", "Fight phase, just before a Tyranids unit Consolidates", ["fight"], "The unit can consolidate 3 inches farther while ending in Engagement Range; a Synapse-range unit not engaged can make a Normal move up to 6 inches instead."),
    entry("Predatory Imperative", 1, "Strategic Ploy", "Your Command phase", ["command"], "Select a Hyper-adaptation for eligible units until your next Command phase; it must differ from the one chosen at battle start."),
    entry("Endless Swarm", 1, "Strategic Ploy", "Your Command phase", ["command"], "Return up to D3+3 destroyed models to each selected Endless Multitude unit.")
  ]),
  "Subterranean Assault": catalog("subterranean-assault", [
    entry("Adaptive Optimisation", 1, "Wargear", "Command phase", ["command"], "A Mawloc or Trygon gains the Synapse keyword until the start of your next Command phase."),
    entry("Replenishing Swarms", 1, "Wargear", "Your Movement phase", ["movement"], "A unit near a Tunnel Marker restores up to D3+1 wounds to one model or returns up to D3+1 destroyed one-wound models."),
    entry("Enfilading Emergence", 1, "Strategic Ploy", "End of your Movement phase, for a unit arriving from Reserves this turn", ["movement"], "The unit's weapons gain Sustained Hits 1 and Ignores Cover until the end of your next Fight phase."),
    entry("Tunnel Network", 1, "Strategic Ploy", "End of your Movement phase", ["movement"], "Relocate an eligible unit between your Tunnel Markers, setting it up more than 6 inches from enemies."),
    entry("Swarming Assault", 1, "Strategic Ploy", "Your Charge phase, for a Monster arriving from Reserves this turn", ["charge"], "Friendly Tyranids units within 6 inches of it can re-roll Charge rolls for the phase."),
    entry("Retreat Below", 1, "Strategic Ploy", "End of your opponent's Fight phase", ["fight"], "Move an unengaged Tyranids unit, or up to two eligible Burrowers, into Strategic Reserves.")
  ]),
  "Synaptic Nexus": catalog("synaptic-nexus", [
    entry("The Smothering Shadow", 1, "Strategic Ploy", "Any phase, after an enemy unit fails a Battle-shock test", "all", "A Synapse unit within 12 inches can trigger six D6 rolls; each 3+ inflicts one mortal wound on that enemy."),
    entry("Synaptic Channelling", 1, "Battle Tactic", "Command phase", ["command"], "Until turn end, Tyranids units within 9 inches of the selected Synapse unit count as within Synapse Range."),
    entry("Irresistible Will", 1, "Battle Tactic", "Your Shooting or Fight phase", ["shooting", "fight"], "Choose a visible enemy within 24 inches of an unactivated Synapse unit; nearby Tyranids attacks against it re-roll Hit and Wound rolls of 1."),
    entry("Reinforced Hive Node", 1, "Battle Tactic", "Opponent's Shooting or Fight phase, after targets are selected", ["shooting", "fight"], "Attacks against the selected Synapse unit have their AP worsened by 1 for the attack sequence."),
    entry("Imperative Dominance", 1, "Strategic Ploy", "Your Command phase", ["command"], "Choose any Synaptic Imperative; until your next Command phase it applies to the selected unit instead of the army's currently active imperative."),
    entry("Override Instincts", 1, "Strategic Ploy", "Your Movement phase, after a unit in Synapse Range Falls Back", ["movement"], "The unit remains eligible to shoot and declare a charge this turn.")
  ]),
  "Talons of the Norn Queen": catalog("talons-of-the-norn-queen", [
    entry("Catalytic Biofortification", 1, "Strategic Ploy", "Any phase, when a Norn Assimilator suffers a mortal wound", "all", "That Norn gains Feel No Pain 4+ against mortal wounds."),
    entry("Lesser Prey", 1, "Battle Tactic", "Fight phase, when a Norn Assimilator or Norn Emissary is selected to fight", ["fight"], "The selected Norn's melee attacks gain +2 Strength for the phase."),
    entry("Tanglestrike Rounds", 1, "Strategic Ploy", "Your Shooting phase, after a Norn Assimilator shoots", ["shooting"], "Choose an enemy unit hit by its attacks; until your next Command phase it is tethered and has -2 inches Move.")
  ]),
  "Unending Swarm": catalog("unending-swarm", [
    entry("Synaptic Goading", 1, "Strategic Ploy", "Any phase, just before a Synapse-range Endless Multitude unit makes a Surge move", "all", "Re-roll the Surge distance and move as close as possible to the nearest objective instead of the nearest enemy."),
    entry("Unending Waves", 2, "Strategic Ploy", "Any phase, when an Endless Multitude unit is destroyed", "all", "Once per battle, add an identical unit at Starting Strength to Strategic Reserves; destroyed attached Characters are not returned."),
    entry("Teeming Masses", 1, "Battle Tactic", "Opponent's Shooting or Fight phase, after targets are selected", ["shooting", "fight"], "Attacks against the targeted Endless Multitude unit suffer -1 to Hit for the phase."),
    entry("Swarming Masses", 1, "Battle Tactic", "Your Shooting or Fight phase, before an Endless Multitude unit acts", ["shooting", "fight"], "Its weapons gain Sustained Hits 1; at 15+ models, unmodified Hit rolls of 5+ are Critical Hits."),
    entry("Bounding Advance", 1, "Battle Tactic", "Your Movement phase", ["movement"], "When the unit Advances, replace the roll with a fixed +6 inches to Move."),
    entry("Preservation Imperative", 1, "Strategic Ploy", "Opponent's Shooting phase, after targets are selected", ["shooting"], "For Blast targeting, the selected Endless Multitude unit counts as having fewer than five models.")
  ]),
  "Vanguard Onslaught": catalog("vanguard-onslaught", [
    entry("Surprise Assault", 1, "Battle Tactic", "Your Shooting or Fight phase, after a Vanguard Invader unit selects targets", ["shooting", "fight"], "Choose one enemy targeted by the unit's attacks to take a Battle-shock test; until phase end, the unit's attacks against that enemy gain +1 to Hit and, if the test fails, +1 to Wound."),
    entry("Assassin Beasts", 1, "Battle Tactic", "Fight phase, before an unactivated Vanguard Invader Infantry unit fights", ["fight"], "The unit's melee weapons gain Precision for the phase."),
    entry("Seeded Broods", 1, "Strategic Ploy", "Your Movement phase", ["movement"], "Selected reserve units count the battle round as one higher when determining if they can arrive."),
    entry("Hypersensory Scillia", 2, "Strategic Ploy", "Opponent's Movement phase, after an enemy ends a Normal, Advance, or Fall Back move", ["movement"], "Nearby eligible units can make a Normal move up to 6 inches; they cannot be engaged."),
    entry("Unseen Lurkers", 1, "Strategic Ploy", "Opponent's Shooting phase, after targets are selected", ["shooting"], "The selected Vanguard unit can only be targeted by ranged attacks from within 18 inches, or 6 inches if it has Lone Operative."),
    entry("Invisible Hunter", 1, "Strategic Ploy", "End of your opponent's Fight phase", ["fight"], "Move up to two eligible Vanguard units, or one other Tyranids Infantry unit, into Strategic Reserves if more than 3 inches from enemies.")
  ]),
  "Warrior Bioform Onslaught": catalog("warrior-bioform-onslaught", [
    entry("Alien Physiology", 1, "Battle Tactic", "Opponent's Shooting or Fight phase, when Tyranid Warriors are targeted", ["shooting", "fight"], "Attacks with Strength greater than the Warriors' Toughness suffer -1 to Wound."),
    entry("Parasitic Payload", 1, "Battle Tactic", "Your Shooting phase, when a Tyranid Warriors unit is selected to shoot", ["shooting"], "The unit's ranged attacks gain Ignores Cover."),
    entry("Synaptic Micronodes", 1, "Strategic Ploy", "End of your Movement phase", ["movement"], "An objective controlled by the selected Warriors unit becomes secured.")
  ])
});
