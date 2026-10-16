import { UNIT_STATUS } from "../state/unit.js";

function firstFinite(values) {
  return values.find((value) => Number.isFinite(value));
}

export function isUnitBattleShocked(unit) {
  return unit?.battleShocked === true ||
    unit?.battleShock?.status === "battle-shocked" ||
    unit?.battleShock?.active === true;
}

/**
 * Return a conservative strength assessment. If surviving model counts are
 * not tracked, report unknown rather than inferring from aggregate wounds.
 */
export function getUnitStrengthAssessment(unit) {
  const startingStrength = firstFinite([
    unit?.startingStrength,
    unit?.strength?.starting,
    unit?.metadata?.startingStrength,
    unit?.metadata?.modelCount
  ]);
  const currentStrength = firstFinite([
    unit?.currentStrength,
    unit?.remainingStrength,
    unit?.strength?.remaining,
    unit?.metadata?.currentModelCount
  ]);

  if (unit?.belowHalfStrength === true || unit?.belowHalfStrength === false) {
    return { known: true, belowHalfStrength: unit.belowHalfStrength, source: "explicit" };
  }


  // A one-model unit uses remaining Wounds, not a one-model count, to assess
  // its strength. This must be checked before the generic model-count branch.
  const isSingleModel = startingStrength === 1 ||
    (startingStrength == null && unit?.metadata?.modelCount === 1);
  if (isSingleModel) {
    const startingWounds = firstFinite([
      unit?.startingWounds,
      unit?.profile?.characteristics?.wounds,
      unit?.profile?.wounds
    ]);
    if (Number.isFinite(startingWounds) && startingWounds > 0 &&
        Number.isFinite(unit?.wounds) && unit.wounds >= 0) {
      return {
        known: true,
        belowHalfStrength: unit.wounds * 2 <= startingWounds,
        startingStrength: 1,
        currentStrength: unit.wounds > 0 ? 1 : 0,
        startingWounds,
        currentWounds: unit.wounds,
        source: "single-model-wounds"
      };
    }
    return { known: false, belowHalfStrength: null, source: "untracked-single-model-wounds" };
  }

  if (Number.isFinite(startingStrength) && startingStrength > 0 &&
      Number.isFinite(currentStrength) && currentStrength >= 0) {
    return {
      known: true,
      belowHalfStrength: currentStrength * 2 <= startingStrength,
      startingStrength,
      currentStrength,
      source: "model-count"
    };
  }

  const models = Array.isArray(unit?.models) ? unit.models : [];
  const modelStateIsTracked = models.some((model) =>
    model && typeof model === "object" &&
    ("status" in model || "destroyed" in model || "isAlive" in model || "wounds" in model)
  );
  if (models.length > 0 && modelStateIsTracked) {
    const remaining = models.filter((model) =>
      model?.status !== UNIT_STATUS.DESTROYED &&
      model?.destroyed !== true &&
      model?.isAlive !== false &&
      !(Number.isFinite(model?.wounds) && model.wounds <= 0)
    ).length;
    const starting = Number.isFinite(startingStrength) && startingStrength > 0
      ? startingStrength
      : models.length;
    return {
      known: true,
      belowHalfStrength: remaining * 2 <= starting,
      startingStrength: starting,
      currentStrength: remaining,
      source: "model-state"
    };
  }

  return { known: false, belowHalfStrength: null, source: "untracked" };
}

/**
 * "requiresTest: null" means the app lacks authoritative model/wound-strength
 * data and must ask for a table-side check rather than guessing.
 */
export function getBattleShockEligibility(unit) {
  if (!unit || unit.status === UNIT_STATUS.DESTROYED) {
    return { status: "destroyed", requiresTest: false, known: true };
  }
  if (isUnitBattleShocked(unit)) {
    return { status: "test-required-currently-battle-shocked", requiresTest: true, known: true };
  }
  if (unit.status !== UNIT_STATUS.DEPLOYED) {
    return { status: "not-on-battlefield", requiresTest: false, known: true };
  }
  const strength = getUnitStrengthAssessment(unit);
  if (!strength.known) {
    return { status: "strength-review-required", requiresTest: null, known: false, strength };
  }
  if (strength.belowHalfStrength) {
    return { status: "test-required-at-or-below-half-strength", requiresTest: true, known: true, strength };
  }
  return { status: "no-test-indicated", requiresTest: false, known: true, strength };
}
