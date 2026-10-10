/**
 * Chapter Approved 2026–27 Primary Mission reference catalog.
 *
 * Scoring criteria are transcribed from user-provided card photographs.
 * This catalog is a reference and manual-review aid; it does not award VP.
 * Criteria remain descriptive until each condition has a supported state
 * evaluator. Twist cards are intentionally excluded.
 */
export const PRIMARY_MISSION_CATALOG_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  source: "user-provided photographs of physical cards",
  catalogScope: "primary-missions-only",
  rulesVerified: false,
  note: "Verified transcription does not imply automated eligibility evaluation."
});

const card = (id, name, scoringWindows, actions = []) => Object.freeze({
  id,
  name,
  category: "primary",
  rulesVerified: true,
  referenceOnly: true,
  scoringWindows: Object.freeze(scoringWindows.map((window) => Object.freeze({
    ...window,
    tiers: Object.freeze(window.tiers.map((tier) => Object.freeze({ ...tier })))
  }))),
  actions: Object.freeze(actions.map((action) => Object.freeze({ ...action })))
});

const endTurn = (id, label, tiers, minRound = null, maxRound = null) => ({
  id, timing: "end-of-turn", timingLabel: label, tiers, ...(minRound == null ? {} : { minRound }), ...(maxRound == null ? {} : { maxRound })
});
const command = (id, label, tiers, minRound = 2, maxRound = null) => ({
  id, timing: "command-phase", timingLabel: label, tiers, minRound, ...(maxRound == null ? {} : { maxRound })
});
const endBattle = (id, tiers) => ({ id, timing: "end-of-battle", timingLabel: "End of the battle", tiers });

export const PRIMARY_MISSION_CATALOG = Object.freeze([
  card("destroyers-wrath", "Destroyer's Wrath", [
    endTurn("destroyed-enemy", "Any battle round — end of your turn", [{ vp: 3, summary: "One or more enemy units were destroyed this turn." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [
      { vp: 4, summary: "Control one or more objectives, excluding your home objective." },
      { vp: 6, summary: "Control more objectives than your opponent." }
    ]),
    endTurn("destruction-comparison", "Second battle round onwards — end of your turn", [{ vp: 4, summary: "More enemy units were destroyed this turn than friendly units were destroyed in the previous turn." }], 2)
  ]),
  card("gather-intel", "Gather Intel", [
    endTurn("central-round-one", "First battle round — end of your turn", [{ vp: 6, summary: "Control one or more central objectives." }], 1, 1),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }]),
    endTurn("extract-intelligence", "Second battle round onwards — end of your turn", [{ vp: 7, summary: "For each friendly unit that completed the Extract Intelligence action this turn." }], 2),
    endBattle("operation-markers", [{ vp: 5, summary: "Three or more of your operation markers are on the battlefield." }, { vp: 5, summary: "One of your operation markers is within range of your opponent's home objective." }])
  ], [{ name: "Extract Intelligence", starts: "Shooting phase, from battle round two onwards", unit: "One unit within range of an objective excluding your home objective, with none of your operation markers within range of it", useLimit: "Unlimited; each unit starting this action this phase must use a different objective", completes: "End of your turn if the unit controls that objective", effect: "Place one of your operation markers within range of that objective." }]),
  card("vanguard-operation", "Vanguard Operation", [
    endTurn("vanguard-or-destruction", "Any battle round — end of your turn", [{ vp: 4, summary: "A friendly unit performed a vanguard operation this turn." }, { vp: 2, summary: "One or more enemy units were destroyed this turn." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }]),
    endBattle("opponent-home", [{ vp: 10, summary: "Control your opponent's home objective." }])
  ], [{ name: "Vanguard Operation", starts: "Shooting phase", unit: "One friendly unit within a terrain area in your opponent's territory", useLimit: "Once per turn", completes: "End of your turn if no enemy units are within that terrain area", effect: "Your unit performs a vanguard operation." }]),
  card("meatgrinder", "Meatgrinder", [
    endTurn("destroyed-enemy", "Any battle round — end of your turn", [{ vp: 3, summary: "One or more enemy units were destroyed this turn." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }]),
    endTurn("destruction-comparison", "Second battle round onwards — end of your turn", [{ vp: 5, summary: "More enemy units were destroyed this turn than friendly units were destroyed in the previous turn." }], 2),
    endBattle("opponent-home", [{ vp: 5, summary: "Control your opponent's home objective." }])
  ]),
  card("search-and-scour", "Search and Scour", [
    endTurn("central-and-terrain", "Any battle round — end of your turn", [{ vp: 3, summary: "Control one or more central objectives." }, { vp: 2, summary: "One or more enemy units that started the turn within a terrain area are destroyed." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "For each objective you control, excluding your home objective." }]),
    endBattle("territory-clear", [{ vp: 5, summary: "No enemy units are wholly within your territory." }])
  ]),
  card("immovable-object", "Immovable Object", [
    endTurn("objective-control", "Any battle round — end of your turn", [{ vp: 3, summary: "Control one or more objectives." }]),
    command("objectives-rounds-two-to-four", "Second to fourth battle round — end of your Command phase", [{ vp: 5, summary: "For each objective you control, excluding your home objective." }], 2, 4),
    endTurn("objectives-round-five", "Fifth battle round — end of your turn", [{ vp: 5, summary: "For each objective you control, excluding your home objective." }], 5, 5)
  ]),
  card("unstoppable-force", "Unstoppable Force", [
    endTurn("destroyed-enemy", "Any battle round — end of your turn", [{ vp: 3, summary: "One or more enemy units were destroyed this turn." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "For each objective you control, excluding your home objective." }]),
    endTurn("newly-controlled", "Second battle round onwards — end of your turn", [{ vp: 3, summary: "Control one or more objectives you did not control at the start of the turn, excluding your home objective." }], 2),
    endBattle("central-objective", [{ vp: 5, summary: "Control one or more central objectives." }])
  ]),
  card("delaying-action", "Delaying Action", [
    endTurn("destroyed-enemy", "Any battle round — end of your turn", [{ vp: 2, summary: "For each enemy unit destroyed this turn." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding home objectives." }]),
    endTurn("central-and-expansion", "Second battle round onwards — end of your turn", [{ vp: 3, summary: "Control one or more central objectives and one or more expansion objectives." }], 2)
  ]),
  card("consecrate", "Consecrate", [
    endTurn("consecrated-objectives", "Any battle round — end of your turn", [{ vp: 3, summary: "One or two objectives are consecrated." }, { vp: 6, summary: "Three or more objectives are consecrated; alternative to the 3 VP tier." }]),
    command("objectives-and-majority", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }, { vp: 4, summary: "Control more objectives than your opponent." }]),
    endBattle("opponent-home-consecrated", [{ vp: 5, summary: "Your opponent's home objective is consecrated." }])
  ], [{ name: "Consecration", starts: "Each time a friendly unit destroys a unit, it becomes a consecration unit. At end of your turn, each such unit may select an unconsecrated objective within its range, excluding your home objective.", effect: "Place one of your operation markers within range of the selected objective; it becomes consecrated and that unit is no longer a consecration unit." }]),
  card("outmaneuver", "Outmaneuver", [
    endTurn("opponent-home", "Any battle round — end of your turn", [{ vp: 10, summary: "Control your opponent's home objective." }]),
    endTurn("first-round-objectives", "First battle round — end of your turn", [{ vp: 4, summary: "For each objective you control, excluding your home objective." }], 1, 1),
    command("objectives-rounds-two-three", "Second and third battle rounds — end of your Command phase", [{ vp: 5, summary: "For each objective you control, excluding your home objective." }], 2, 3),
    endTurn("objectives-round-four-onwards", "Fourth battle round onwards — end of your turn", [{ vp: 6, summary: "For each objective you control, excluding your home objective." }], 4)
  ]),
  card("extract-relic", "Extract Relic", [
    endTurn("sensor-sweep-and-destruction", "Any battle round — end of your turn", [{ vp: 4, summary: "A friendly unit performed a sensor sweep this turn." }, { vp: 3, summary: "One or more enemy units that started the turn within range of one or more objectives are destroyed." }, { vp: 4, summary: "Only one opponent operation marker remains, one or more friendly units are in the same terrain area as that marker, and no enemy units are in that terrain area." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }]),
    endBattle("marker-and-terrain", [{ vp: 5, summary: "Only one opponent operation marker remains, one or more friendly units are in the same terrain area as it, and no enemy units are in that terrain area." }])
  ], [{ name: "Sensor Sweep", starts: "Shooting phase", unit: "One friendly unit within range of a central objective", useLimit: "Once per turn", completes: "End of your turn if the unit controls that objective", effect: "Remove one operation marker from the battlefield.", restriction: "Cannot start if only one operation marker remains on the battlefield." }]),
  card("vital-link", "Vital Link", [
    endTurn("central-and-markers", "Any battle round — end of your turn", [{ vp: 2, summary: "Control one or more central objectives." }, { vp: 1, summary: "Cumulative: for each of your operation markers within range of one of those objectives." }]),
    command("objectives-and-central", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }, { vp: 4, summary: "Cumulative bonus if one or more of those objectives is central." }]),
    endBattle("opponent-home", [{ vp: 10, summary: "Control your opponent's home objective." }])
  ], [{ name: "Maintain Control", starts: "Shooting phase", unit: "One friendly unit within range of one central objective", useLimit: "Once per turn", completes: "End of your turn if the unit controls that objective", effect: "Place one of your operation markers within range of that objective." }]),
  card("sab﻿otage", "Sabotage", [
    endTurn("sabotage-and-territory", "Any battle round — end of your turn", [{ vp: 3, summary: "For each friendly unit that committed sabotage this turn." }, { vp: 2, summary: "Cumulative: for each of those units within range of one or more objectives in your opponent's territory." }]),
    command("objectives", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }])
  ], [{ name: "Sabotage", starts: "Shooting phase", unit: "One unit within range of an objective, excluding your home objective", useLimit: "Unlimited; each unit starting this action this phase must be at a different objective", completes: "End of your turn if the unit controls that objective", effect: "Your unit commits sabotage." }]),
  card("punishment", "Punishment", [
    endTurn("condemned-destroyed", "Any battle round — end of a turn", [{ vp: 5, summary: "One or more condemned enemy units left the battlefield this turn." }]),
    command("objectives-and-majority", "Second battle round onwards — Command phase (or end of turn in round five)", [{ vp: 4, summary: "Control one or more objectives, excluding your home objective." }, { vp: 5, summary: "Control more objectives than your opponent." }]),
    endBattle("opponent-home", [{ vp: 8, summary: "Control your opponent's home objective." }])
  ]),
  card("surveil-the-foe", "Surveil the Foe", [], [{ name: "Surveil the Foe", starts: "Shooting phase", unit: "One friendly unit", useLimit: "Unlimited", completes: "Immediately", effect: "Select one enemy unit within 18 inches and visible to your unit that has not been surveilled this turn. It remains surveilled until end of turn." }]),
  card("locate-and-deny", "Locate and Deny", [], [{ name: "Sensor Sweep", starts: "Shooting phase", unit: "One friendly unit within range of one central objective", useLimit: "Once per turn", completes: "End of your turn if the unit controls that objective", effect: "Remove one operation marker from the battlefield.", restriction: "Cannot start if only one operation marker remains on the battlefield." }]),
  card("triangulation", "Triangulation", [], [{ name: "Triangulate", starts: "Shooting phase from battle round two onwards", unit: "One friendly unit within range of one objective excluding your home objective", useLimit: "Once per turn", completes: "End of your turn if the unit controls that objective", effect: "The objective is triangulated; place one of your operation markers within range of it." }]),
  card("smoke-and-mirrors", "Smoke and Mirrors", [], [{ name: "Decoy", starts: "Shooting phase", unit: "One friendly unit within range of an objective excluding your home objective that is not decoyed", useLimit: "Unlimited; each unit starting this action this phase must use a different objective", completes: "End of your turn if the unit controls that objective", effect: "The objective is decoyed; place one of your operation markers within range of it." }]),
  ...[
    ["triangulation-placeholder", "Triangulation (scoring transcription pending)"],
    ["saboteur-placeholder", "Sabotage (duplicate-name safeguard)"],
    ["battlefield-dominance", "Battlefield Dominance"],
    ["determined-acquisition", "Determined Acquisition"],
    ["inescapable-dominion", "Inescapable Dominion"],
    ["purge-and-secure", "Purge and Secure"],
    ["death-trap", "Death Trap"],
    ["reconnaissance-sweep", "Reconnaissance Sweep"],
    ["secure-asset", "Secure Asset"],
    ["smoke-and-mirrors-placeholder", "Smoke and Mirrors (duplicate-name safeguard)"],
    ["locate-and-deny-placeholder", "Locate and Deny (duplicate-name safeguard)"],
    ["additional-primary-pending", "Additional Primary Mission — transcription pending"]
  ].map(([id, name]) => card(id, name, []))
]);

export function getPrimaryMissionDefinition(id) {
  return PRIMARY_MISSION_CATALOG.find((mission) => mission.id === id) ?? null;
}
