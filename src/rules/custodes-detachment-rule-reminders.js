import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_RULE_SOURCES } from '../data/adeptus-custodes-faction-rules.js';
import { getBattleUnitDatasheet } from './battle-unit-reference.js';
import { getCustodesKatahState } from './custodes-tactical-advisor.js';
import { isRulesPhaseOpening } from './rules-phase-window.js';
import { getCommandPointBalance } from '../engine/command-points-ledger.js';
import { getActiveCustodesDetachmentStratagemUse } from './stratagem-use-state.js';

const DETACHMENT_REMINDERS = Object.freeze({
  'Shadowkeepers': { phases: ['fight'], turn: 'opponent', timing: 'When targeted by melee attacks', effect: 'If this non-Monster/Vehicle unit is within objective range and the attack Strength is greater than its Toughness, the attack is −1 to Wound. Confirm objective range and Strength at the table.' },
  'Solar Watch': { phases: ['charge'], turn: 'own', timing: 'After this unit Falls Back', effect: 'Talon Sortie keeps this unit eligible to declare a Charge after it Falls Back.' },
  'Aquilan Shield': { phases: ['shooting'], turn: 'opponent', timing: 'When targeted by ranged attacks', effect: 'If this non-Monster/Vehicle unit is within objective range and the attack Strength is greater than its Toughness, the attack is −1 to Wound. Confirm objective range and Strength at the table.' },
  'Dread Host': { phases: ['charge'], turn: 'own', timing: 'When making a Charge roll', effect: 'Instruments of the Emperor’s Wrath allows this unit to re-roll its Charge roll.' },
  'Emissaries Imperatus': { phases: ['fight'], timing: 'Fight phase selection order', effect: 'Heralds of the Throne gives eligible Custodes units Fights First. Check all Fights First units before choosing the next unit to fight.' },
  "Emperor's Chosen": { phases: ['shooting', 'fight'], turn: 'own', timing: 'When this unit is selected to attack', effect: 'Magna Imperator allows this unit to re-roll one Hit roll and one Wound roll for its attacks.' },
  'Auric Champions': { phases: ['command'], turn: 'own', timing: 'Your Command phase', effect: 'Assemblage of Might: choose one enemy unit as the dreadful foe until your next Command phase. Custodes Character attacks against it gain +1 to Wound.' },
  'Honoured Companions': { phases: ['shooting', 'fight'], turn: 'own', timing: 'When attacking', effect: 'If this Trusted Sentinel unit is within objective range, Companion’s Watch lets it re-roll Wound rolls of 1. Confirm objective range at the table.' },
  'Lions of the Emperor': { phases: ['fight'], turn: 'opponent', timing: 'End of your opponent’s Fight phase', effect: 'On Gilded Wings: each unengaged Custodes Terminator unit can be placed into Strategic Reserves.' },
  'Might of the Moritoi': { phases: ['command', 'movement', 'shooting', 'charge', 'fight'], timing: 'When resolving Dreadnought rules', effect: 'Moritoi Ancients changes with remaining wounds: +2 OC at starting strength; re-roll Hit rolls of 1 below starting strength; also re-roll Wound rolls of 1 below half strength. The Tactical Advisor models these thresholds when wounds are tracked.' },
  'Grav-Assault Force': { phases: ['shooting'], turn: 'opponent', timing: 'When targeted by ranged attacks', effect: 'Flare Shields gives eligible Grav-Assault units a 4+ invulnerable save against ranged attacks.' },
  'Null Maiden Vigil': { phases: ['command'], turn: 'opponent', timing: 'Opponent’s Battle-shock step', effect: 'Creeping Dread: each enemy Psyker or below-starting-strength unit within 12″ of an Anathema Psykana unit must take a Battle-shock test at −1. Check each aura and eligibility at the table.' }
});
const KATAH_PHASE = Object.freeze({ Conservai: 'command', Calistus: 'movement', Salvus: 'shooting', Dacatarai: 'fight', Kaptaris: 'fight', Rendax: 'fight' });

function selectedDetachments(state, playerId) {
  const roster = state?.armyRosters?.[playerId];
  const names = [...new Set([
    ...(Array.isArray(roster?.detachments) ? roster.detachments : []),
    roster?.detachment,
    roster?.detachmentName
  ].map(item => typeof item === 'string' ? item : item?.name).filter(Boolean))];
  return names.map(name => ADEPTUS_CUSTODES_DETACHMENTS.find(item => item.name === name)).filter(Boolean);
}

export function getCustodesDetachmentStratagemReminders(state, { playerId } = {}) {
  if (state?.battle?.status !== 'active' || !playerId || String(state?.armyRosters?.[playerId]?.faction ?? '').toLowerCase() !== 'adeptus custodes') return [];
  const activePlayer = state.activePlayer ?? state.battle?.activePlayerId;
  const ownTurn = activePlayer === playerId;
  const phase = String(state.phase ?? '').toLowerCase();
  const cp = getCommandPointBalance(state, playerId);
  return selectedDetachments(state, playerId).filter(detachment => detachment.name !== 'Guardians of the Throne')
    .flatMap(detachment => (detachment.stratagems ?? []).filter(stratagem => {
      const timing = String(stratagem.timing ?? '').toLowerCase();
      const phaseMatches = timing.includes('any phase') || timing.includes(`${phase} phase`);
      const turnMatches = timing.includes('either') ? true : timing.includes('opponent') ? !ownTurn : !timing.includes('your ') || ownTurn;
      return phaseMatches && turnMatches;
    }).map(stratagem => ({
      detachmentName: detachment.name,
      title: stratagem.name,
      cpCost: stratagem.cpCost,
      timing: stratagem.timing,
      effect: stratagem.description,
      affordable: cp >= Number(stratagem.cpCost ?? 1),
      sourceUrl: ADEPTUS_CUSTODES_RULE_SOURCES.currentReference
    })));
}

export function getCustodesDetachmentRuleReminders(state, { playerId, unitId = null } = {}) {
  if (state?.battle?.status !== 'active' || !playerId || String(state?.armyRosters?.[playerId]?.faction ?? '').toLowerCase() !== 'adeptus custodes') return [];
  const activePlayer = state.activePlayer ?? state.battle?.activePlayerId;
  const ownTurn = activePlayer === playerId;
  const unit = unitId ? state.units?.find(item => item.id === unitId && item.ownerId === playerId) : null;
  const matching = selectedDetachments(state, playerId).flatMap(detachment => {
    const entries = [];
    if (detachment.name === 'Guardians of the Throne') return entries;
    if (unit && detachment.name==='Dread Host' && getActiveCustodesDetachmentStratagemUse(state,{unitId:unit.id,stratagemId:'golden-light-of-the-moiraides'})) entries.push({
      ruleId:'detachment-stratagem:golden-light-of-the-moiraides',playerId,unitId:unit.id,unitName:unit.name,
      title:'Golden Light of the Moiraides',kind:'detachment',timing:'Active until the start of your next turn',
      effect:'Attacks targeting this unit are -1 to Hit. Enemy units cannot target it with Snap Shooting.',
      sourceUrl:ADEPTUS_CUSTODES_RULE_SOURCES.currentReference,available:true
    });
    const reminder = DETACHMENT_REMINDERS[detachment.name];
    if (reminder && reminder.phases.includes(state.phase) && !(reminder.turn === 'own' && !ownTurn || reminder.turn === 'opponent' && ownTurn)) {
      let include = true;
      if (detachment.name === 'Solar Watch') {
        include = (state.history ?? []).some(event => event.type === 'unit.fell_back' &&
          event.payload?.round === state.battle?.round && event.payload?.turn === state.turn &&
          (!unit || event.payload?.unitId === unit.id) && state.units?.some(item => item.id === event.payload?.unitId && item.ownerId === playerId));
      }
      if (include && unit && ['Lions of the Emperor', 'Grav-Assault Force'].includes(detachment.name)) {
        const keywords = (getBattleUnitDatasheet(state, unit)?.keywords ?? []).map(keyword => String(keyword).toLowerCase());
        const required = detachment.name === 'Lions of the Emperor' ? 'terminator' : 'grav-assault';
        include = keywords.some(keyword => keyword.includes(required));
      }
      if (include) entries.push({
        ruleId: `detachment-rule:${detachment.name}`,
        playerId,
        unitId: unit?.id ?? null,
        unitName: unit?.name ?? null,
        title: detachment.ruleName,
        kind: 'detachment',
        timing: reminder.timing,
        effect: reminder.effect,
        sourceUrl: 'https://www.warhammer-community.com/en-gb/articles/joz5iubm/your-first-look-at-13-new-adeptus-custodes-detachments/',
        available: true
      });
    }
    const favouredKatah = detachment.favouredKatah;
    const phaseMatches = favouredKatah && KATAH_PHASE[favouredKatah] === state.phase &&
      (!['Dacatarai', 'Kaptaris'].includes(favouredKatah) || isRulesPhaseOpening(state));
    const readyUnit = phaseMatches && (state.units ?? []).find(candidate => candidate.ownerId === playerId && candidate.status === 'deployed' &&
      getCustodesKatahState(state, { playerId, unitId: candidate.id }).readied);
    if (readyUnit) entries.push({
      ruleId: `favoured-katah:${detachment.name}`,
      playerId,
      unitId: readyUnit.id,
      unitName: unit?.name ?? readyUnit.name,
      title: `${detachment.name} · Favoured ${favouredKatah}`,
      kind: 'detachment',
      timing: `When a readied unit uses ${favouredKatah}`,
      effect: detachment.favouredKatahEffect,
      sourceUrl: 'https://www.warhammer-community.com/en-gb/articles/joz5iubm/your-first-look-at-13-new-adeptus-custodes-detachments/',
      available: true
    });
    return entries;
  });
  return matching;
}
