/**
 * 11th-edition Chapter Approved 2026–27 secondary mission catalog.
 *
 * The full catalog is not yet a verified rules transcription. Only cards with
 * per-card rulesVerified=true have scoring-window metadata transcribed from the
 * official GW sample card images linked below. Other cards remain names-only.
 * Scoring is always a manual, player-confirmed action; this metadata never awards VP.
 */
export const SECONDARY_MISSION_CATALOG_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  catalogScope: "partial-rules-reference",
  rulesVerified: false,
  candidateDatasetVersion: "2026.08.25-primary-timing-audit",
  candidateDatasetUrl: "https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/main/datasets/wh40k-11e-missions.json",
  officialSampleCardImages: Object.freeze([
    "https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards1-s8wf8ybsuf.jpg",
    "https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards2-myplj4vtwi.jpg"
  ])
});

const unverified = Object.freeze({ rulesVerified: false, scoringWindows: Object.freeze([]) });

const cardNames = [
  ["a-grievous-blow", "A Grievous Blow", true],
  ["a-tempting-target", "A Tempting Target", false],
  ["assassination", "Assassination", true, {
    rulesVerified: true,
    scoringWindows: [
      {
        id: "fixed-turn",
        timing: "end-of-turn",
        timingLabel: "End of either player's turn",
        modes: ["fixed"],
        tiers: [
          { vp: 3, summary: "Each enemy CHARACTER model destroyed this turn." },
          { vp: 1, summary: "Additional VP for each destroyed CHARACTER model with 4+ Wounds; cumulative." }
        ],
        source: "official-gw-sample-card"
      },
      {
        id: "fixed-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn",
        modes: ["fixed"],
        tiers: [
          { vp: 3, summary: "Each enemy CHARACTER model destroyed during that turn." },
          { vp: 1, summary: "Additional VP for each destroyed CHARACTER model with 4+ Wounds; cumulative." }
        ],
        source: "official-gw-sample-card"
      },
      {
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of either player's turn",
        modes: ["tactical"],
        tiers: [
          { vp: 5, summary: "One or more enemy CHARACTER models destroyed this turn, or all enemy CHARACTER models have been destroyed during the battle." }
        ],
        source: "official-gw-sample-card"
      },
      {
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn",
        modes: ["tactical"],
        tiers: [
          { vp: 5, summary: "One or more enemy CHARACTER models destroyed this turn, or all enemy CHARACTER models have been destroyed during the battle." }
        ],
        source: "official-gw-sample-card"
      }
    ]
  }],
  ["beacon", "Beacon", false],
  ["behind-enemy-lines", "Behind Enemy Lines", false],
  ["bring-it-down", "Bring it Down", true],
  ["burden-of-trust", "Burden of Trust", false],
  ["centre-ground", "Centre Ground", false, {
    rulesVerified: true,
    scoringWindows: [{
      id: "tactical-turn",
      timing: "end-of-turn",
      timingLabel: "End of your turn",
      modes: ["tactical"],
      tiers: [
        { vp: 3, summary: "At least one eligible friendly unit within 3 inches of the battlefield centre, with no enemy units within 3 inches of centre." },
        { vp: 5, summary: "At least one eligible friendly unit within 3 inches of the battlefield centre, with no enemy units within 6 inches of centre." }
      ],
      source: "official-gw-sample-card"
    }]
  }],
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

export const SECONDARY_MISSION_CATALOG = Object.freeze(cardNames.map(([slug, name, fixedAvailable, rules = unverified]) =>
  Object.freeze({
    id: "secondary-" + slug,
    name,
    category: "secondary",
    fixedAvailable,
    availableModes: Object.freeze(fixedAvailable ? ["fixed", "tactical"] : ["tactical"]),
    rulesVerified: rules.rulesVerified,
    scoringWindows: Object.freeze(rules.scoringWindows.map((window) =>
      Object.freeze({
        ...window,
        modes: Object.freeze([...window.modes]),
        tiers: Object.freeze(window.tiers.map((tier) => Object.freeze({ ...tier })))
      })
    )),
    conditions: Object.freeze([])
  })
));
