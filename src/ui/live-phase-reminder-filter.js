// The phase sidebar is an action surface, not the complete rules reference.
// This filter never changes recorded rules or the unfiltered Rules dialog.
const ATTACK_RULES = new Set([
  'captain-general', 'captain-general-range-check', 'stand-vigil',
  'slayer-of-tyrants', 'strike-from-skies', 'purity-of-execution',
  'weapon-keywords', 'venatari-deep-strike', 'martial-mastery'
]);
const DEFENCE_RULES = new Set([
  'living-fortress', 'praesidium-shield', 'unyielding-ancient',
  'guardian-eternal', 'daughters-of-the-abyss', 'aegis-of-the-emperor'
]);
const REFERENCE_ONLY = new Set(['opponent-doctrine','katah-readiness']);
import { isRulesPhaseOpening } from '../rules/rules-phase-window.js';

export function getLivePhaseReminderEntries(state, { playerId, selectedUnitId = null, entries = [] } = {}) {
  if (state?.battle?.status !== 'active' || !playerId) return [];
  const ownTurn = (state.activePlayer ?? state.battle?.activePlayerId) === playerId;
  const selectedFriendly = (state.units ?? []).some(unit => unit.id === selectedUnitId && unit.ownerId === playerId);
  // A friendly unit can fight legally on the opponent's turn. Show its
  // offensive Fight decisions only when that unit is actually selected.
  const attackingNow = ownTurn || state.phase === 'fight' && selectedFriendly;
  return entries.flatMap(entry => {
    if (!entry || REFERENCE_ONLY.has(entry.ruleId)) return [];
    if (ATTACK_RULES.has(entry.ruleId) && !attackingNow) return [];
    if (DEFENCE_RULES.has(entry.ruleId) && (ownTurn || !selectedFriendly)) return [];
    if (entry.ruleId === 'moment-shackle' && !entry.used) {
      const choices = (entry.choices ?? []).filter(choice => choice.id === (attackingNow ? 'attacks' : 'save'));
      return choices.length ? [{...entry, choices, effect: choices[0].effect}] : [];
    }
    if (entry.ruleId === 'katah-fight-window') {
      const names = ownTurn ? ['Dacatarai', 'Rendax', 'Kaptaris']
        : isRulesPhaseOpening(state) ? ['Dacatarai', 'Kaptaris']
          : selectedFriendly ? ['Rendax'] : [];
      const katahChoices = (entry.katahChoices ?? []).filter(choice => names.includes(choice.id));
      if (!katahChoices.length) return [];
      const katahEffectLines = (entry.katahEffectLines ?? []).filter(line => names.includes(line.name));
      return [{...entry, katahChoices, katahEffectLines,
        effect: katahEffectLines.map(line => line.name + ': ' + line.effect).join(' ')}];
    }
    if (entry.ruleId?.startsWith('favoured-katah:')) {
      if (!attackingNow && !/Kaptaris/i.test(entry.title ?? '')) return [];
      if (ownTurn && /Kaptaris/i.test(entry.title ?? '')) return [];
    }
    if (entry.ruleId?.startsWith('detachment-rule:') &&
      /When this unit is selected to attack|When attacking/i.test(entry.timing ?? '') && !attackingNow) return [];
    return [entry];
  });
}
