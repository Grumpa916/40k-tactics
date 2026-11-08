// Pure scenario evaluator. Callers supply forecasts for each surviving state;
// never mutate the live battle or substitute mean damage for actual branches.
function outcomes(value) {
  if (!Array.isArray(value) || !value.length) return null;
  if (value.some(x => !Number.isFinite(x.damage) || x.damage < 0 ||
      !Number.isFinite(x.probability) || x.probability < 0)) return null;
  const mass = value.reduce((n, x) => n + x.probability, 0);
  return Math.abs(mass - 1) <= 1e-6 ? value : null;
}

export function evaluateFullAttack({
  targetWounds, shootingOutcomes, chargeProbability, meleeForRemainingWounds,
  retaliationForRemainingWounds = null
} = {}) {
  const shooting = outcomes(shootingOutcomes);
  if (!Number.isFinite(targetWounds) || targetWounds <= 0 || !shooting)
    return { available: false, reason: 'Shooting forecast or target wounds unavailable.' };
  if (!Number.isFinite(chargeProbability) || chargeProbability < 0 || chargeProbability > 1)
    return { available: false, reason: 'Charge probability unavailable.' };
  const final = new Map();
  let shootingKillProbability = 0, meleeKillProbability = 0, exposureProbability = 0;
  let retaliationExpectedDamage = 0, retaliationKnown = true;
  const add = (damage, probability) => {
    const capped = Math.min(targetWounds, damage);
    final.set(capped, (final.get(capped) ?? 0) + probability);
  };
  for (const shot of shooting) {
    if (!shot.probability) continue;
    const remaining = Math.max(0, targetWounds - shot.damage);
    if (!remaining) {
      shootingKillProbability += shot.probability;
      add(targetWounds, shot.probability);
      continue;
    }
    add(shot.damage, shot.probability * (1 - chargeProbability));
    if (!chargeProbability) continue;
    const melee = outcomes(meleeForRemainingWounds?.(remaining));
    if (!melee) return { available: false, reason: 'Melee forecast unavailable for a surviving target.' };
    for (const hit of melee) {
      const probability = shot.probability * chargeProbability * hit.probability;
      if (!probability) continue;
      const survivingWounds = Math.max(0, remaining - hit.damage);
      add(shot.damage + hit.damage, probability);
      if (!survivingWounds) meleeKillProbability += probability;
      else {
        exposureProbability += probability;
        const retaliation = retaliationForRemainingWounds?.(survivingWounds);
        if (!Number.isFinite(retaliation) || retaliation < 0) retaliationKnown = false;
        else retaliationExpectedDamage += probability * retaliation;
      }
    }
  }
  const resultOutcomes = [...final].filter(([, probability]) => probability > 0)
    .sort(([a], [b]) => a - b).map(([damage, probability]) => ({ damage, probability }));
  return {
    available: true, outcomes: resultOutcomes,
    expectedDamage: resultOutcomes.reduce((n, x) => n + x.damage * x.probability, 0),
    destructionProbability: shootingKillProbability + meleeKillProbability,
    shootingKillProbability, meleeKillProbability, exposureProbability,
    retaliationExpectedDamage: retaliationKnown ? retaliationExpectedDamage : null
  };
}
