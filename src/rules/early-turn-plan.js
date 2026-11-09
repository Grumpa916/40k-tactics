import { getCombatFormationRoot, getCombatFormationMembers, hasInvalidWargear } from './battle-unit-reference.js';
import { getCombatFormationWeaponOptions } from './saved-roster-combat-profile.js';
import { getShootingTargetPriorities } from './tactical-shooting-targets.js';
import { getTargetStrategicContext } from './tactical-target-context.js';
import { getFullAttackAdvice } from './full-attack-advisor.js';
import { getMovementStrategicRecommendations } from './tactical-movement-router.js';

// Read-only early-turn comparisons. Only a temporary phase projection is passed
// into the existing forecast engines; the actual session is never dispatched.
const unavailable = reason => Object.freeze({ available:false, reason });

export function getEarlyTurnPlan(state, { unitId, playerId } = {}) {
  const phase = state?.phase;
  const activePlayer = state?.activePlayer ?? state?.battle?.activePlayerId;
  if (!['command','movement'].includes(phase) || state?.battle?.status !== 'active')
    return unavailable('Turn planning is available during the active Command and Movement phases.');
  if (!playerId || playerId !== activePlayer)
    return unavailable('Plan your own active turn; opponent decisions remain with the opponent.');
  const member = (state?.units ?? []).find(unit => unit.id === unitId);
  const unit = getCombatFormationRoot(state,member);
  if (!unit || unit.ownerId !== playerId || unit.status !== 'deployed')
    return unavailable('Select a deployed formation from your army.');
  let formation = [];
  let loadoutUncertain = false;
  let allWeapons = [];
  try {
    formation = getCombatFormationMembers(state,unit);
    loadoutUncertain = formation.some(item => hasInvalidWargear(state,item));
    if (!loadoutUncertain) allWeapons = getCombatFormationWeaponOptions(state,unit,{type:'ranged'});
  } catch {
    // Broken imported profiles must never prevent phase navigation or editing.
    loadoutUncertain = true;
  }
  const projectedShooting = {...state,phase:'shooting',activePlayer};
  const projectedMovement = phase==='movement' ? state : {...state,phase:'movement'};
  let movement = null;
  try {
    movement = getMovementStrategicRecommendations(projectedMovement, {
      playerId,perspectivePlayerId:playerId
    }).recommendations.find(item => item.unitId === unit.id) ?? null;
  } catch {
    // Incomplete mission data must not suppress the independent attack preview.
  }

  // A bounded sample rather than exhaustive turn optimization. Each option is
  // explicitly ONE ranged profile (not all combined formation shooting).
  const weapons = allWeapons
    .filter(weapon => !weapon.quantityUncertain && weapon.characteristics)
    .slice(0,3);
  const candidates = [];
  for (const weapon of weapons) {
    let targets=[];
    try {
      targets=getShootingTargetPriorities(projectedShooting, {
        playerId,attackerId:unit.id,weapon
      }).priorities.slice(0,3);
    } catch {
      continue;
    }
    for(const target of targets) {
      if (target.rangeStatus!=='within' || !target.damageDistribution?.outcomes?.length ||
          !Number.isFinite(target.expectedDamage) || target.impactClassification==='unknown') continue;
      let strategy = null;
      try {
        strategy=getTargetStrategicContext(state,{
          playerId,attackerId:weapon.sourceUnitId ?? unit.id,targetUnitId:target.targetUnitId
        });
      } catch {
        // Missing mission context is unknown, not zero prospective VP.
      }
      candidates.push({
        targetId:target.targetUnitId,
        targetName:(state.units??[]).find(item=>item.id===target.targetUnitId)?.name??target.targetUnitId,
        weapon,shooting:target,strategicContext:strategy,
        // Ranking aid only. Never present the heuristic as probability or VP.
        rank:target.priority+((strategy?.score??0)*4)
      });
    }
  }
  candidates.sort((a,b)=>b.rank-a.rank ||
    String(a.targetId).localeCompare(String(b.targetId)) ||
    String(a.weapon.id).localeCompare(String(b.weapon.id)));
  const best=candidates[0]??null;
  const alternative=candidates.find(item=>best && item.targetId!==best.targetId)??null;

  let attack = null;
  if (best) {
    const shooting = {
      damageDistribution: best.shooting.damageDistribution,
      impactClassification: best.shooting.impactClassification,
      strategicContext:best.strategicContext,
      primaryMissionImpact:best.strategicContext?.primary,
      secondaryMissionImpact:best.strategicContext?.secondary
    };
    const full=getFullAttackAdvice(projectedShooting,{
      attackerId:unit.id,targetId:best.targetId,weapon:best.weapon,shooting,
      mapDistance:best.shooting.targetDistance
    });
    // Take the map-distance midpoint, not the optimistic -3" scenario.
    const scenario=full.available
      ? full.scenarios.reduce((closest,item) =>
        !closest || Math.abs(item.requiredRoll-best.shooting.targetDistance)<
          Math.abs(closest.requiredRoll-best.shooting.targetDistance)?item:closest,null)
      : null;
    attack=Object.freeze({
      targetId:best.targetId,targetName:best.targetName,
      weaponName:best.weapon.name,
      mapDistance:best.shooting.targetDistance,
      expectedShootingDamage:best.shooting.expectedDamage,
      shootingKillProbability:best.shooting.destructionProbability,
      confidence:best.shooting.confidence,
      primaryReason:best.strategicContext?.primary?.reason??null,
      secondaryReason:best.strategicContext?.secondary?.reason??null,
      objectiveReason:best.strategicContext?.objectiveSwing?.reason??null,
      fullAttack:Object.freeze({
        available:Boolean(full.available),
        reason:full.available?null:full.reason,
        ...(scenario?{
          requiredRoll:scenario.requiredRoll,
          chargeProbability:scenario.chargeProbability,
          expectedDamage:scenario.expectedDamage,
          destructionProbability:scenario.destructionProbability,
          exposureProbability:scenario.exposureProbability,
          retaliationExpectedDamage:scenario.retaliationExpectedDamage
        }:{})
      })
    });
  }
  return Object.freeze({
    available:true,unitId:unit.id,unitName:unit.name??unit.id,
    attack,
    alternative:alternative ? Object.freeze({
      targetId:alternative.targetId,targetName:alternative.targetName,
      weaponName:alternative.weapon.name
    }):null,
    movement:movement ? Object.freeze({
      purpose:movement.purpose??null,
      objectiveId:movement.objectiveId??null,
      objectiveName:movement.objectiveName??null,
      targetName:movement.targetName??null,
      recommendation:movement.recommendation??null,
      actionHint:movement.actionHint??null,
      confidence:movement.confidence??'low'
    }):null,
    limitedWeapons: allWeapons.length>weapons.length,
    loadoutUncertain,
    assumptions:'Baseline from current approximate map markers only; no future move, line of sight, complete weapon allocation, charge path, CP use, or enemy reaction is simulated. Tabletop legality, actual OC and agreed VP remain authoritative.'
  });
}
