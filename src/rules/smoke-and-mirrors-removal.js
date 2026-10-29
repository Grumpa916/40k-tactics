import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getSmokeAndMirrorsState } from "./smoke-and-mirrors-state.js";

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function defaultPerspectivePlayerId(state) {
  return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  return playerId === perspectivePlayerId ? definitions.myMission : definitions.opponentMission;
}

export function isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-surveil-the-foe";
}

export function getSmokeAndMirrorsMarkerRemovalOptions(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId || !isSurveilTheFoeMissionForPlayer(state, playerId, perspectivePlayerId)) return Object.freeze([]);

  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const objectiveById = new Map(objectives.filter((objective) => objective?.id).map((objective) => [objective.id, objective]));
  const options = [];

  for (const opponent of players(state)) {
    if (!opponent?.id || opponent.id === playerId) continue;
    const decoys = getSmokeAndMirrorsState(state, {
      playerId: opponent.id,
      perspectivePlayerId
    });
    if (!decoys.active) continue;

    for (const objectiveId of decoys.decoyObjectiveIds) {
      const objective = objectiveById.get(objectiveId);
      if (!objective) continue;
      options.push(Object.freeze({
        objectiveId,
        objectiveName: objective.name ?? objective.layoutObjective ?? objectiveId,
        markerOwnerPlayerId: opponent.id,
        markerType: "smoke-and-mirrors-decoy",
        requiresTabletopConfirmation: true
      }));
    }
  }

  return Object.freeze(options);
}