// Apply reduction to each rolled Damage value before wound prevention. Reducing
// an average first gives the wrong answer for dice damage near the minimum.
export function getReducedDamageValues(profile) {
  const damage = profile.damage;
  const text = String(damage ?? '').trim().toUpperCase();
  let values;
  if (Number.isInteger(damage) && damage >= 1 || /^\d+$/.test(text) && Number(text) >= 1) {
    values = [[Number(damage), 1]];
  } else {
    const match = text.match(/^D([36])(?:\+(\d+))?$/);
    if (!match) throw new RangeError('Damage must be a positive integer or supported D3/D6 expression.');
    const sides = Number(match[1]), modifier = Number(match[2] || 0);
    values = Array.from({ length: sides }, (_, index) => [index + 1 + modifier, 1 / sides]);
  }
  const reduction = Number.isInteger(profile.damageReduction) && profile.damageReduction > 0 ? profile.damageReduction : 0;
  return values.map(([value, probability]) => [Math.max(1, value - reduction), probability]);
}

export function getWoundLossValues(profile) {
  const values = getReducedDamageValues(profile);
  const fnp = profile.damagePrevention;
  if (!Number.isInteger(fnp) || fnp < 2 || fnp > 6) return values;
  const lossProbability = (fnp - 1) / 6;
  const outcomes = new Map();
  for (const [damage, probability] of values) {
    let losses = [1];
    for (let wound = 0; wound < damage; wound++) {
      const next = Array(losses.length + 1).fill(0);
      losses.forEach((p, index) => {
        next[index] += p * (1 - lossProbability);
        next[index + 1] += p * lossProbability;
      });
      losses = next;
    }
    losses.forEach((p, count) => outcomes.set(count, (outcomes.get(count) ?? 0) + p * probability));
  }
  return [...outcomes];
}
