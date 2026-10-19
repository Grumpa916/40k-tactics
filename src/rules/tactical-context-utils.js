import { getBattleUnitDatasheet } from "./battle-unit-reference.js";

export function unitsOf(state) {
  return Array.isArray(state?.units) ? state.units : [];
}

export function unitById(state, unitId) {
  return unitsOf(state).find((unit) => unit?.id === unitId) ?? null;
}

export function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function impactLabel(score) {
  if (score >= 0.75) return "high";
  if (score >= 0.4) return "moderate";
  if (score > 0) return "low";
  return "none";
}

export function opponentPlayerIds(state, playerId) {
  const fromPlayers = (Array.isArray(state?.players) ? state.players : [])
    .map((player) => player?.id)
    .filter((id) => id && id !== playerId);
  const fromUnits = unitsOf(state)
    .map((unit) => unit?.ownerId)
    .filter((id) => id && id !== playerId);
  return [...new Set([...fromPlayers, ...fromUnits])];
}

export function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

export function unitPosition(unit) {
  const models = Array.isArray(unit?.models) ? unit.models : [];
  const positions = models
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

export function distanceBetween(first, second) {
  if (!validPosition(first) || !validPosition(second)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function targetKeywords(state, target) {
  const datasheet = getBattleUnitDatasheet(state, target);
  const sources = [
    target?.keywords,
    target?.profile?.keywords,
    target?.metadata?.keywords,
    datasheet?.keywords
  ];
  return [...new Set(sources.flatMap((value) => Array.isArray(value) ? value : []))]
    .map((keyword) => String(keyword).trim().toLowerCase())
    .filter(Boolean);
}

export function hasKeyword(state, target, keyword) {
  const normalized = String(keyword).trim().toLowerCase();
  return targetKeywords(state, target).includes(normalized);
}
