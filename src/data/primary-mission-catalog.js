export const PRIMARY_MISSION_CATALOG_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  datasetVersion: "2026.10.02-triangulation-action",
  datasetUrl: "https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/main/datasets/wh40k-11e-missions.json",
  provenance: "Community-derived structured reference cross-checked against the Warhammer Event Companion. Scoring remains player-confirmed."
});

export const PRIMARY_FORCE_DISPOSITIONS = Object.freeze([
  "Take and Hold", "Purge the Foe", "Disruption", "Reconnaissance", "Priority Assets"
]);

const s = (when, items) => Object.freeze({ when, items: Object.freeze(items.map((item) => Object.freeze(item))) });
const m = (id, name, scoring, extra = {}) => Object.freeze({
  id: "primary-" + id,
  name,
  category: "primary",
  rulesVerified: false,
  scoring: Object.freeze(scoring),
  manualConfirmationRequired: true,
  ...extra
});

export const PRIMARY_MISSION_MATRIX = Object.freeze({
  "Take and Hold": Object.freeze({
    "Take and Hold": m("battlefield-dominance", "Battlefield Dominance", [
      s("R1–2 end of your turn", [{ vp: 2, summary: "Control more objectives than your opponent." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 3, summary: "Per objective controlled." }, { vp: 2, bonus: true, summary: "Additional VP per non-home objective while you also control your home objective." }])
    ]),
    "Purge the Foe": m("immovable-object", "Immovable Object", [
      s("End of your turn", [{ vp: 3, summary: "Control at least one central objective." }]),
      s("R2–4 Command phase; R5 end of turn", [{ vp: 5, summary: "Per controlled objective other than your home objective." }])
    ]),
    "Disruption": m("determined-acquisition", "Determined Acquisition", [
      s("End of your turn", [{ vp: 2, summary: "Per non-home objective you control now but did not control at the start of the turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 3, summary: "Per objective controlled." }, { vp: 3, bonus: true, summary: "Additional VP for each such objective in enemy territory." }])
    ]),
    "Reconnaissance": m("purge-and-secure", "Purge and Secure", [
      s("End of your turn", [{ vp: 3, summary: "Destroy an enemy unit with an objective-related positioning condition." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Per controlled non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 3, summary: "Control at least one non-home objective you did not control at the start of the turn." }])
    ]),
    "Priority Assets": m("inescapable-dominion", "Inescapable Dominion", [
      s("End of your turn", [{ vp: 4, summary: "Control three or more objectives." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 5, summary: "Control two or more objectives." }, { vp: 4, summary: "Control more objectives than your opponent." }]),
      s("End of battle", [{ vp: 5, summary: "Control the opponent's home objective." }])
    ])
  }),
  "Purge the Foe": Object.freeze({
    "Take and Hold": m("unstoppable-force", "Unstoppable Force", [
      s("End of your turn", [{ vp: 3, summary: "Destroy at least one enemy unit this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Per controlled non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 3, summary: "Control a non-home objective you did not control at the start of the turn." }]),
      s("End of battle", [{ vp: 5, summary: "Control at least one central objective." }])
    ]),
    "Purge the Foe": m("meatgrinder", "Meatgrinder", [
      s("End of your turn", [{ vp: 3, summary: "Destroy at least one enemy unit this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control at least one non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 5, summary: "Destroy more enemy units this turn than friendly units lost last turn." }, { vp: 5, summary: "Control the opponent's home objective." }])
    ]),
    "Disruption": m("punishment", "Punishment", [
      s("End of either player's turn", [{ vp: 5, summary: "At least one condemned enemy unit left the battlefield this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 5, summary: "Control more objectives than your opponent." }]),
      s("End of battle", [{ vp: 8, summary: "Control the opponent's home objective." }])
    ], { setup: "At the start of your turn, identify 1–3 qualifying enemy units as condemned until your next turn." }),
    "Reconnaissance": m("consecrate", "Consecrate", [
      s("End of your turn", [{ vp: 3, summary: "One or two objectives have been consecrated." }, { vp: 6, summary: "Three or more objectives have been consecrated." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 4, summary: "Control more objectives than your opponent." }]),
      s("End of battle", [{ vp: 5, summary: "The enemy home objective has been consecrated." }])
    ], { setup: "Destroyed enemy units can enable consecration of nearby non-home objectives; track markers manually." }),
    "Priority Assets": m("destroyers-wrath", "Destroyer's Wrath", [
      s("End of your turn", [{ vp: 3, summary: "Destroy at least one enemy unit this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 6, summary: "Control more objectives than your opponent." }]),
      s("R2+ end of your turn", [{ vp: 4, summary: "Destroy more enemy units this turn than friendly units lost last turn." }])
    ])
  }),
  "Disruption": Object.freeze({
    "Take and Hold": m("death-trap", "Death Trap", [
      s("End of your turn", [{ vp: 2, summary: "Per terrain area trapped this turn." }, { vp: 3, bonus: true, summary: "Additional VP when a trapped terrain area contains an objective." }, { vp: 3, summary: "Destroy an enemy that began the turn in a trapped terrain area." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control at least one non-home objective." }])
    ], { action: Object.freeze({ id: "booby-trap", name: "Booby Trap", phase: "shooting", reviewTiming: "end-of-turn", summary: "A qualifying unit traps an objective area or eligible terrain area; place a marker." }) }),
    "Purge the Foe": m("delaying-action", "Delaying Action", [
      s("End of your turn", [{ vp: 2, summary: "Per enemy unit destroyed this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 3, summary: "Control at least one central objective and at least one expansion objective." }])
    ]),
    "Disruption": m("outmanoeuvre", "Outmanoeuvre", [
      s("End of your turn", [{ vp: 10, summary: "Control the enemy home objective." }]),
      s("R1 end of your turn", [{ vp: 4, summary: "Per controlled non-home objective." }]),
      s("R2–3 Command phase", [{ vp: 5, summary: "Per controlled non-home objective." }]),
      s("R4+ end of your turn", [{ vp: 6, summary: "Per controlled non-home objective." }])
    ]),
    "Reconnaissance": m("smoke-and-mirrors", "Smoke and Mirrors", [
      s("End of your turn", [{ vp: 2, summary: "Per objective marked as a decoy." }, { vp: 2, bonus: true, summary: "Additional VP for each decoy in enemy territory." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("End of battle", [{ vp: 10, summary: "Four or more objectives are decoys." }])
    ], { action: Object.freeze({ id: "decoy", name: "Decoy", phase: "shooting", reviewTiming: "end-of-turn", summary: "A qualifying unit marks a non-home objective as a decoy." }) }),
    "Priority Assets": m("locate-and-deny", "Locate and Deny", [
      s("End of your turn", [{ vp: 4, summary: "Destroy an enemy that started the turn in range of an objective." }, { vp: 4, summary: "Meet the mission's last-marker positioning condition." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("End of battle", [{ vp: 5, summary: "Meet the mission's last-marker positioning condition." }])
    ], { setup: "Place the mission markers in five eligible terrain areas before the battle and track them manually." })
  }),
  "Reconnaissance": Object.freeze({
    "Take and Hold": m("reconnaissance-sweep", "Reconnaissance Sweep", [
      s("End of your turn", [{ vp: 3, summary: "Have qualifying units wholly within three different table quarters and away from the centre." }, { vp: 6, summary: "Have qualifying units in all four table quarters." }, { vp: 1, summary: "Per enemy unit destroyed this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 3, summary: "Control at least one non-home objective." }])
    ]),
    "Purge the Foe": m("triangulation", "Triangulation", [
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control at least one non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 3, summary: "One objective triangulated." }, { vp: 6, summary: "Two objectives triangulated." }, { vp: 10, summary: "Three or more objectives triangulated." }]),
      s("End of battle", [{ vp: 10, summary: "Control four or more objectives." }])
    ], { action: Object.freeze({ id: "triangulate", name: "Triangulate", phase: "shooting", minRound: 2, reviewTiming: "end-of-turn", summary: "Once per turn, a qualifying unit begins triangulation at a non-home objective; complete it at end of turn if control is maintained." }) }),
    "Disruption": m("surveil-the-foe", "Surveil the Foe", [
      s("End of your turn", [{ vp: 4, summary: "At least one qualifying enemy unit was surveilled this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 4, summary: "Control more objectives than your opponent." }]),
      s("R2+ end of your turn", [{ vp: 5, summary: "No enemy mission markers remain on the battlefield." }])
    ], { setup: "Friendly units can remove enemy mission markers by ending a move in range of the relevant objective.", action: Object.freeze({ id: "surveil", name: "Surveil", phase: "shooting", reviewTiming: "end-of-turn", summary: "Select a visible enemy within 18 inches that has not already been surveilled this turn." }) }),
    "Reconnaissance": m("gather-intel", "Gather Intel", [
      s("R1 end of your turn", [{ vp: 6, summary: "Control at least one central objective." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("R2+ end of your turn", [{ vp: 7, summary: "Per friendly unit that completed Extract Intelligence this turn." }]),
      s("End of battle", [{ vp: 5, summary: "Three or more of your mission markers remain on the battlefield." }, { vp: 5, summary: "One of your markers is within range of the opponent's home objective." }])
    ], { action: Object.freeze({ id: "extract-intelligence", name: "Extract Intelligence", phase: "shooting", minRound: 2, reviewTiming: "end-of-turn", summary: "A qualifying unit at a non-home objective begins extraction; place a marker if it controls that objective at end of turn." }) }),
    "Priority Assets": m("search-and-scour", "Search and Scour", [
      s("End of your turn", [{ vp: 3, summary: "Control at least one central objective." }, { vp: 2, summary: "Destroy an enemy that started the turn in a terrain area." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Per controlled non-home objective." }]),
      s("End of battle", [{ vp: 5, summary: "No enemy units are wholly within your territory." }])
    ])
  }),
  "Priority Assets": Object.freeze({
    "Take and Hold": m("secure-asset", "Secure Asset", [
      s("End of your turn", [{ vp: 4, summary: "A friendly unit completed Secure Asset this turn." }, { vp: 2, summary: "Destroy an enemy that started the turn in range of a central objective." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 4, summary: "Control three or more objectives." }])
    ], { action: Object.freeze({ id: "secure-asset", name: "Secure Asset", phase: "shooting", reviewTiming: "end-of-turn", summary: "Once per turn, a qualifying unit at a non-home objective attempts to secure it; confirm completion against the mission rules." }) }),
    "Purge the Foe": m("vital-link", "Vital Link", [
      s("End of your turn", [{ vp: 2, summary: "Control at least one central objective." }, { vp: 1, bonus: true, summary: "Additional VP per friendly mission marker at those objectives." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }, { vp: 4, bonus: true, summary: "Additional VP if at least one is a central objective." }]),
      s("End of battle", [{ vp: 10, summary: "Control the opponent's home objective." }])
    ], { action: Object.freeze({ id: "maintain-control", name: "Maintain Control", phase: "shooting", reviewTiming: "end-of-turn", summary: "Once per turn, a qualifying unit at a central objective places a mission marker." }) }),
    "Disruption": m("extract-relic", "Extract Relic", [
      s("End of your turn", [{ vp: 4, summary: "A friendly unit completed Sensor Sweep this turn." }, { vp: 3, summary: "Destroy an enemy that started the turn in range of an objective." }, { vp: 4, summary: "Meet the mission's last-enemy-marker positioning condition." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("End of battle", [{ vp: 5, summary: "Meet the mission's last-enemy-marker positioning condition." }])
    ], { action: Object.freeze({ id: "sensor-sweep", name: "Sensor Sweep", phase: "shooting", reviewTiming: "end-of-turn", summary: "Once per turn, a qualifying unit at a central objective removes an enemy mission marker, subject to the mission's last-marker restriction." }) }),
    "Reconnaissance": m("vanguard-operation", "Vanguard Operation", [
      s("End of your turn", [{ vp: 4, summary: "A friendly unit completed Vanguard Operation this turn." }, { vp: 2, summary: "Destroy at least one enemy unit this turn." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }]),
      s("End of battle", [{ vp: 10, summary: "Control the opponent's home objective." }])
    ], { action: Object.freeze({ id: "vanguard-operation", name: "Vanguard Operation", phase: "shooting", reviewTiming: "end-of-turn", summary: "Once per turn, a unit in enemy-territory terrain begins the operation; complete it if that terrain area is clear of enemy units at end of turn." }) }),
    "Priority Assets": m("sabotage", "Sabotage", [
      s("End of your turn", [{ vp: 3, summary: "Per friendly unit that completed Sabotage this turn." }, { vp: 2, bonus: true, summary: "Additional VP for each qualifying sabotage near an objective in enemy territory." }]),
      s("R2+ Command phase / R5 end of turn", [{ vp: 4, summary: "Control a non-home objective." }])
    ], { action: Object.freeze({ id: "sabotage", name: "Sabotage", phase: "shooting", reviewTiming: "end-of-turn", summary: "Qualifying units at different non-home objectives attempt sabotage; confirm control/completion at the mission checkpoint." }) })
  })
});

export function getPrimaryMissionDefinition(ownDisposition, opponentDisposition) {
  return PRIMARY_MISSION_MATRIX[ownDisposition]?.[opponentDisposition] ?? null;
}

export function getBattlePrimaryMissionDefinitions(myDisposition, opponentDisposition) {
  const myMission = getPrimaryMissionDefinition(myDisposition, opponentDisposition);
  const opponentMission = getPrimaryMissionDefinition(opponentDisposition, myDisposition);
  if (!myMission || !opponentMission) return null;
  return Object.freeze({ myMission, opponentMission });
}

export function listPrimaryMissionDefinitions() {
  return PRIMARY_FORCE_DISPOSITIONS.flatMap((ownDisposition) =>
    PRIMARY_FORCE_DISPOSITIONS.map((opponentDisposition) => PRIMARY_MISSION_MATRIX[ownDisposition][opponentDisposition]));
}
