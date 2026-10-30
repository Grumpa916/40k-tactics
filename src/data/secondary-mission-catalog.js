/**
 * 11th-edition Chapter Approved 2026–27 secondary mission catalog.
 *
 * All 18 cards' printed rules and scoring windows have been checked against
 * the complete card text supplied by the user. The catalog records reminders
 * and checkpoints; it never awards VP automatically.
 */
export const SECONDARY_MISSION_CATALOG_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  catalogScope: "all-18-user-supplied-card-texts",
  rulesVerified: true,
  userSuppliedCardTextCount: 18,
  candidateDatasetVersion: "2026.10.02-triangulation-action",
  candidateDatasetUrl: "https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/6f61cb3796f79348b81389ec0eb32d461b675d02/datasets/wh40k-11e-missions.json",
  crossCheckSources: Object.freeze([
    "https://gdmissions.app/11th/secondary-missions",
    "https://gdmissions.app/version-history",
    "https://www.11th.help/secondary_missions.html",
    "https://wahapedia.ru/wh40k11ed/the-rules/warhammer-event-companion/"
  ]),
  crossCheckStatus: "all-18-card-texts-reviewed-from-user-supplied-transcription",
  officialSampleCardImages: Object.freeze([
    "https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards1-s8wf8ybsuf.jpg",
    "https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards2-myplj4vtwi.jpg"
  ]),
  officialSupportingReferences: Object.freeze([
    "https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf"
  ])
});

const VERIFIED_WINDOW_SOURCE = "user-provided-card-text";
const unverified = Object.freeze({ rulesVerified: false, scoringWindows: Object.freeze([]) });

function windowDefinition({ id, timing, timingLabel, modes, tiers, minRound = null }) {
  return {
    id,
    timing,
    timingLabel,
    modes,
    tiers,
    source: VERIFIED_WINDOW_SOURCE,
    ...(minRound === null ? {} : { minRound })
  };
}

function eitherTurnWindows(idPrefix, modes, tiers) {
  return [
    windowDefinition({
      id: idPrefix + "-turn",
      timing: "end-of-turn",
      timingLabel: "End of either player's turn",
      modes,
      tiers
    }),
    windowDefinition({
      id: idPrefix + "-opponent-turn",
      timing: "end-of-opponent-turn",
      timingLabel: "End of opponent's turn",
      modes,
      tiers
    })
  ];
}

/*
 * Card scoring windows and card-specific rules below are transcribed from the
 * complete card text supplied for all 18 secondary missions.
 */
const verifiedRules = Object.freeze({
  "a-grievous-blow": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: if no enemy units with Starting Strength 13+ are on the battlefield, the card may be discarded and replaced.",
      "The supplied card text confirms Fixed scores 4 VP per qualifying unit (up to 5 VP) and Tactical scores 5 VP (up to 5 VP)."
    ],
    scoringWindows: [
      ...eitherTurnWindows("fixed", ["fixed"], [
        { vp: 4, maxVP: 5, summary: "For each enemy unit with Starting Strength 13+ destroyed this turn." }
      ]),
      ...eitherTurnWindows("tactical", ["tactical"], [
        { vp: 5, summary: "One or more enemy units with Starting Strength 13+ were destroyed this turn." }
      ])
    ]
  },
  "a-tempting-target": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: the opponent selects one objective in No Man's Land, excluding home objectives, as the tempting target."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 5, summary: "You control your tempting target." }]
      })
    ]
  },
  beacon: {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: select one friendly unit on the battlefield or embarked within a TRANSPORT on the battlefield as the beacon unit.",
      "Official Warhammer Event Companion v1.2 FAQ: if the selected Beacon unit is destroyed before the mission is achieved, you cannot select a replacement Beacon unit. This FAQ does not verify the full card text or scoring windows."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn or end of fifth battle round (whichever comes first)",
        modes: ["tactical"],
        tiers: [
          { vp: 3, relationship: "or", condition: { type: "beacon-outside-deployment-zone" }, summary: "The beacon unit is on the battlefield and not within your deployment zone." },
          { vp: 5, relationship: "or", condition: { type: "beacon-outside-territory" }, summary: "The beacon unit is on the battlefield and not within your territory." }
        ]
      })
    ]
  },
  "behind-enemy-lines": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode during the first battle round: may draw a replacement and shuffle this card back into the deck."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 3, maxVP: 5, summary: "For each friendly unit, excluding AIRCRAFT and Battle-shocked units, wholly within the opponent's deployment zone." }]
      })
    ]
  },
  "bring-it-down": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: if no enemy models with 10+ Wounds are on the battlefield, the card may be discarded and replaced.",
      "The supplied card text confirms Fixed scores 4 VP per qualifying model (up to 5 VP) and Tactical scores 5 VP (up to 5 VP)."
    ],
    scoringWindows: [
      ...eitherTurnWindows("fixed", ["fixed"], [
        { vp: 4, maxVP: 5, summary: "For each enemy model with 10+ Wounds destroyed this turn." }
      ]),
      ...eitherTurnWindows("tactical", ["tactical"], [
        { vp: 5, summary: "One or more enemy models with 10+ Wounds were destroyed this turn." }
      ])
    ]
  },
  "burden-of-trust": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn / start of your turn: for each objective, you may select one friendly unit on the battlefield to guard it until the start of your next turn, while the unit remains in range and you control the objective."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn or end of fifth battle round (whichever comes first)",
        modes: ["tactical"],
        tiers: [{ vp: 2, maxVP: 5, summary: "For each objective guarded by your army." }]
      })
    ]
  },
  cleanse: {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: if Plunder is active, may draw a replacement and shuffle this card back into the deck.",
      "Cleanse action: starts in your Shooting phase; one friendly unit within range of one objective (excluding your home objective) starts each action, and each unit must start at a different objective. It completes at end of your turn if the unit is still controlling that objective."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [
          { vp: 2, relationship: "or", summary: "One objective was cleansed by your army this turn." },
          { vp: 5, relationship: "or", summary: "Two or more objectives were cleansed by your army this turn." }
        ]
      })
    ]
  },
  "defend-stronghold": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode during the first battle round: draw a replacement and shuffle this card back into the deck.",
      "Available from the second battle round onwards."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn or end of fifth battle round (whichever comes first)",
        modes: ["tactical"],
        minRound: 2,
        tiers: [
          { vp: 3, summary: "You control your home objective." },
          { vp: 2, relationship: "cumulative", summary: "No enemy units are within your deployment zone; cumulative with the 3 VP condition." }
        ]
      })
    ]
  },
  "display-of-might": {
    rulesVerified: true,
    referenceNotes: [
      "Eligible units exclude AIRCRAFT and Battle-shocked units."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 2, summary: "More eligible friendly units than enemy units are wholly within No Man's Land." }]
      }),
      windowDefinition({
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn",
        modes: ["tactical"],
        tiers: [{ vp: 5, summary: "More eligible friendly units than enemy units are wholly within No Man's Land." }]
      })
    ]
  },
  "engage-on-all-fronts": {
    rulesVerified: true,
    referenceNotes: [
      "Presence in a table quarter requires one or more friendly units wholly within it and not within 6 inches of the battlefield centre; excludes AIRCRAFT and Battle-shocked units.",
      "The 3-quarter and 4-quarter scoring tiers are mutually exclusive."
    ],
    scoringWindows: [
      windowDefinition({
        id: "fixed-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["fixed"],
        tiers: [
          { vp: 2, relationship: "or", summary: "You have a presence in three table quarters." },
          { vp: 4, relationship: "or", summary: "You have a presence in four table quarters." }
        ]
      }),
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [
          { vp: 3, relationship: "or", summary: "You have a presence in three table quarters." },
          { vp: 5, relationship: "or", summary: "You have a presence in four table quarters." }
        ]
      })
    ]
  },
  "forward-position": {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode during the first battle round: may draw a replacement and shuffle this card back into the deck."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 5, summary: "You control your opponent's home objective and/or each expansion objective." }]
      })
    ]
  },
  "no-prisoners": {
    rulesVerified: true,
    referenceNotes: [],
    scoringWindows: [
      ...eitherTurnWindows("tactical", ["tactical"], [
        { vp: 2, maxVP: 5, summary: "For each enemy unit destroyed this turn." }
      ])
    ]
  },
  outflank: {
    rulesVerified: true,
    referenceNotes: [
      "Opposite battlefield edges are those parallel to each other.",
      "Eligible units exclude AIRCRAFT and Battle-shocked units."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [
          { vp: 3, relationship: "or", summary: "One or more eligible friendly units are within 6 inches of one or more battlefield edges and not within your territory." },
          { vp: 5, relationship: "or", summary: "Two or more eligible friendly units are within 6 inches of opposite battlefield edges and one or more of those units is not within your territory." }
        ]
      })
    ]
  },
  "overwhelming-force": {
    rulesVerified: true,
    referenceNotes: [],
    scoringWindows: [
      ...eitherTurnWindows("tactical", ["tactical"], [
        { vp: 3, maxVP: 5, summary: "For each enemy unit that started the turn within range of one or more objectives and was destroyed." }
      ])
    ]
  },
  plunder: {
    rulesVerified: true,
    referenceNotes: [
      "When drawn in Tactical mode: if Cleanse is active, may draw a replacement and shuffle this card back into the deck.",
      "Plunder action is started in your Shooting phase and completes immediately. Official Warhammer Event Companion v1.2 FAQ clarifies that 'not within your territory' refers to the terrain area, not the unit. This FAQ does not verify the full card text or scoring window."
    ],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 5, summary: "A terrain area was plundered this turn." }]
      })
    ]
  },
  "secure-no-mans-land": {
    rulesVerified: true,
    referenceNotes: [],
    scoringWindows: [
      windowDefinition({
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of your turn",
        modes: ["tactical"],
        tiers: [{ vp: 5, summary: "You control two or more objectives within No Man's Land, excluding your home objective." }]
      })
    ]
  }
});

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
        source: "user-provided-card-text"
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
        source: "user-provided-card-text"
      },
      {
        id: "tactical-turn",
        timing: "end-of-turn",
        timingLabel: "End of either player's turn",
        modes: ["tactical"],
        tiers: [
          { vp: 5, summary: "One or more enemy CHARACTER models destroyed this turn, or all enemy CHARACTER models have been destroyed during the battle." }
        ],
        source: "user-provided-card-text"
      },
      {
        id: "tactical-opponent-turn",
        timing: "end-of-opponent-turn",
        timingLabel: "End of opponent's turn",
        modes: ["tactical"],
        tiers: [
          { vp: 5, summary: "One or more enemy CHARACTER models destroyed during that turn, or all enemy CHARACTER models have been destroyed during the battle." }
        ],
        source: "user-provided-card-text"
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
        { vp: 3, summary: "At least one friendly unit (excluding AIRCRAFT and Battle-shocked units) within 3 inches of the battlefield centre, with no enemy units within 3 inches of centre." },
        { vp: 5, summary: "At least one friendly unit (excluding AIRCRAFT and Battle-shocked units) within 3 inches of the battlefield centre, with no enemy units within 6 inches of centre." }
      ],
      source: "user-provided-card-text"
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

export const SECONDARY_MISSION_CATALOG = Object.freeze(cardNames.map(([slug, name, fixedAvailable, rules]) => {
  const resolvedRules = rules ?? {
    rulesVerified: false,
    referenceNotes: verifiedRules[slug]?.referenceNotes ?? [],
    scoringWindows: verifiedRules[slug]?.scoringWindows ?? unverified.scoringWindows
  };
  return Object.freeze({
    id: "secondary-" + slug,
    name,
    category: "secondary",
    fixedAvailable,
    availableModes: Object.freeze(fixedAvailable ? ["fixed", "tactical"] : ["tactical"]),
    rulesVerified: resolvedRules.rulesVerified,
    referenceNotes: Object.freeze([...(resolvedRules.referenceNotes ?? [])]),
    scoringWindows: Object.freeze(resolvedRules.scoringWindows.map((window) =>
      Object.freeze({
        ...window,
        modes: Object.freeze([...window.modes]),
        tiers: Object.freeze(window.tiers.map((tier) => Object.freeze({ ...tier })))
      })
    )),
    conditions: Object.freeze([])
  });
}));

