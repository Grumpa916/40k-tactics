import { getCombatHistorySummary } from "./combat-history-summary.js";
import { getSpatialContext } from "./spatial-context.js";
import { isUnitBattleShocked } from "./unit-status-summary.js";
import { getGuardiansStratagemOpportunities } from "./guardians-stratagem-opportunities.js";
import { getCustodesDetachmentStratagemReminders } from "./custodes-detachment-rule-reminders.js";
import { getBattleRulesReminders } from "./battle-rules-reminders.js";

export function isOpponentTurnFor(state, playerId) {
  const activePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
  return Boolean(playerId && activePlayerId && activePlayerId !== playerId);
}

/**
 * Read-only perspective-specific defensive outlook. Recorded attacks/charges
 * are evidence; approximate positions are warnings, never legal-target tests.
 * This is deliberately separate from the active player's offensive ranking.
 */
export function getOpponentTurnDefensiveContext(state, { playerId, limit = 4 } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isOpponentTurnFor(state, playerId)) {
    return { active: false, threats: [], windows: [] };
  }

  const combat = getCombatHistorySummary(state, { playerId });
  const spatial = getSpatialContext(state, { playerId });
  const round = state?.battle?.round;
  const turn = state?.turn;
  const nearby = new Map();

  for (const item of spatial.unitProximity) {
    const enemy = state.units?.find(unit => unit.id === item.otherUnitId);
    if (!enemy || enemy.ownerId === playerId || !["close", "near"].includes(item.band)) continue;
    const previous = nearby.get(item.unitId);
    if (!previous || item.distance < previous.distance) {
      nearby.set(item.unitId, { enemyId: enemy.id, enemyName: enemy.name ?? enemy.id, distance: item.distance });
    }
  }

  const threats = combat.units
    .filter(unit => !unit.destroyed && unit.status === "deployed")
    .map(unit => {
      const currentShots = unit.shotsReceived.filter(event => event.round === round && event.turn === turn);
      const currentCharges = unit.chargesReceived.filter(event => event.round === round && event.turn === turn);
      const currentFights = unit.fights.filter(event => event.round === round && event.turn === turn && event.actorId !== unit.unitId);
      const close = nearby.get(unit.unitId) ?? null;
      const friendly = state.units.find(item => item.id === unit.unitId);
      const shocked = Boolean(friendly && isUnitBattleShocked(friendly));
      const damage = [...currentShots, ...currentFights].reduce((sum, event) => sum + (Number.isFinite(event.actualDamage) ? event.actualDamage : 0), 0);
      const priority = currentCharges.length ? 5 : currentShots.length || currentFights.length ? 4 : close ? 3 : shocked ? 2 : 0;
      return {
        unitId: unit.unitId,
        unitName: friendly?.name ?? unit.unitId,
        priority,
        nearestEnemy: close,
        battleShocked: shocked,
        damageTakenThisTurn: damage,
        attacksReceived: currentShots.length + currentFights.length,
        chargesReceived: currentCharges.length,
        reason: currentCharges.length
          ? "Opponent charge recorded; confirm engagement and defensive Fight windows."
          : currentShots.length || currentFights.length
            ? "Incoming attack recorded; confirm remaining wounds and defensive effects."
            : close
              ? "Nearby enemy on the approximate map; verify actual range, line of sight and screening."
              : shocked ? "Battle-shocked; check stratagem targeting and objective control." : ""
      };
    })
    .filter(item => item.priority > 0)
    .sort((a, b) => b.priority - a.priority || (a.nearestEnemy?.distance ?? Infinity) - (b.nearestEnemy?.distance ?? Infinity) || a.unitName.localeCompare(b.unitName))
    .slice(0, Math.max(0, limit));

  // Show only currently applicable, read-only reference windows. These are
  // not buttons and do not spend CP or claim that a tabletop trigger occurred.
  let windows = [];
  try {
    const guardians = getGuardiansStratagemOpportunities(state, { playerId })
      .filter(item => item.available && ["swift-as-the-eagle", "in-auramite-clad", "shield-of-honour"].includes(item.stratagemId))
      .map(item => ({ name: item.title, unitName: item.unitName, timing: item.timing, kind: "stratagem" }));
    const detachment = getCustodesDetachmentStratagemReminders(state, { playerId })
      .map(item => ({ name: item.title, unitName: item.detachmentName, timing: item.timing, kind: "stratagem" }));
    const abilities = getBattleRulesReminders(state, { playerId })
      .filter(item => item.available && (item.turn === "opponent" || /targeted|attacked|enemy attack|defensive/i.test(item.timing ?? "")))
      .map(item => ({ name: item.title, unitName: item.unitName, timing: item.timing, kind: "ability" }));
    const seen = new Set();
    windows = [...guardians, ...detachment, ...abilities].filter(item => {
      const key = [item.name, item.unitName, item.timing].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  } catch {
    // An incomplete roster never prevents the defensive threat display.
  }

  return { active: true, playerId, phase: state?.phase, threats, windows };
}
