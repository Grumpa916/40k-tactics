import { evaluateFullAttack } from './full-attack-sequence.js';
import { getDamageOutcomeDistribution } from './damage-outcome-distribution.js';
import { getProbabilisticUnitProfile, getCombatFormationWeaponOptions } from './saved-roster-combat-profile.js';
import { getCombatFormationMembers, getBattleUnitDatasheet, hasInvalidWargear } from './battle-unit-reference.js';
import { getChargeSuccessProbability } from './tactical-charge-opportunity.js';
import { getCustodesChargeAdvisorContext, hasCustodesFightsFirst } from './custodes-tactical-advisor.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';
import { getFightEngagementState } from './fight-engagement-state.js';

const unknown = reason => ({ available: false, reason });
const unitById = (state, id) => state.units?.find(unit => unit.id === id);
const mean = outcomes => outcomes.reduce((sum, item) => sum + item.damage * item.probability, 0);

// Collapse overkill after every profile to keep forecast cost bounded by wounds.
function combine(left, right, cap) {
  const totals = new Map();
  for (const a of left) for (const b of right) {
    const damage = Math.min(cap, a.damage + b.damage);
    totals.set(damage, (totals.get(damage) ?? 0) + a.probability * b.probability);
  }
  return [...totals].map(([damage, probability]) => ({ damage, probability }));
}

function fightOrderUncertain(state, unit) {
  return getCombatFormationMembers(state, unit).some(member => {
    const sheet = getBattleUnitDatasheet(state, member);
    const text = JSON.stringify([sheet?.abilities, member.abilities, member.combatRules, member.keywords]);
    return hasCustodesFightsFirst(state, member.id) || /fights?\s*first|fight.?on.?death|fight[^.]{0,80}(?:destroyed|death)/i.test(text);
  });
}

// A conservative legal subset: one normal melee profile per formation member,
// plus that member's Extra Attacks. Never sum mutually exclusive normal profiles.
function meleePlan(state, attacker, target, charged) {
  const plan = [];
  for (const member of getCombatFormationMembers(state, attacker)) {
    if (hasInvalidWargear(state, member)) return null;
    const weapons = getCombatFormationWeaponOptions(state, attacker, { type: 'melee' })
      .filter(weapon => weapon.sourceUnitId === member.id);
    if (!weapons.length || weapons.some(weapon => weapon.quantityUncertain)) return null;
    const profile = getProbabilisticUnitProfile(state, member);
    const scored = weapons.map(weapon => ({ weapon, value: mean(getDamageOutcomeDistribution({
      attacker: { ...profile, combatRules: { ...profile.combatRules, chargedThisTurn: charged } }, target, weapon
    }).outcomes) }));
    const normals = scored.filter(item => !item.weapon.characteristics.extraAttacks).sort((a,b) => b.value-a.value);
    if (normals.length) plan.push(normals[0].weapon);
    plan.push(...scored.filter(item => item.weapon.characteristics.extraAttacks).map(item => item.weapon));
  }
  return plan.length ? plan : null;
}

function meleeOutcomes(state, attacker, target, plan, charged) {
  let outcomes = [{ damage: 0, probability: 1 }];
  for (const weapon of plan) {
    const profile = getProbabilisticUnitProfile(state, unitById(state, weapon.sourceUnitId));
    const distribution = getDamageOutcomeDistribution({ attacker: {
      ...profile, combatRules: { ...profile.combatRules, chargedThisTurn: charged }
    }, target, weapon });
    outcomes = combine(outcomes, distribution.outcomes, target.wounds);
  }
  return outcomes;
}

export function getFullAttackAdvice(state, { attackerId, targetId, weapon, shooting, mapDistance = null, measuredDistance = null } = {}) {
  try {
    const attacker = unitById(state, attackerId), target = unitById(state, targetId);
    if (!attacker || !target || attacker.ownerId === target.ownerId) return unknown('Choose a deployed enemy target.');
    if (state.phase !== 'shooting' || state.activePlayer !== attacker.ownerId) return unknown('Full Attack previews the active player’s Shooting → Charge → Fight.');
    if (attacker.status !== 'deployed' || target.status !== 'deployed') return unknown('Both units must be deployed.');
    const members = getCombatFormationMembers(state, attacker);
    const ids = new Set(members.map(member => member.id));
    const currentEvents = (state.history ?? []).filter(event => event.payload?.turn === state.turn && event.payload?.round === state.battle?.round);
    if (currentEvents.some(event => event.type === 'combat.attack_resolved' && ids.has(event.payload?.attackerId)))
      return unknown('Attack already recorded: this preview would count the selected shot again.');
    if (currentEvents.some(event => event.type === 'charge.outcome_recorded' && ids.has(event.payload?.unitId)))
      return unknown('This formation already has a charge result.');
    if (getFightEngagementState(state).engagedUnitIds.some(id => ids.has(id))) return unknown('Already engaged: a new charge sequence does not apply.');
    const chargeRules = getCustodesChargeAdvisorContext(state, { playerId: attacker.ownerId, unitId: attackerId, baseProbability: 0 });
    for (const member of members) {
      const movement = getEffectiveMovementAction(state, member.id)?.movementType;
      if (movement === 'fall_back') return unknown('Fell Back: charge permission is not modeled.');
      if (movement === 'advance' && !chargeRules.advanceChargePermission) return unknown('Advanced: no recorded permission to charge.');
    }
    if (getCombatFormationMembers(state, target).length > 1) return unknown('Attached enemy formation: allocation between Leader and Bodyguard needs table review.');
    if (fightOrderUncertain(state, target)) return unknown('Enemy Fights First or fight-on-death requires a different sequence; combined forecast withheld.');
    if (!weapon || weapon.quantityUncertain || hasInvalidWargear(state, attacker)) return unknown('Confirm the selected weapon loadout and surviving models.');
    if (!shooting?.damageDistribution?.outcomes || shooting.impactClassification === 'unknown') return unknown('Shooting probability unavailable.');
    const targetProfile = getProbabilisticUnitProfile(state, target);
    const friendlyProfile = getProbabilisticUnitProfile(state, attacker);
    if (!(targetProfile.wounds > 0) || !(friendlyProfile.wounds > 0)) return unknown('Remaining wounds unavailable.');
    const plan = meleePlan(state, attacker, targetProfile, true);
    if (!plan) return unknown('Saved melee loadout or surviving weapon counts unavailable.');
    const distance = Number.isFinite(measuredDistance) ? measuredDistance : mapDistance;
    if (!Number.isFinite(distance) || distance < 0) return unknown('Place both units on the map to estimate the charge.');
    const exact = Number.isFinite(measuredDistance);
    const distances = exact ? [distance] : [...new Set([Math.max(2, distance - 3), Math.max(2, distance), distance + 3])];
    const meleeCache = new Map(), returnCache = new Map();
    const meleeForRemainingWounds = wounds => {
      if (!meleeCache.has(wounds)) meleeCache.set(wounds, meleeOutcomes(state, attacker, { ...targetProfile, wounds }, plan, true));
      return meleeCache.get(wounds);
    };
    // Multi-model casualty identity and attached-friendly allocation can change
    // return attacks. Withhold those estimates rather than scale damage linearly.
    const retaliationForRemainingWounds = wounds => {
      if (targetProfile.modelCount !== 1 || members.length !== 1) return null;
      if (!returnCache.has(wounds)) {
        const projected = { ...state, phase: 'fight', units: state.units.map(unit => unit.id === targetId ? { ...unit, wounds } : unit) };
        const enemy = unitById(projected, targetId);
        const returnPlan = meleePlan(projected, enemy, friendlyProfile, false);
        returnCache.set(wounds, returnPlan ? mean(meleeOutcomes(projected, enemy, friendlyProfile, returnPlan, false)) : null);
      }
      return returnCache.get(wounds);
    };
    const scenarios = distances.map(requiredRoll => {
      const chargeProbability = getCustodesChargeAdvisorContext(state, { playerId: attacker.ownerId, unitId: attackerId,
        baseProbability: getChargeSuccessProbability(requiredRoll) }).adjustedProbability;
      return { requiredRoll, chargeProbability, ...evaluateFullAttack({ targetWounds: targetProfile.wounds,
        shootingOutcomes: shooting.damageDistribution.outcomes, chargeProbability, meleeForRemainingWounds, retaliationForRemainingWounds }) };
    });
    if (scenarios.some(result => !result.available)) return unknown('Incomplete probability data for this sequence.');
    const strategy = shooting.strategicContext;
    return { available: true, scenarios, exact, weaponName: weapon.name, meleeWeapons: plan.map(item => item.name),
      mission: { primary: strategy?.primary?.reason ?? shooting.primaryMissionImpact?.reason,
        secondary: strategy?.secondary?.reason ?? shooting.secondaryMissionImpact?.reason,
        objective: strategy?.objectiveSwing?.potentialFlip ? `Removing this target could flip ${strategy.objectiveSwing.objectiveId}; confirm OC at the scoring window.` : null,
        killVp: strategy?.primaryStrategy?.nextKillVpLeverage ?? 0 },
      chargeRule: chargeRules.reason,
      assumptions: 'Selected ranged profile only; other shooting is excluded. Melee uses one strongest normal profile per member plus Extra Attacks. Baseline damage uses the existing aggregate-wounds model, so model-by-model damage waste is not simulated. Assumes this charger fights before the target. No Overwatch, intervention, new Stratagem spending, or other enemy activations. Confirm charge path, eligibility and fight order on the table. VP remains manual.' };
  } catch {
    return unknown('A required saved combat profile is incomplete.');
  }
}
