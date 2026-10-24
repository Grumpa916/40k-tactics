const RANGE_UNCERTAINTY_MARGIN = 3;

function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function unitPosition(unit) {
  const positions = (Array.isArray(unit?.models) ? unit.models : [])
    .map((model) => model?.position)
    .filter(validPosition);
  if (positions.length) {
    return {
      x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length,
      y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length
    };
  }
  return validPosition(unit?.position) ? unit.position : null;
}

function distanceBetween(attacker, target) {
  const first = unitPosition(attacker);
  const second = unitPosition(target);
  if (!first || !second) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function addFlatBonus(value, bonus) {
  if (!Number.isFinite(bonus) || bonus <= 0) return value;
  if (Number.isInteger(value) && value >= 0) return value + bonus;
  const text = String(value ?? '').trim();
  if (/^\d+$/.test(text)) return Number(text) + bonus;
  const dice = text.match(/^(\d*)D([36])(?:\+(\d+))?$/i);
  if (!dice) return value;
  const modifier = Number(dice[3] || 0) + bonus;
  return `${dice[1] || ''}D${dice[2]}${modifier ? `+${modifier}` : ''}`;
}

function normalizeKeywords(target) {
  return [...new Set((Array.isArray(target?.keywords) ? target.keywords : [])
    .map((keyword) => String(keyword).trim().toLowerCase())
    .filter(Boolean))];
}

function matchingAntiThreshold(profile, targetKeywords) {
  const anti = Array.isArray(profile?.anti) ? profile.anti : [];
  const matches = anti
    .filter((entry) => targetKeywords.includes(String(entry?.keyword ?? '').trim().toLowerCase()))
    .map((entry) => Number(entry?.threshold))
    .filter((value) => Number.isInteger(value) && value >= 2 && value <= 6);
  return matches.length ? Math.min(...matches) : 6;
}

function halfRangeStatus(profile, distance) {
  if (!Number.isFinite(profile?.range) || profile.range <= 0 || !Number.isFinite(distance)) return 'unknown';
  const halfRange = profile.range / 2;
  if (distance <= Math.max(0, halfRange - RANGE_UNCERTAINTY_MARGIN)) return 'within';
  if (distance > halfRange + RANGE_UNCERTAINTY_MARGIN) return 'outside';
  return 'borderline';
}

export function getContextualWeaponProfile({ attacker, target, profile } = {}) {
  if (!profile) throw new TypeError('An attack profile is required.');
  const distance = distanceBetween(attacker, target);
  const rangeStatus = halfRangeStatus(profile, distance);
  const targetModels = Number.isInteger(target?.modelCount) && target.modelCount >= 0
    ? target.modelCount
    : null;
  const blastBonus = Number.isInteger(profile.blast) && profile.blast > 0 && Number.isInteger(targetModels)
    ? profile.blast * Math.floor(targetModels / 5)
    : 0;
  const rapidFireBonus = rangeStatus === 'within' && Number.isInteger(profile.rapidFire) && profile.rapidFire > 0
    ? profile.rapidFire
    : 0;
  const meltaBonus = rangeStatus === 'within' && Number.isInteger(profile.melta) && profile.melta > 0
    ? profile.melta
    : 0;
  const targetKeywords = normalizeKeywords(target);
  const criticalWoundTarget = matchingAntiThreshold(profile, targetKeywords);

  return Object.freeze({
    ...profile,
    attacks: addFlatBonus(profile.attacks, blastBonus + rapidFireBonus),
    damage: addFlatBonus(profile.damage, meltaBonus),
    targetModels,
    targetKeywords: Object.freeze(targetKeywords),
    approximateDistance: distance,
    halfRangeStatus: rangeStatus,
    blastBonus,
    rapidFireBonus,
    meltaBonus,
    criticalWoundTarget,
    antiMatched: criticalWoundTarget < 6
  });
}

export { RANGE_UNCERTAINTY_MARGIN };
