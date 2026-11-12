import {
  getSecondaryMissionHistory,
  getSecondaryMissionMode,
  SECONDARY_MISSION_STATUS
} from "./secondary-mission-lifecycle.js";
import { isUnitBattleShocked } from "./unit-status-summary.js";
import { getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import {
  clamp01,
  distanceBetween,
  hasKeyword,
  impactLabel,
  opponentPlayerIds,
  unitById,
  unitPosition
} from "./tactical-context-utils.js";

const TABLE_CENTRE = Object.freeze({ x: 30, y: 22 });

function activeSecondaryEntries(state, playerId) {
  if (!playerId) return [];
  return getSecondaryMissionHistory(state, playerId)
    .filter((entry) => entry.status === SECONDARY_MISSION_STATUS.ACTIVE);
}

function definitionSlug(definition) {
  return String(definition?.id ?? "")
    .replace(/^secondary-/, "")
    .trim()
    .toLowerCase();
}

function structuredDestructionRelevance(definition, targetUnitId) {
  const conditions = Array.isArray(definition?.conditions) ? definition.conditions : [];
  return conditions.some((condition) =>
    condition?.evidence === "unit-destruction" &&
    condition?.args?.unitId === targetUnitId &&
    condition?.args?.expected !== false
  );
}

function centreGroundRelevance(state, target) {
  if (!target || target.status === "destroyed") return null;
  if (isUnitBattleShocked(target) || hasKeyword(state, target, "aircraft")) return null;
  const distance = distanceBetween(unitPosition(target), TABLE_CENTRE);
  if (!Number.isFinite(distance) || distance > 9) return null;
  const score = distance <= 3 ? 1 : distance <= 6 ? 0.82 : 0.3;
  return { score, distance };
}

function relevantDestructionCard(state,playerId,definition,target) {
  const slug=definitionSlug(definition);
  const mode=getSecondaryMissionMode(state,playerId) ?? definition.missionMode ?? null;
  const scoringModeValid=(definition.scoringWindows??[]).some(window=>
    !window.modes?.length||!mode||window.modes.includes(mode));
  if(!scoringModeValid)return null;
  const perModelWounds=Number(target?.profile?.characteristics?.wounds ?? target?.datasheet?.characteristics?.wounds);
  const startingStrength=Number(target?.startingStrength);
  if(slug==='a-grievous-blow'&&Number.isFinite(startingStrength)&&startingStrength>=13)
    return {score:0.91,vp:mode==='fixed'?4:5,
      reason:'This enemy unit has recorded Starting Strength 13+ and can satisfy A Grievous Blow if destroyed.'};
  if(slug==='bring-it-down'&&Number.isFinite(perModelWounds)&&perModelWounds>=10)
    return {score:0.92,vp:mode==='fixed'?4:5,
      reason:'This enemy datasheet has a model Wounds characteristic of 10+ and can satisfy Bring it Down if a qualifying model is destroyed.'};
  if(slug==='no-prisoners')
    return {score:0.72,vp:2,
      reason:'Destroying this enemy unit contributes 2 VP to No Prisoners, subject to the 5 VP Tactical card cap.'};
  if(slug==='overwhelming-force'){
    // The card tests WHERE THE ENEMY STARTED THE TURN, not its current
    // marker. If the turn-start record is absent, withhold numeric relevance.
    const start=getUnitStateAtTurnStart(state,target.id,state.turn);
    const position=start?.position;
    if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y) &&
      (state.objectives??[]).some(obj=>obj?.position&&
        Math.hypot(position.x-obj.position.x,position.y-obj.position.y)<=3))
      return {score:0.94,vp:3,
        reason:'The recorded turn-start location was within the map’s approximate 3-inch objective radius; destruction may support Overwhelming Force. Confirm physical range.'};
  }
  return null;
}

function vpFromWindows(definition, mode) {
  const windows = Array.isArray(definition?.scoringWindows) ? definition.scoringWindows : [];
  const relevant = windows.filter((window) =>
    !Array.isArray(window?.modes) || !window.modes.length || !mode || window.modes.includes(mode)
  );
  let best = 0;
  for (const window of relevant) {
    const tiers = Array.isArray(window?.tiers) ? window.tiers : [];
    const cumulative = tiers.filter((tier) => tier?.relationship === "cumulative")
      .reduce((sum, tier) => sum + (Number(tier?.vp) || 0), 0);
    const bestExclusive = tiers.filter((tier) => tier?.relationship !== "cumulative")
      .reduce((max, tier) => Math.max(max, Number(tier?.vp) || 0), 0);
    const maxCap = tiers.reduce((max, tier) => Math.max(max, Number(tier?.maxVP) || 0), 0);
    best = Math.max(best, maxCap, bestExclusive + cumulative);
  }
  return best || null;
}

function signalVp(state, playerId, definition, target, { allowUnverified = false } = {}) {
  if (!definition || (!allowUnverified && definition.rulesVerified !== true)) return null;
  const mode = getSecondaryMissionMode(state, playerId) ?? definition.missionMode ?? null;
  const slug = definitionSlug(definition);
  if (slug === "assassination" && hasKeyword(state, target, "character")) {
    if (mode === "tactical") return 5;
    if (mode === "fixed") {
      const wounds = Number(target?.wounds ?? target?.profile?.characteristics?.wounds ?? target?.characteristics?.wounds);
      return Number.isFinite(wounds) && wounds >= 4 ? 4 : 3;
    }
  }
  return vpFromWindows(definition, mode);
}

/**
 * Active secondary cards influence target ranking only when their stored rules
 * are verified or when they contain an explicit structured destruction target.
 * Draft/unverified card text remains visible but cannot silently alter advice.
 */
export function getTargetSecondaryMissionImpact(state, { playerId, targetUnitId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({
      score: 0,
      label: "none",
      confidence: "low",
      potentialVp: 0,
      denialVp: 0,
      manualReferenceVp: 0,
      scoringSignals: Object.freeze([]),
      denialSignals: Object.freeze([]),
      unresolvedMissions: Object.freeze([]),
      reason: "No active secondary target context is available."
    });
  }

  const own = activeSecondaryEntries(state, playerId);
  const opponentEntries = opponentPlayerIds(state, playerId)
    .flatMap((id) => activeSecondaryEntries(state, id));
  const scoringSignals = [];
  const denialSignals = [];
  const unresolvedMissions = [];
  const manualVpReferences = [];

  for (const entry of own) {
    const definition = entry.definition ?? {};
    const slug = definitionSlug(definition);
    const verified = definition.rulesVerified === true;
    const vpAtStake = signalVp(state, playerId, definition, target);

    if (structuredDestructionRelevance(definition, targetUnitId)) {
      scoringSignals.push({
        missionId: definition.id,
        missionName: definition.name ?? definition.id,
        score: 1,
        vpAtStake,
        confidence: verified ? "high" : "moderate",
        reason: "This active secondary contains a structured destruction condition for the selected target."
      });
      continue;
    }

    if (verified && slug === "assassination" && hasKeyword(state, target, "character")) {
      scoringSignals.push({
        missionId: definition.id,
        missionName: definition.name ?? "Assassination",
        score: 1,
        vpAtStake,
        confidence: "high",
        reason: `Active Assassination makes this enemy CHARACTER a directly scoring-relevant target${vpAtStake ? ` with about ${vpAtStake} VP of verified card leverage` : ""}.`
      });
      continue;
    }

    if(verified) {
      const destruction=relevantDestructionCard(state,playerId,definition,target);
      if(destruction){
        scoringSignals.push({
          missionId:definition.id,missionName:definition.name??definition.id,
          score:destruction.score,vpAtStake:destruction.vp,
          confidence:slug==='overwhelming-force'?'moderate':'high',
          reason:destruction.reason
        });
        continue;
      }
    }

    if (verified && slug === "centre-ground") {
      const relevance = centreGroundRelevance(state, target);
      if (relevance) {
        scoringSignals.push({
          missionId: definition.id,
          missionName: definition.name ?? "Centre Ground",
          score: relevance.score,
          vpAtStake,
          confidence: relevance.distance <= 3 ? "moderate" : "low",
          reason: `This enemy is approximately ${relevance.distance.toFixed(1)} inches from battlefield centre; removing it may help clear Centre Ground${vpAtStake ? ` for up to ${vpAtStake} verified VP` : ""}. Exact tabletop distance remains authoritative.`
        });
      }
      continue;
    }

    if (!verified) {
      unresolvedMissions.push(definition.name ?? definition.id ?? "Unverified secondary");
      const referenceVp = signalVp(state, playerId, definition, target, { allowUnverified: true });
      if (referenceVp) manualVpReferences.push({ missionName: definition.name ?? definition.id, vp: referenceVp });
    }
  }

  for (const entry of opponentEntries) {
    const definition = entry.definition ?? {};
    const slug = definitionSlug(definition);
    const verified = definition.rulesVerified === true;
    const opponentId = entry.playerId;

    if (verified && slug === "centre-ground") {
      const relevance = centreGroundRelevance(state, target);
      if (relevance) {
        const vpAtStake = signalVp(state, opponentId, definition, target);
        denialSignals.push({
          missionId: definition.id,
          missionName: definition.name ?? "Centre Ground",
          score: relevance.score,
          vpAtStake,
          confidence: relevance.distance <= 3 ? "moderate" : "low",
          reason: `This opponent unit is approximately ${relevance.distance.toFixed(1)} inches from battlefield centre and may be contributing to their Centre Ground scoring${vpAtStake ? ` worth up to ${vpAtStake} verified VP` : ""}.`
        });
      }
      continue;
    }

    if(verified && slug==='beacon' && entry.cardState?.beaconUnitId===target.id) {
      denialSignals.push({
        missionId:definition.id,missionName:definition.name??'Beacon',
        score:0.95,vpAtStake:signalVp(state,opponentId,definition,target),
        confidence:'high',
        reason:'This enemy is their permanently designated Beacon unit; destroying it can prevent future Beacon scoring and replacement is not allowed.'
      });
      continue;
    }
    if(verified && slug==='burden-of-trust' &&
      (entry.cardState?.burdenTrustAssignments??[]).some(a=>a.unitId===target.id &&
        Number(a.expiresAtTurn)>Number(state.turn??0))) {
      denialSignals.push({
        missionId:definition.id,missionName:definition.name??'Burden of Trust',
        score:0.83,vpAtStake:2,confidence:'moderate',
        reason:'This enemy is a currently assigned Burden of Trust guard; destruction can deny its guarded objective scoring at the opponent-turn checkpoint.'
      });
      continue;
    }

    if (!verified) unresolvedMissions.push(definition.name ?? definition.id ?? "Unverified opponent secondary");
  }

  const bestScoring = scoringSignals.reduce((best, signal) => Math.max(best, signal.score), 0);
  const bestDenial = denialSignals.reduce((best, signal) => Math.max(best, signal.score), 0);
  const potentialVp = scoringSignals.reduce((best, signal) => Math.max(best, Number(signal.vpAtStake) || 0), 0);
  const denialVp = denialSignals.reduce((best, signal) => Math.max(best, Number(signal.vpAtStake) || 0), 0);
  const manualReferenceVp = manualVpReferences.reduce((best, signal) => Math.max(best, Number(signal.vp) || 0), 0);
  const score = clamp01(Math.max(
    bestScoring,
    0.8 * bestDenial,
    0.65 * bestScoring + 0.35 * bestDenial
  ));
  const evidence = [...scoringSignals, ...denialSignals];
  const confidence = evidence.some((signal) => signal.confidence === "high")
    ? "high"
    : evidence.some((signal) => signal.confidence === "moderate")
      ? "moderate"
      : "low";

  const reasonParts = evidence.map((signal) => signal.reason);
  if (unresolvedMissions.length) {
    reasonParts.push(`${[...new Set(unresolvedMissions)].join(", ")} are active but their target-specific effect is not used for ranking because the stored card rules are not verified.`);
  }
  if (manualVpReferences.length) {
    reasonParts.push(`Unverified card references show up to ${manualReferenceVp} VP in the relevant mission data; this is displayed for manual review only and does not alter ranking.`);
  }

  return Object.freeze({
    score,
    label: impactLabel(score),
    confidence,
    potentialVp,
    denialVp,
    manualReferenceVp,
    scoringSignals: Object.freeze(scoringSignals.map((signal) => Object.freeze({ ...signal }))),
    denialSignals: Object.freeze(denialSignals.map((signal) => Object.freeze({ ...signal }))),
    unresolvedMissions: Object.freeze([...new Set(unresolvedMissions)]),
    manualVpReferences: Object.freeze(manualVpReferences.map((signal) => Object.freeze({ ...signal }))),
    reason: reasonParts.join(" ") || "No verified active secondary directly changes this target's priority."
  });
}
