import { getTyranidDatasheetDetails } from "../data/tyranid-datasheet-details.js";

export const TYRANID_DECISION_IDS = Object.freeze({
  HYPER_ADAPTATIONS: "tyranids.hyper-adaptations",
  SHADOW_IN_THE_WARP: "tyranids.shadow-in-the-warp"
});

export const TYRANID_HYPER_ADAPTATIONS = Object.freeze([
  Object.freeze({
    id: "swarming-instincts",
    name: "Swarming Instincts",
    summary: "Gain Sustained Hits 1 when targeting Infantry or Swarm units."
  }),
  Object.freeze({
    id: "hyper-aggression",
    name: "Hyper-aggression",
    summary: "Gain Lethal Hits when targeting Monster or Vehicle units."
  }),
  Object.freeze({
    id: "hive-predators",
    name: "Hive Predators",
    summary: "Critical Hits against Character units gain Precision."
  })
]);

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function getTyranidUnitAbilities(unit) {
  const datasheetId = unit?.metadata?.datasheetId ?? unit?.datasheetId ?? null;
  if (typeof datasheetId !== "string" || !datasheetId.startsWith("tyranids:")) return [];
  const datasheet = getTyranidDatasheetDetails(datasheetId);
  return Array.isArray(datasheet?.abilities) ? datasheet.abilities : [];
}

export function unitHasTyranidAbility(unit, abilityName) {
  const expected = normalize(abilityName);
  return getTyranidUnitAbilities(unit).some((ability) => normalize(ability?.name) === expected);
}

export function getTyranidShadowInTheWarpCarriers(state, playerId) {
  return (Array.isArray(state?.units) ? state.units : []).filter((unit) =>
    unit.ownerId === playerId &&
    unit.status === "deployed" &&
    unitHasTyranidAbility(unit, "Shadow in the Warp")
  );
}

function hasRecordedDecision(state, playerId, decisionId) {
  if (state?.armyRosters?.[playerId]?.battleAbilitySelections?.[decisionId]) return true;
  if (state?.armyRosters?.[playerId]?.battleAbilityUses?.[decisionId]) return true;
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    event?.type === "faction_ability.decision_recorded" &&
    event?.payload?.playerId === playerId &&
    event?.payload?.decisionId === decisionId
  );
}

export function isTyranidPlayer(state, playerId) {
  const rosterFaction = normalize(state?.armyRosters?.[playerId]?.faction);
  if (rosterFaction === "tyranids" || rosterFaction === "tyranid") return true;
  return (Array.isArray(state?.units) ? state.units : []).some((unit) =>
    unit.ownerId === playerId &&
    String(unit?.metadata?.datasheetId ?? unit?.datasheetId ?? "").startsWith("tyranids:")
  );
}

export function isInvasionFleetRoster(state, playerId) {
  const roster = state?.armyRosters?.[playerId];
  return normalize(roster?.faction) === "tyranids" &&
    normalize(roster?.detachment ?? roster?.detachmentName) === "invasion fleet";
}

/**
 * Return reminders for the user's explicitly selected army only.
 * Ability availability is based on battle roster metadata and datasheet ability
 * records, not unit names or approximate map positions.
 */
export function getTyranidDecisionReminders(state, playerId) {
  if (!state?.battle || state.battle.status !== "active" || !playerId ||
      !state.players?.some((player) => player.id === playerId) ||
      !isTyranidPlayer(state, playerId)) return [];

  const reminders = [];
  if (state.battle.round === 1 &&
      ["start_turn", "command"].includes(state.phase) &&
      isInvasionFleetRoster(state, playerId) &&
      !hasRecordedDecision(state, playerId, TYRANID_DECISION_IDS.HYPER_ADAPTATIONS)) {
    reminders.push({
      id: TYRANID_DECISION_IDS.HYPER_ADAPTATIONS,
      playerId,
      timing: "start-of-first-battle-round",
      title: "Choose Hyper-adaptations",
      description: "Select the Invasion Fleet Hyper-adaptation for your army for this battle.",
      required: true,
      options: TYRANID_HYPER_ADAPTATIONS
    });
  }

  if (state.phase === "command" &&
      !hasRecordedDecision(state, playerId, TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP) &&
      getTyranidShadowInTheWarpCarriers(state, playerId).length > 0) {
    reminders.push({
      id: TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP,
      playerId,
      timing: "either-player-command-phase",
      title: "Shadow in the Warp",
      description: "Once per battle, this ability can be unleashed in either player's Command phase. If used, resolve the required enemy Battle-shock tests at the table.",
      required: false,
      carriers: getTyranidShadowInTheWarpCarriers(state, playerId).map((unit) => unit.name ?? unit.id)
    });
  }

  return reminders;
}
