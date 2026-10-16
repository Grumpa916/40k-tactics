import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import {
  TYRANID_DECISION_IDS,
  TYRANID_HYPER_ADAPTATIONS,
  getTyranidShadowInTheWarpCarriers,
  isInvasionFleetRoster
} from "../rules/tyranid-decision-reminders.js";

function requirePlayer(state, playerId) {
  if (!playerId || !state?.players?.some((player) => player.id === playerId)) {
    throw new Error("Choose a player in this battle for the faction ability decision.");
  }
}

function hasDecisionEvent(state, playerId, decisionId) {
  if (state?.armyRosters?.[playerId]?.battleAbilitySelections?.[decisionId]) return true;
  if (state?.armyRosters?.[playerId]?.battleAbilityUses?.[decisionId]) return true;
  return (Array.isArray(state.history) ? state.history : []).some((event) =>
    event?.type === "faction_ability.decision_recorded" &&
    event?.payload?.playerId === playerId &&
    event?.payload?.decisionId === decisionId
  );
}

export function recordFactionAbilityDecision(state, {
  playerId,
  decisionId,
  choice = null
} = {}) {
  if (!state?.battle || state.battle.status !== "active") {
    throw new Error("Faction ability decisions can only be recorded during an active battle.");
  }
  requirePlayer(state, playerId);

  if (hasDecisionEvent(state, playerId, decisionId)) {
    throw new Error("This faction ability decision has already been recorded for this battle.");
  }

  const round = state.battle.round ?? 0;
  const turn = state.turn ?? 0;
  if (decisionId === TYRANID_DECISION_IDS.HYPER_ADAPTATIONS) {
    if (round !== 1 || !isInvasionFleetRoster(state, playerId)) {
      throw new Error("Hyper-adaptations require a Tyranids Invasion Fleet roster at the start of the first battle round.");
    }
    if (state.phase !== "command") {
      throw new Error("Choose Hyper-adaptations at the start of the first battle round, before later phases.");
    }
    const adaptation = TYRANID_HYPER_ADAPTATIONS.find((item) => item.id === choice);
    if (!adaptation) throw new Error("Choose one of the listed Invasion Fleet Hyper-adaptations.");

    const roster = state.armyRosters[playerId];
    const next = {
      ...state,
      armyRosters: {
        ...state.armyRosters,
        [playerId]: {
          ...roster,
          battleAbilitySelections: {
            ...(roster?.battleAbilitySelections ?? {}),
            [decisionId]: adaptation.id
          }
        }
      }
    };
    return appendHistoryEntry(next, createEvent("faction_ability.decision_recorded", {
      playerId, decisionId, choice: adaptation.id, choiceName: adaptation.name,
      timing: "start-of-first-battle-round", round, turn, phase: state.phase
    }));
  }

  if (decisionId === TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) {
    if (state.phase !== "command") {
      throw new Error("Shadow in the Warp can only be recorded during either player's Command phase.");
    }
    if (choice !== "use") {
      throw new TypeError("Record Shadow in the Warp as 'use' only after choosing to unleash it.");
    }
    const carriers = getTyranidShadowInTheWarpCarriers(state, playerId);
    if (!carriers.length) {
      throw new Error("A deployed unit from this player's army with Shadow in the Warp is required.");
    }
    const roster = state.armyRosters?.[playerId] ?? {};
    const next = {
      ...state,
      armyRosters: {
        ...(state.armyRosters ?? {}),
        [playerId]: {
          ...roster,
          battleAbilityUses: {
            ...(roster.battleAbilityUses ?? {}),
            [decisionId]: true
          }
        }
      }
    };
    return appendHistoryEntry(next, createEvent("faction_ability.decision_recorded", {
      playerId, decisionId, choice: "use",
      choiceName: "Shadow in the Warp",
      carrierUnitIds: carriers.map((unit) => unit.id),
      timing: "either-player-command-phase",
      round, turn, phase: state.phase,
      reminder: "Resolve enemy Battle-shock tests at the table; this app does not roll or resolve them."
    }));
  }

  throw new RangeError("Unsupported faction ability decision: " + String(decisionId ?? "unknown"));
}
