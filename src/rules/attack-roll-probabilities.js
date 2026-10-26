function successProbability(target) {
  return (7 - target) / 6;
}

function normalizeReroll(reroll) {
  return ["ones", "failed"].includes(reroll) ? reroll : "none";
}

/**
 * Return success and critical probabilities for a single D6 roll after one
 * supported re-roll instruction. Re-rolls are never chained: a re-rolled die
 * cannot itself be re-rolled.
 */
export function getRollSuccessProbabilities({
  successTarget,
  criticalTarget = 6,
  reroll = "none"
} = {}) {
  if (!Number.isInteger(successTarget) || successTarget < 2 || successTarget > 6) {
    throw new RangeError("successTarget must be an integer from 2 through 6.");
  }
  if (!Number.isInteger(criticalTarget) || criticalTarget < 2 || criticalTarget > 6) {
    throw new RangeError("criticalTarget must be an integer from 2 through 6.");
  }

  const baseSuccess = Math.max(successProbability(successTarget), successProbability(criticalTarget));
  const baseCritical = successProbability(criticalTarget);
  const mode = normalizeReroll(reroll);
  const rerolledProbability = mode === "failed"
    ? 1 - baseSuccess
    : mode === "ones"
      ? 1 / 6
      : 0;
  const success = baseSuccess + rerolledProbability * baseSuccess;
  const critical = baseCritical + rerolledProbability * baseCritical;

  return Object.freeze({
    success,
    critical,
    nonCritical: Math.max(0, success - critical),
    failure: Math.max(0, 1 - success),
    reroll: mode,
    rerolledProbability
  });
}

/** Failed-wound re-rolls (for example Twin-linked) are stronger than re-roll 1s. */
export function strongestReroll(...rerolls) {
  const modes = rerolls.map(normalizeReroll);
  if (modes.includes("failed")) return "failed";
  if (modes.includes("ones")) return "ones";
  return "none";
}
