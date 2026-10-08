/**
 * Resolve data-driven wound-bracket modifiers for a unit.
 *
 * Unit data may declare characteristics.woundBrackets as entries such as:
 * { maxWoundsRemaining: 5, hitModifier: -1 }
 *
 * The engine does not assume which units degrade or what threshold they use;
 * the imported unit data owns those rules.
 */
export function getWoundBracketModifiers(unit, { remainingWounds = unit?.wounds } = {}) {
  const brackets = unit?.characteristics?.woundBrackets;
  if (!Array.isArray(brackets) || brackets.length === 0) {
    return Object.freeze({ hitModifier: 0 });
  }

  if (!Number.isFinite(remainingWounds)) {
    return Object.freeze({ hitModifier: 0 });
  }

  const eligible = brackets
    .filter((bracket) => Number.isFinite(bracket?.maxWoundsRemaining))
    .filter((bracket) => remainingWounds <= bracket.maxWoundsRemaining)
    .sort((a, b) => a.maxWoundsRemaining - b.maxWoundsRemaining);

  const bracket = eligible[0];
  if (!bracket) return Object.freeze({ hitModifier: 0 });

  return Object.freeze({
    hitModifier: Number.isFinite(bracket.hitModifier) ? bracket.hitModifier : 0
  });
}
