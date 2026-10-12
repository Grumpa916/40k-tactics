/**
 * Summarize assigned unit costs against a roster's optional points limit.
 * Unknown costs are excluded from the known total and explicitly counted.
 */
export function summarizeRosterPoints(roster) {
  if (!roster || typeof roster !== "object" || !Array.isArray(roster.units)) {
    throw new TypeError("A roster with a units array is required.");
  }

  const costs = roster.units.map((unit) => unit?.points);
  const knownCosts = costs.filter((points) => Number.isFinite(points) && points >= 0);
  const totalPoints = knownCosts.reduce((sum, points) => sum + points, 0);
  const unitsWithoutPoints = costs.length - knownCosts.length;
  const pointsLimit = Number.isFinite(roster.pointsLimit) && roster.pointsLimit >= 0
    ? roster.pointsLimit
    : null;
  const remainingPoints = pointsLimit === null ? null : pointsLimit - totalPoints;

  return {
    totalPoints,
    unitsWithoutPoints,
    allUnitCostsSet: unitsWithoutPoints === 0,
    pointsLimit,
    limitSet: pointsLimit !== null,
    remainingPoints,
    overLimit: remainingPoints !== null && remainingPoints < 0
  };
}
