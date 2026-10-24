import { clamp01, opponentPlayerIds } from "./tactical-context-utils.js";

function scoreFor(state, playerId) {
  const value = state?.victoryPoints?.[playerId];
  return Number.isFinite(value) ? Number(value) : 0;
}

/**
 * Broad game-state posture used to scale Tactical Advisor priorities. It only
 * uses recorded score, round and phase; it does not invent mission-card scoring.
 */
export function getGameStrategyContext(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const ownVp = scoreFor(state, playerId);
  const opponents = opponentPlayerIds(state, playerId);
  const opponentVp = opponents.length ? Math.max(...opponents.map((id) => scoreFor(state, id))) : ownVp;
  const vpGap = ownVp - opponentVp;
  const lateGame = round >= 4;
  const behindPressure = vpGap < 0 ? Math.min(1, Math.abs(vpGap) / 20) : 0;
  const leadSecurity = vpGap > 0 ? Math.min(1, vpGap / 20) : 0;
  const roundPressure = round >= 5 ? 1 : round === 4 ? 0.78 : round === 3 ? 0.48 : round === 2 ? 0.25 : 0.12;
  const urgency = clamp01(0.45 * roundPressure + 0.55 * behindPressure);

  let posture = "balanced";
  if (lateGame && vpGap <= -5) posture = "catch-up";
  else if (lateGame && vpGap >= 8) posture = "protect-lead";
  else if (vpGap <= -10) posture = "press-scoring";
  else if (vpGap >= 12) posture = "preserve-advantage";

  const weights = Object.freeze({
    primary: 1 + urgency * 0.85,
    secondary: 1 + urgency * 0.7,
    objectiveSwing: 1 + urgency * 0.95,
    threat: 1 + (posture === "protect-lead" || posture === "preserve-advantage" ? 0.45 * leadSecurity : 0.1 * roundPressure),
    retaliation: 1 + (posture === "protect-lead" ? 0.5 : 0.2 * roundPressure),
    efficiency: posture === "catch-up" ? 0.8 : 1
  });

  const reason = posture === "catch-up"
    ? `Round ${round}: trailing by ${Math.abs(vpGap)} VP. Mission denial and objective swings are weighted more heavily than pure damage efficiency.`
    : posture === "protect-lead"
      ? `Round ${round}: leading by ${vpGap} VP. Protecting scoring assets and suppressing dangerous retaliation receive extra weight.`
      : posture === "press-scoring"
        ? `Trailing by ${Math.abs(vpGap)} VP. The advisor increases mission-value weighting while preserving combat efficiency.`
        : posture === "preserve-advantage"
          ? `Leading by ${vpGap} VP. The advisor modestly favors threat reduction and resource-efficient attacks.`
          : `Round ${round} and the recorded VP gap (${vpGap >= 0 ? "+" : ""}${vpGap}) support a balanced damage, mission and threat posture.`;

  return Object.freeze({
    round,
    phase: state?.phase ?? null,
    ownVp,
    opponentVp,
    vpGap,
    urgency,
    posture,
    weights,
    reason
  });
}
