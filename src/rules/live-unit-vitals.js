import { getBattleUnitDatasheet } from './battle-unit-reference.js';

// Empty model arrays in roster-backed units mean untracked, not zero survivors.
export function getLiveUnitVitals(state, unit) {
  const roster = state.armyRosters?.[unit.ownerId]?.units?.find(item => item.id === unit.metadata?.rosterUnitId);
  const sheet = getBattleUnitDatasheet(state, unit);
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
  // Older saves of the built-in demo predate model-count tracking. These IDs
  // identify only that seeded battle; do not infer counts for real rosters.
  const demoModels = state.battle?.id === 'integrated-demo' && !state.armyRosters?.[unit.ownerId]
    ? ({ intercessors: { name: 'Intercessor Squad', count: 5 }, captain: { name: 'Captain', count: 1 }, enemy: { name: 'Enemy Guard', count: 10 } })[unit.id] : null;
  const demoCount = demoModels?.name === unit.name ? demoModels.count : null;
  const startingModels = positive(unit.startingStrength ?? unit.strength?.starting ?? unit.metadata?.startingStrength ?? unit.metadata?.modelCount ?? roster?.modelCount ?? unit.modelCount ?? demoCount) ?? (unit.models?.length || null);
  const perModel = positive(unit.profile?.characteristics?.wounds ?? unit.characteristics?.wounds ?? sheet?.characteristics?.Wounds ?? sheet?.characteristics?.wounds);
  const startingWounds = positive(unit.startingWounds) ?? (perModel && startingModels ? perModel * startingModels : null);
  const damage = (state.history ?? []).filter(event => event.type === 'combat.attack_resolved' && event.payload?.targetId === unit.id)
    .reduce((sum,event) => sum + (event.payload.actualDamage ?? event.payload.result?.damage?.totalDamage ?? 0),0);
  const models = unit.status === 'destroyed' ? 0 : Number.isFinite(unit.currentStrength) ? unit.currentStrength : Number.isFinite(unit.metadata?.currentModelCount) ? unit.metadata.currentModelCount : startingModels === 1 ? (Number.isFinite(unit.wounds) && unit.wounds <= 0 ? 0 : startingModels) : damage === 0 ? startingModels : null;
  const woundCap = perModel && Number.isFinite(models) ? perModel * models : startingWounds;
  const wounds = unit.status === 'destroyed' ? 0 : Number.isFinite(unit.wounds)
    ? (woundCap == null ? Math.max(0, unit.wounds) : Math.min(woundCap, Math.max(0, unit.wounds)))
    : startingWounds == null ? null : Math.max(0, Math.min(woundCap ?? startingWounds, startingWounds-damage));
  return { wounds, startingWounds, woundCap, models, startingModels };
}
