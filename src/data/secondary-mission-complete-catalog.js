import { SECONDARY_MISSION_CATALOG } from "./secondary-mission-catalog.js";

/**
 * Supplemental 11th-edition Chapter Approved 2026–27 secondary mission metadata.
 *
 * Source: community-derived 2026.10.02 triangulation/action dataset, cross-checked
 * against the existing project catalog and Event Companion procedures. This is
 * intentionally structured as concise reference metadata rather than verbatim
 * card text. It must not auto-award VP; the player remains the scoring authority.
 */
export const SECONDARY_MISSION_IMPORT_SOURCE = Object.freeze({
  edition: "11th",
  missionPack: "Chapter Approved 2026–27",
  datasetVersion: "2026.10.02-triangulation-action",
  datasetRepository: "IRONBUILT-LLC/ironbuilt-data",
  scoringAuthority: "manual-player-confirmation"
});

const reference = Object.freeze({
  "secondary-a-grievous-blow": Object.freeze({
    whenDrawn: "If no enemy unit with Starting Strength 13+ remains on the battlefield, this Tactical card can be replaced.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-a-tempting-target": Object.freeze({
    whenDrawn: "The opponent designates one eligible No Man's Land objective as the tempting target.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-assassination": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Fixed and Tactical versions score differently; CHARACTER destruction is the relevant event."])
  }),
  "secondary-beacon": Object.freeze({
    whenDrawn: "Select one friendly battlefield unit, including an eligible embarked unit, as the beacon unit.",
    missionAction: null,
    notes: Object.freeze(["If the beacon unit is destroyed, do not automatically substitute another unit."])
  }),
  "secondary-behind-enemy-lines": Object.freeze({
    whenDrawn: "If drawn in battle round 1, it can be returned and replaced.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-bring-it-down": Object.freeze({
    whenDrawn: "If no enemy model with 10+ Wounds remains on the battlefield, this Tactical card can be replaced.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-burden-of-trust": Object.freeze({
    whenDrawn: "Assign friendly units to guard objectives; each objective remains guarded while its assigned unit stays in range and you control it.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-centre-ground": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["AIRCRAFT and Battle-shocked units do not satisfy the centre-presence requirement."])
  }),
  "secondary-cleanse": Object.freeze({
    whenDrawn: "If Plunder is already active, this card can be returned and replaced.",
    missionAction: Object.freeze({
      id: "cleanse",
      name: "Cleanse",
      phase: "shooting",
      completion: "end-of-turn",
      summary: "An eligible unit in range of a non-home objective starts the action in the Shooting phase; each participating unit must use a different objective and completes if it still controls that objective at end of turn."
    }),
    notes: Object.freeze([])
  }),
  "secondary-defend-stronghold": Object.freeze({
    whenDrawn: "If drawn in battle round 1, return it and draw a replacement.",
    missionAction: null,
    notes: Object.freeze(["Scoring begins from battle round 2."])
  }),
  "secondary-display-of-might": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["AIRCRAFT and Battle-shocked units are excluded from the No Man's Land unit count."])
  }),
  "secondary-engage-on-all-fronts": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Table-quarter presence excludes AIRCRAFT and Battle-shocked units and units within 6 inches of the battlefield centre."])
  }),
  "secondary-forward-position": Object.freeze({
    whenDrawn: "If drawn in battle round 1, it can be returned and replaced.",
    missionAction: null,
    notes: Object.freeze([])
  }),
  "secondary-no-prisoners": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Tactical scoring is based on enemy units destroyed during the current turn, subject to the card's VP limit."])
  }),
  "secondary-outflank": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Opposite battlefield edges are parallel edges; AIRCRAFT and Battle-shocked units are excluded."])
  }),
  "secondary-overwhelming-force": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Counts qualifying enemy units that began the turn within range of an objective and were destroyed that turn."])
  }),
  "secondary-plunder": Object.freeze({
    whenDrawn: "If Cleanse is already active, this card can be returned and replaced.",
    missionAction: Object.freeze({
      id: "plunder",
      name: "Plunder",
      phase: "shooting",
      completion: "immediate",
      summary: "Once per turn, an eligible unit in a terrain area outside your territory performs the action in the Shooting phase; the terrain area becomes plundered immediately."
    }),
    notes: Object.freeze(["The territory restriction applies to the terrain area used for the action."])
  }),
  "secondary-secure-no-mans-land": Object.freeze({
    whenDrawn: null,
    missionAction: null,
    notes: Object.freeze(["Scoring checks control of two or more eligible objectives in No Man's Land."])
  })
});

export const COMPLETE_SECONDARY_MISSION_CATALOG = Object.freeze(
  SECONDARY_MISSION_CATALOG.map((mission) => {
    const imported = reference[mission.id];
    if (!imported) {
      throw new Error("Missing complete secondary mission metadata for " + mission.id);
    }
    return Object.freeze({
      ...mission,
      importSource: SECONDARY_MISSION_IMPORT_SOURCE,
      whenDrawn: imported.whenDrawn,
      missionAction: imported.missionAction,
      notes: imported.notes,
      scoringAuthority: "manual-player-confirmation"
    });
  })
);

export function getCompleteSecondaryMissionById(id) {
  return COMPLETE_SECONDARY_MISSION_CATALOG.find((mission) => mission.id === id) ?? null;
}
