/**
 * Resolve a safe initial unit cost for the selected model count.
 *
 * When several published options share a model count (for example, different
 * weapon choices or army-order surcharges), keep the documented default only
 * for the catalog's default configuration. For a non-default/ambiguous count,
 * leave points unset rather than silently assigning a potentially wrong cost.
 */
export function resolveInitialUnitPoints(candidate, modelCount) {
  if (!candidate || typeof candidate !== "object") {
    throw new TypeError("A catalog candidate is required.");
  }

  const count = Number.isInteger(modelCount) && modelCount > 0 ? modelCount : null;
  if (count === null) return null;

  const options = Array.isArray(candidate.pointsOptions) ? candidate.pointsOptions : [];
  const matching = options.filter((option) =>
    option?.models === count && Number.isFinite(option.points) && option.points >= 0
  );

  if (matching.length === 1) return matching[0].points;

  if (count === candidate.defaultModelCount &&
      Number.isFinite(candidate.defaultPoints) && candidate.defaultPoints >= 0) {
    return candidate.defaultPoints;
  }

  if (options.length === 0 && candidate.defaultModelCount == null && count === 1 &&
      Number.isFinite(candidate.defaultPoints) && candidate.defaultPoints >= 0) {
    return candidate.defaultPoints;
  }

  return null;
}

