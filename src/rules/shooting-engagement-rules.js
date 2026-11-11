import { getBattleUnitDatasheet, getCombatFormationMembers, getCombatFormationRootId } from './battle-unit-reference.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';

// 11th edition Core Rules 10.06 (Close-quarters Shooting) and 17.03
// (Shooting at Engaged Monsters and Vehicles). Recorded engagements, not
// approximate map proximity, determine known engagement for these forecasts.
const unitById = (state, id) => (state?.units ?? []).find(unit => unit?.id === id) ?? null;
const rootId = (state, id) => getCombatFormationRootId(state, id) ?? id;
const keywords = (state, unit) => [
  ...(unit?.keywords ?? []),
  ...(unit?.profile?.keywords ?? []),
  ...(getBattleUnitDatasheet(state, unit)?.keywords ?? [])
].map(keyword => String(keyword).trim().toLowerCase());
const isMonsterOrVehicle = (state, unit) =>
  keywords(state, unit).some(keyword => keyword === 'monster' || keyword === 'vehicle');

function weaponFlag(weapon, flag, label) {
  if (weapon?.characteristics?.[flag] === true || weapon?.[flag] === true) return true;
  const text = String(weapon?.abilities ?? weapon?.characteristics?.abilities ?? '');
  return new RegExp('(?:^|[,;\\n])\\s*' + label + '(?:\\s+\\d+)?\\s*(?=$|[,;\\n])', 'i').test(text);
}

const isCloseQuarters = weapon => weaponFlag(weapon, 'closeQuarters', '(?:close[-\\s]quarters|pistol)');
const isBlast = weapon => {
  const value = weapon?.characteristics?.blast ?? weapon?.blast;
  return value === true || Number(value) > 0 || weaponFlag(weapon, 'blast', 'blast');
};

function knownAdvance(state, unit) {
  return getCombatFormationMembers(state, unit).some(member => {
    const movement = getEffectiveMovementAction(state, member.id);
    return movement?.movementType === 'advance' &&
      movement?.baseEvent?.payload?.round === state?.battle?.round;
  });
}

function context(eligible, reason, { attackerEngaged, targetEngaged, mutuallyEngaged, hitModifier = 0, appliedRule = null } = {}) {
  return Object.freeze({
    eligible, reason, attackerEngaged: Boolean(attackerEngaged),
    targetEngaged: Boolean(targetEngaged), mutuallyEngaged: Boolean(mutuallyEngaged),
    hitModifier, appliedRule
  });
}

export function getShootingEngagementContext(state, { attackerId, targetId, weapon } = {}) {
  const attacker = unitById(state, attackerId);
  const target = unitById(state, targetId);
  if (!attacker || !target || !weapon || weapon.type === 'melee' || state?.phase !== 'shooting') {
    return context(true, null);
  }

  const engagement = getFightEngagementState(state);
  const knownEngaged = new Set(engagement.engagedUnitIds.map(id => rootId(state, id)));
  const attackerRoot = rootId(state, attacker.id);
  const targetRoot = rootId(state, target.id);
  const attackerEngaged = knownEngaged.has(attackerRoot);
  const targetEngaged = knownEngaged.has(targetRoot);
  const mutuallyEngaged = engagement.relationships.some(relationship => {
    const [first, second] = relationship.unitIds.map(id => rootId(state, id));
    return (first === attackerRoot && second === targetRoot) ||
      (first === targetRoot && second === attackerRoot);
  });
  const facts = { attackerEngaged, targetEngaged, mutuallyEngaged };
  const source = unitById(state, weapon.sourceUnitId) ?? attacker;
  const attackerLarge = isMonsterOrVehicle(state, source);
  const targetLarge = isMonsterOrVehicle(state, target);
  const closeQuarters = isCloseQuarters(weapon);
  const blast = isBlast(weapon);

  if (attackerEngaged && knownAdvance(state, attacker)) {
    return context(false, 'Close-quarters shooting is unavailable after an Advance (10.06).', facts);
  }
  if (attackerEngaged && !attackerLarge && !closeQuarters) {
    return context(false, 'Engaged non-Vehicle/non-Monster units may only fire Close-Quarters weapons (10.06).', facts);
  }
  if (attackerEngaged && !attackerLarge && !mutuallyEngaged) {
    return context(false, 'Engaged non-Vehicle/non-Monster units may only shoot enemies they are engaged with (10.06).', facts);
  }
  if (targetEngaged && blast && (targetLarge || mutuallyEngaged)) {
    return context(false, 'Blast weapons cannot target an engaged Monster/Vehicle or a unit engaged with the firing unit (10.06, 17.03).', facts);
  }
  if (targetEngaged && !targetLarge && !mutuallyEngaged) {
    return context(false, 'An engaged non-Monster/non-Vehicle target cannot be shot by an outside unit (04.02, 10.06).', facts);
  }

  // Both 10.06 and 17.03 impose a single -1 to Hit where applicable. They
  // are not added together. Close-Quarters against the firer's own engaged
  // target is exempt in either case.
  const closeIntoOwnEngagement = attackerEngaged && mutuallyEngaged && closeQuarters;
  const hitModifier = !closeIntoOwnEngagement && (
    (attackerEngaged && attackerLarge) || (targetEngaged && targetLarge)
  ) ? 1 : 0;
  const appliedRule = hitModifier
    ? 'Engagement shooting (10.06/17.03): -1 to Hit.'
    : closeIntoOwnEngagement
      ? 'Close-Quarters (10.06/17.03): no engagement Hit penalty against this engaged target.'
      : null;
  return context(true, null, { ...facts, hitModifier, appliedRule });
}

// Preserve intrinsic hit modifiers and the original weapon object; the combat
// probability engine already caps the combined hit modifier at +/-1.
export function withShootingEngagementModifier(weapon, engagement) {
  if (!weapon?.characteristics || !engagement?.hitModifier) return weapon;
  return {
    ...weapon,
    characteristics: {
      ...weapon.characteristics,
      hitModifier: (Number(weapon.characteristics.hitModifier) || 0) + engagement.hitModifier
    }
  };
}

export function withShootingEngagementExplanation(distribution, engagement) {
  if (!distribution || !engagement?.appliedRule) return distribution;
  return {
    ...distribution,
    contextualAbilities: {
      ...(distribution.contextualAbilities ?? {}),
      appliedRules: [
        ...(distribution.contextualAbilities?.appliedRules ?? []),
        engagement.appliedRule
      ]
    }
  };
}
