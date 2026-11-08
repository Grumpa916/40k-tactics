import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_RULE_SOURCES } from '../data/adeptus-custodes-faction-rules.js';
import { getBattleUnitDatasheet, getCombatFormationMembers, getCombatFormationRoot } from './battle-unit-reference.js';
import { getCustodesKatahState } from './custodes-tactical-advisor.js';
import { isRulesPhaseOpening } from './rules-phase-window.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { getCommandPointBalance } from '../engine/command-points-ledger.js';
import { getActiveCustodesDetachmentStratagemUse } from './stratagem-use-state.js';
import { isStratagemTimingRelevant } from './stratagem-timing.js';

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

const formationKeywords = (state, unit) => {
  const root = getCombatFormationRoot(state, unit) ?? unit;
  return getCombatFormationMembers(state, root).flatMap(member =>
    getBattleUnitDatasheet(state, member)?.keywords ?? []
  ).map(value => String(value ?? '').trim().toLowerCase());
};
const isAnathemaDetachment = name => ['Null Maiden Vigil', 'Silent Hunters'].includes(name);
function liveStratagemTargetEligible(state, playerId, detachmentName, stratagemName, unit) {
  if (!unit || unit.ownerId !== playerId || unit.status !== 'deployed') return false;
  const root = getCombatFormationRoot(state, unit) ?? unit;
  if (root.id !== unit.id) return false;
  const keywords = formationKeywords(state, root);
  const has = keyword => keywords.some(value => value.includes(keyword));
  if (!has('adeptus custodes')) return false;
  if (has('anathema psykana') && !isAnathemaDetachment(detachmentName)) return false;
  const anathemaTarget = {
    'Anathema Blademastery': 'vigilator',
    'Psy-Chaff Volley': 'prosecutor',
    'Purgation Sweep': 'witchseeker'
  }[stratagemName];
  if (isAnathemaDetachment(detachmentName) && anathemaTarget && !has(anathemaTarget)) return false;
  const required = {
    'Vigil Unending': 'terminator',
    'Fury of the Emperor': 'terminator',
    'Unleash the Lions': 'terminator',
    'Honoured Interred': 'dreadnought',
    'Unstoppable Momentum': 'dreadnought'
  }[stratagemName];
  if (required && !has(required)) return false;
  if (stratagemName === 'In Auramite Clad' && has('custodian wardens')) return false;
  if (stratagemName === 'Fury of the Emperor' && !(state.history ?? []).some(event =>
    event.type === 'unit.arrived_from_reserves' && event.payload?.unitId === root.id &&
    event.payload?.round === state.battle?.round && event.payload?.turn === state.turn
  )) return false;
  if (stratagemName === 'Unceasing Onslaught') {
    const move = (state.history ?? []).findLast(event =>
      ['unit.normal_move_resolved', 'unit.advanced', 'unit.fell_back', 'unit.stationary_recorded'].includes(event.type) &&
      event.payload?.round === state.battle?.round && event.payload?.turn === state.turn &&
      !event.payload?.movementRefinement
    );
    if (move?.type !== 'unit.advanced' || move.payload?.unitId !== root.id) return false;
  }
  if (stratagemName === 'Impenetrable Bastion' && (has('monster') || has('vehicle'))) return false;
  return true;
}
function hasLiveStratagemTarget(state, playerId, detachmentName, stratagemName, unitId = null) {
  const selected = unitId ? state.units?.find(unit => unit.id === unitId) : null;
  const selectedRoot = selected ? getCombatFormationRoot(state, selected) ?? selected : null;
  const roots = (state.units ?? []).filter(unit => unit.ownerId === playerId && unit.status === 'deployed' &&
    (getCombatFormationRoot(state, unit)?.id ?? unit.id) === unit.id);
  const candidates = roots.filter(unit => liveStratagemTargetEligible(state, playerId, detachmentName, stratagemName, unit));
  return selectedRoot ? candidates.some(unit => unit.id === selectedRoot.id) : candidates.length > 0;
}
export function getCustodesDetachmentStratagemReminders(state, { playerId, unitId = null, livePanel = false } = {}) {
  if (state?.battle?.status !== 'active' || !playerId || String(state?.armyRosters?.[playerId]?.faction ?? '').toLowerCase() !== 'adeptus custodes') return [];
  const activePlayer = state.activePlayer ?? state.battle?.activePlayerId;
  const ownTurn = activePlayer === playerId;
  const phase = String(state.phase ?? '').toLowerCase();
  const cp = getCommandPointBalance(state, playerId);
  return selectedDetachments(state, playerId).filter(detachment => detachment.name !== 'Guardians of the Throne')
    .flatMap(detachment => (detachment.stratagems ?? []).filter(stratagem =>
      isStratagemTimingRelevant(stratagem, phase, { isYourTurn: ownTurn }) &&
      (!livePanel || hasLiveStratagemTarget(state, playerId, detachment.name, stratagem.name, unitId))
    ).map(stratagem => ({
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
      if (include && unit) {
        const keywords = formationKeywords(state, unit);
        const has = keyword => keywords.some(value => value.includes(keyword));
        if (detachment.name === "Emperor's Chosen") include = has('adeptus custodes') && !has('anathema psykana');
        if (detachment.name === 'Might of the Moritoi') include = has('dreadnought');
        if (['Lions of the Emperor', 'Grav-Assault Force'].includes(detachment.name)) {
          const required = detachment.name === 'Lions of the Emperor' ? 'terminator' : 'grav-assault';
          include = keywords.some(keyword => keyword.includes(required));
        }
        if (detachment.name === 'Lions of the Emperor' &&
            getFightEngagementState(state).engagedUnitIds.includes((getCombatFormationRoot(state, unit) ?? unit).id)) include = false;
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
