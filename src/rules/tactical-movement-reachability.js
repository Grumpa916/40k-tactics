// Advisory reachability only. The live map cannot certify terrain, engagement,
// objective footprint, Advance rolls or legal movement paths.
const MAP_TOLERANCE = 3;
const MAX_ADVANCE = 6;

export function classifyMovementDestination(distance, movement) {
  if (!Number.isFinite(Number(distance)) || !Number.isFinite(Number(movement)) || Number(movement) < 0) {
    return Object.freeze({ status: "unknown", remainingGap: null, confidence: "low" });
  }
  const gap = Math.max(0, Number(distance) - (Number(movement) + MAP_TOLERANCE));
  const status = gap === 0 ? "reachable" : gap <= MAX_ADVANCE ? "staging" : "future";
  return Object.freeze({
    status,
    remainingGap: Math.round(gap * 10) / 10,
    confidence: gap <= MAP_TOLERANCE ? "low" : "moderate"
  });
}

function decorateOption(option, movement, unitName) {
  if (!option?.objectiveId) return option;
  const reach = classifyMovementDestination(option.distance, movement);
  if (reach.status === "reachable" || reach.status === "unknown") {
    return Object.freeze({ ...option, reachability: reach.status, remainingGap: reach.remainingGap });
  }
  const future = reach.status === "future";
  const score = Math.min(Number(option.score) || 0, future ? 0.27 : 0.42);
  const objectiveName = option.objectiveName ?? "this objective";
  const actionHint = future
    ? `Future-turn objective: approximately ${reach.remainingGap}" beyond this turn's Normal Move plus map tolerance. Stage toward it only; do not claim an Action or capture now.`
    : `Staging candidate: approximately ${reach.remainingGap}" beyond a Normal Move plus map tolerance. An Advance might help, but cannot be assumed; verify on the tabletop.`;
  return Object.freeze({
    ...option, score, reachability: reach.status, remainingGap: reach.remainingGap,
    purpose: future ? "future-objective" : "stage-toward-objective",
    confidence: "low", actionHint,
    recommendation: `${unitName}: ${future ? "plan a future approach to" : "stage toward"} ${objectiveName}; this is not a confirmed current-turn capture or Action.`,
    reason: `${option.reason ?? ""} ${actionHint}`.trim()
  });
}

export function classifyMovementRecommendations(result) {
  if (!result?.recommendations?.length) return result;
  const recommendations = result.recommendations.map(item => {
    const unitName = item.unitName ?? item.unitId;
    const options = [decorateOption(item, item.movement, unitName),
      ...(item.alternatives ?? []).map(option => decorateOption(option, item.movement, unitName))]
      .sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
    const best = options[0];
    const priority = best.score >= 0.8 ? 5 : best.score >= 0.65 ? 4 : best.score >= 0.48 ? 3 : best.score >= 0.3 ? 2 : 1;
    return Object.freeze({
      ...item, ...best, unitId: item.unitId, unitName, movement: item.movement,
      effectiveOc: item.effectiveOc, battleShocked: item.battleShocked,
      type: item.type, weapons: item.weapons, territory: item.territory,
      priority, alternatives: Object.freeze(options.slice(1, 3))
    });
  }).sort((a,b) => b.score - a.score || b.priority - a.priority || a.unitName.localeCompare(b.unitName));
  return Object.freeze({ ...result, recommendations: Object.freeze(recommendations) });
}
