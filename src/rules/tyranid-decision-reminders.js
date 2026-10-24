import { getTyranidDatasheetDetails } from "../data/tyranid-datasheet-details.js";
import { getFormationObjectiveContribution } from "./tactical-objective-swing.js";
import { getTargetObjectiveImpact } from "./tactical-objective-impact.js";

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

function shadowTimingContext(state, playerId) {
  const enemies = (Array.isArray(state?.units) ? state.units : []).filter((unit) =>
    unit.ownerId !== playerId && unit.status === "deployed" && unit.battleShocked !== true && unit.battleShock?.active !== true && unit.battleShock?.status !== "battle-shocked"
  );
  const relevant = [];
  for (const unit of enemies) {
    let objective = null;
    try { objective = getTargetObjectiveImpact(state, { playerId, targetUnitId: unit.id }); } catch { objective = null; }
    if (!objective?.objectiveId || objective.score <= 0.2) continue;
    const oc = getFormationObjectiveContribution(state, unit);
    const nominal = Number(oc.totalOc);
    if (!Number.isFinite(nominal) || nominal <= 0) continue;
    relevant.push({
      unitId: unit.id,
      unitName: unit.name ?? unit.id,
      objectiveId: objective.objectiveId,
      control: objective.control,
      oc: nominal,
      objectiveScore: objective.score
    });
  }
  const estimatedEnemyObjectiveOc = relevant.reduce((sum, entry) => sum + entry.oc, 0);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const vp = state?.victoryPoints ?? {};
  const ownVp = Number.isFinite(vp[playerId]) ? Number(vp[playerId]) : 0;
  const opponentVp = Math.max(ownVp, ...(state?.players ?? []).filter((player) => player.id !== playerId)
    .map((player) => Number.isFinite(vp[player.id]) ? Number(vp[player.id]) : ownVp));
  const behind = ownVp < opponentVp;
  const opponentIsActive = (state?.activePlayer ?? state?.battle?.activePlayerId) !== playerId;
  const priority = estimatedEnemyObjectiveOc >= 5 && (opponentIsActive || round >= 3 || behind)
    ? "high"
    : estimatedEnemyObjectiveOc > 0 ? "moderate" : "normal";
  const strategicReason = estimatedEnemyObjectiveOc > 0
    ? `Enemy scoring pieces near recorded objectives contribute about ${estimatedEnemyObjectiveOc} saved OC before Battle-shock. ${opponentIsActive ? "This is the opponent's Command phase; " : ""}if the current mission scores from control in this Command phase, resolve Shadow before confirming that scoring.`
    : "No significant enemy saved OC near recorded objectives is currently established, so preserving Shadow for a later Command phase may have more value.";
  return Object.freeze({
    priority,
    estimatedEnemyObjectiveOc,
    affectedObjectiveUnits: Object.freeze(relevant),
    strategicReason
  });
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
      state.phase === "command" &&
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
    const strategy = shadowTimingContext(state, playerId);
    reminders.push({
      id: TYRANID_DECISION_IDS.SHADOW_IN_THE_WARP,
      playerId,
      timing: "either-player-command-phase",
      title: "Shadow in the Warp",
      description: strategy.priority === "high"
        ? `Strong timing window. ${strategy.strategicReason}`
        : `Once per battle, this ability can be unleashed in either player's Command phase. ${strategy.strategicReason}`,
      required: false,
      priority: strategy.priority,
      strategicReason: strategy.strategicReason,
      estimatedEnemyObjectiveOc: strategy.estimatedEnemyObjectiveOc,
      affectedObjectiveUnits: strategy.affectedObjectiveUnits,
      carriers: getTyranidShadowInTheWarpCarriers(state, playerId).map((unit) => unit.name ?? unit.id)
    });
  }

  return reminders;
}
