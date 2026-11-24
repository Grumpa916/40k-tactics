import { getBattleRulesReminders, rulesContextKey } from './battle-rules-reminders.js';
import { getBattleUnitDatasheet, getCombatFormationRoot } from './battle-unit-reference.js';

// Shared, side-effect-free prompt selector for future screen and voice delivery.
// Call at an explicit tabletop interaction boundary, not on every render.
// Prompts are conditional reminders, not authorization or automatic rule resolution.
export function getUnitReminderPrompts(state, { playerId, window, unitId = null, targetId = null } = {}) {
  if (!playerId || !window) return [];
  const phaseWide = window === 'phase-start' || window === 'phase-end';
  if (!phaseWide && !unitId) return [];
  const units = state.units ?? [];
  const unit = units.find(item => item.id === unitId && item.ownerId === playerId);
  if (unitId && (!unit || !['deployed','reserves'].includes(unit.status))) return [];
  const root = unit && getCombatFormationRoot(state, unit);
  const current = (state.history ?? []).filter(event => event.payload?.round === state.battle?.round &&
    event.payload?.turn === state.turn && (!event.payload?.phase || event.payload.phase === state.phase));
  const target = units.find(item => item.id === targetId && item.ownerId !== playerId && item.status === 'deployed');
  const keywords = (getBattleUnitDatasheet(state, target)?.keywords ?? []).map(value => String(value).toLowerCase());
  const finishedShooting = root && current.some(event => event.type === 'combat.activation_finished' &&
    event.payload.unitId === root.id && event.payload.phase === 'shooting');
  const recordedTargets = finishedShooting ? [...new Set(current.filter(event => event.type === 'combat.attack_resolved' &&
    event.payload.phase === 'shooting' && event.payload.attackerId === root.id)
    .map(event => event.payload.targetId))].filter(id => units.some(item => item.id === id &&
      item.ownerId !== playerId && item.status === 'deployed')) : [];
  return getBattleRulesReminders(state, {playerId, unitId, includeUsed:false})
    .filter(entry => entry.available && entry.promptWindow === window)
    .flatMap(entry => {
      if (entry.ruleId === 'advanced-firepower' && (!target || !keywords.some(word => ['monster','vehicle'].includes(word)))) return [];
      if (entry.ruleId === 'sanctified-flames' && (!finishedShooting || !recordedTargets.length)) return [];
      // The attack-result caller must supply the friendly target as unitId.
      // Confirm an actual wound lost rather than treating an attack as damage.
      if (entry.ruleId === 'vengeful-surge' && !current.some(event => event.type === 'combat.attack_resolved' &&
        event.payload.phase === 'shooting' && (event.payload.targetId === root?.id ||
          event.payload.allocationTargetId === entry.unitId) &&
        Number(event.payload.actualDamage ?? event.payload.result?.damage?.totalDamage ?? 0) > 0)) return [];
      return [{
        ...entry,
        promptKey: [rulesContextKey(state), window, entry.ruleId, entry.unitId, targetId ?? ''].join(':'),
        requiresTableConfirmation: true,
        ...(entry.ruleId === 'sanctified-flames' ? { candidateTargetIds: recordedTargets } : {})
      }];
    });
}
