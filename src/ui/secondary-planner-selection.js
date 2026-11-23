import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES, SECONDARY_MISSION_STATUS } from '../rules/secondary-mission-lifecycle.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';

export function toggleSecondaryPlannerCard({definitionId,session,secondaryPlanner,secondaryMissionCatalog,render,perspectivePlayerId}) {

    const state = session.getState();
    const playerId = state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId ?? state.players?.[0]?.id ?? null;
    const active = getSecondaryMissionHistory(state).find((item) =>
      item.playerId === playerId && item.definitionId === definitionId && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    try {
      if (!playerId) throw new Error("Choose your army before selecting secondary cards.");
      if (active) {
        session.dispatch({ type: COMMAND_TYPES.RETURN_SECONDARY_MISSION, payload: {
          instanceId: active.instanceId, playerId, round: state.battle?.round ?? 0, turn: state.turn ?? 0
        }});
        secondaryPlanner.notice = "Removed from your Command phase secondaries.";
      } else {
        const missionMode = getSecondaryMissionMode(state, playerId);
        if (!missionMode) throw new Error("Choose Fixed or Tactical mode before selecting secondary cards.");
        if (missionMode === SECONDARY_MISSION_MODES.TACTICAL && state.phase !== "command") {
          throw new Error("Tactical cards can only be selected during the Command phase.");
        }
        const definition = secondaryMissionCatalog.find((item) => item.id === definitionId && item.category === "secondary");
        if (!definition) throw new Error("That card is not in the secondary catalog.");
        if (definition.availableModes && !definition.availableModes.includes(missionMode)) {
          throw new Error("That card is not available in " + missionMode + " mode.");
        }
        session.dispatch({ type: COMMAND_TYPES.DRAW_SECONDARY_MISSION, payload: {
          definition: {
            ...definition,
            timing: definition.scoringWindows?.[0]?.timing,
            conditions: definition.conditions ?? [],
            manualEntry: true
          },
          playerId,
          round: state.battle?.round ?? 0,
          turn: state.turn ?? 0
        }});
        secondaryPlanner.notice = "Added to your Command phase secondaries.";
      }
    } catch (error) {
      const message = error?.message ?? String(error);
      secondaryPlanner.notice = message === "Fixed secondary cards cannot be returned to the deck."
        ? "Fixed cards stay selected for the whole battle."
        : message;
    }
    render();
}
