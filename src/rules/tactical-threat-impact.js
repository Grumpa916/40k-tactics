import { getCombatHistorySummary } from "./combat-history-summary.js";
import { clamp01, impactLabel, unitById } from "./tactical-context-utils.js";

/**
 * Summarize authoritative opponent combat events caused by one target unit.
 * Damage, charges and activations come from state.history rather than map
 * inference. Recent rounds are weighted slightly more heavily.
 */
export function getTargetThreatImpact(state, { playerId, targetUnitId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({
      score: 0,
      label: "none",
      damageDealt: 0,
      attacks: 0,
      charges: 0,
      fights: 0,
      activations: 0,
      reason: "No opponent threat history is available."
    });
  }

  let summary = null;
  try {
    summary = getCombatHistorySummary(state, { playerId });
  } catch {
    summary = null;
  }

  const currentRound = Math.max(1, Number(state?.battle?.round) || 1);
  let damageDealt = 0;
  let attacks = 0;
  let charges = 0;
  let fights = 0;
  let activations = 0;

  for (const action of summary?.opponentActions ?? []) {
    if (action.actorId !== targetUnitId) continue;
    const actionRound = Number.isFinite(action.round) ? action.round : currentRound;
    const recency = actionRound >= currentRound - 1 ? 1 : 0.6;
    if (action.type === "combat.attack_resolved") {
      attacks += recency;
      damageDealt += Math.max(0, Number(action.actualDamage) || 0) * recency;
      if (action.phase === "fight") fights += recency;
    } else if (action.type === "charge.outcome_recorded") {
      charges += recency;
    } else if (action.type === "fight.unit_activated" || action.type === "shooting.unit_activated") {
      activations += recency;
    }
  }

  const damageScore = Math.min(0.7, damageDealt / 12);
  const actionScore = Math.min(0.3, attacks * 0.06 + charges * 0.12 + fights * 0.06 + activations * 0.04);
  const score = clamp01(damageScore + actionScore);
  const roundedDamage = Math.round(damageDealt * 10) / 10;

  const reason = score <= 0
    ? "No recorded opponent combat events make this target a higher immediate threat."
    : `Recorded recent history: approximately ${roundedDamage} damage, ${Math.round(attacks)} attack event${Math.round(attacks) === 1 ? "" : "s"}, ${Math.round(charges)} successful charge${Math.round(charges) === 1 ? "" : "s"}, and ${Math.round(fights)} Fight attack${Math.round(fights) === 1 ? "" : "s"}.`;

  return Object.freeze({
    score,
    label: impactLabel(score),
    damageDealt: roundedDamage,
    attacks: Math.round(attacks),
    charges: Math.round(charges),
    fights: Math.round(fights),
    activations: Math.round(activations),
    reason
  });
}
