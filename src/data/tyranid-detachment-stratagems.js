// Verified Tyranid detachment stratagem summaries.
// Source text is paraphrased. Coverage status is explicit so an incomplete
// catalog is never presented as a complete detachment reference.
export const TYRANID_DETACHMENT_STRATAGEM_DATA = Object.freeze({
  "Talons of the Norn Queen": Object.freeze({
    status: "partial",
    sourceName: "Games Workshop Tyranids Faction Pack",
    sourceUrl: "https://assets.warhammer-community.com/eng_14-10_wh40k_faction_pack_tyranids-an12izciwp-np2hnkcsje.pdf",
    reviewedAt: "2026-10-24",
    version: "Faction Pack v1.3",
    stratagems: Object.freeze([
      Object.freeze({
        name: "Catalytic Biofortification",
        cpCost: 1,
        category: "Strategic Ploy",
        timing: "Any phase, when a friendly Norn Assimilator suffers a mortal wound",
        phases: Object.freeze(["command", "movement", "shooting", "charge", "fight", "end"]),
        description: "The Norn Assimilator gains Feel No Pain 4+ against mortal wounds."
      }),
      Object.freeze({
        name: "Lesser Prey",
        cpCost: 1,
        category: "Battle Tactic",
        timing: "Fight phase, when a friendly Norn Assimilator or Norn Emissary is selected to fight",
        phases: Object.freeze(["fight"]),
        description: "The selected unit's melee attacks gain +2 Strength for the phase."
      }),
      Object.freeze({
        name: "Tanglestrike Rounds",
        cpCost: 1,
        category: "Strategic Ploy",
        timing: "Your Shooting phase, after a friendly Norn Assimilator has shot",
        phases: Object.freeze(["shooting"]),
        description: "Choose one enemy unit hit by those attacks; it is tethered until the start of your next Command phase and has -2 inches Move while tethered."
      })
    ])
  })
});
