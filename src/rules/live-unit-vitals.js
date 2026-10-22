import { getBattleUnitDatasheet } from './battle-unit-reference.js';

// Empty model arrays in roster-backed units mean untracked, not zero survivors.
export function getLiveUnitVitals(state, unit) {
  const roster = state.armyRosters?.[unit.ownerId]?.units?.find(item => item.id === unit.metadata?.rosterUnitId);
  const sheet = getBattleUnitDatasheet(state, unit);
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
  const startingModels = positive(unit.startingStrength ?? unit.strength?.starting ?? unit.metadata?.startingStrength ?? unit.metadata?.modelCount ?? roster?.modelCount ?? unit.modelCount) ?? (unit.models?.length || null);
  const perModel = positive(unit.profile?.characteristics?.wounds ?? unit.characteristics?.wounds ?? sheet?.characteristics?.Wounds ?? sheet?.characteristics?.wounds);
  const startingWounds = positive(unit.startingWounds) ?? (perModel && startingModels ? perModel * startingModels : null);
  const damage = (state.history ?? []).filter(event => event.type === 'combat.attack_resolved' && event.payload?.targetId === unit.id)
    .reduce((sum,event) => sum + (event.payload.actualDamage ?? event.payload.result?.damage?.totalDamage ?? 0),0);
  const wounds = unit.status === 'destroyed' ? 0 : Number.isFinite(unit.wounds) ? unit.wounds : startingWounds == null ? null : Math.max(0,startingWounds-damage);
  const models = unit.status === 'destroyed' ? 0 : Number.isFinite(unit.currentStrength) ? unit.currentStrength : Number.isFinite(unit.metadata?.currentModelCount) ? unit.metadata.currentModelCount : startingModels === 1 && wounds != null ? (wounds > 0 ? 1 : 0) : damage === 0 && (wounds == null || wounds === startingWounds) ? startingModels : null;
  return { wounds, startingWounds, models, startingModels };
}
