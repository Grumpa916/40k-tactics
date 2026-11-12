import { ADEPTUS_CUSTODES_DATASHEET_DETAILS } from '../data/adeptus-custodes-datasheet-details.js';
import { getUnitUpgradeNames } from './custodes-unit-upgrades.js';
import { getSpaceMarineEnhancementDefinitions } from './space-marines-enhancements.js';
import { getActiveSpaceMarineUnitDoctrines } from './space-marine-doctrines.js';
import { getRosterDetachmentNames } from './roster-detachment-selection.js';
import { getBattleRosterUnit, getBattleUnitDatasheet, getCombatFormationMembers, getCombatFormationRoot } from './battle-unit-reference.js';
import { getActiveGuardiansEffects } from './stratagem-use-state.js';
import { rulesContextKey } from './rules-phase-window.js';

// Only these reviewed descriptions are modeled. An older saved datasheet with a
// different rule bearing the same name must not silently receive today's effect.
const rules = [
  ['aegis-of-the-emperor','shield-captain','Aegis of the Emperor'],
  ['slayer-of-tyrants','allarus-custodians','Slayer of Tyrants'],
  ['dread-foe','aquilon-terminators-with-solarite-power-gauntlets','Dread Foe'],
  ['reap-a-terrible-tally','aquilon-terminators-with-solarite-power-talons','Reap a Terrible Tally'],
  ['quicksilver-execution','vertus-praetors','Quicksilver Execution'],
  ['death-blow','gyrfalcon-jetbike-sodality','Death Blow'],
  ['destructor-optics','caladius-grav-tank','Destructor Optics'],
  ['living-fortress','custodian-wardens','Living Fortress'],
  ['golden-laurels','valerian','Golden Laurels'],
  ['sentinel-shield','sentinel-guard-sodality','Praesidium Shield'],
  ['unyielding-ancient','contemptor-galatus-dreadnought','Unyielding Ancient'],
  ['guardian-eternal','telemon-heavy-dreadnought','Guardian Eternal'],
  ['swift-onslaught','blade-champion','Swift Onslaught']
].map(([id, datasheetId, name]) => ({ id, name,
  description: ADEPTUS_CUSTODES_DATASHEET_DETAILS[`adeptus-custodes:${datasheetId}`]?.abilities.find(ability => ability.name === name)?.description
}));
const normalized = value => String(value ?? '').trim().toLowerCase();

function matches(datasheet, rule) {
  return rule.description && (datasheet?.abilities ?? []).some(ability =>
    normalized(ability.name) === normalized(rule.name) && normalized(ability.description) === normalized(rule.description));
}

export function getRecordedCombatRules(state, unit) {
  const root = getCombatFormationRoot(state, unit);
  const members = getCombatFormationMembers(state, root).filter(member => member.status === 'deployed');
  const datasheets = members.map(member => getBattleUnitDatasheet(state, member));
  const effects = rules.filter(rule => datasheets.some(datasheet => matches(datasheet, rule))).map(rule => rule.id);
  // Unit-wide Tyranid Enhancements apply to the attached formation; effects
  // worded "bearer" stay on that single model. Do not infer unrecorded
  // once-per-battle activations or selected target conditions.
  const unitWideTyranid = new Set([
    'Ocular Adaptation', 'Parasitic Biomorphology', 'Destabilising Predation'
  ]);
  const ownRosterUnit=getBattleRosterUnit(state, unit);
  const ownerRoster=state?.armyRosters?.[unit?.ownerId];
  const selectedDetachments=new Set(getRosterDetachmentNames(ownerRoster));
  const ownId=String(ownRosterUnit?.datasheetId??'').toLowerCase();
  if(ownId.startsWith('space-marines:')){
    for(const doctrine of getActiveSpaceMarineUnitDoctrines(state,unit))
      effects.push('marine-doctrine-'+doctrine);
    const ownKeywords=[...(ownRosterUnit?.datasheet?.keywords??[]),...(ownRosterUnit?.keywords??[])].map(normalized);
    if(selectedDetachments.has('Ironclad Champions') &&
      (ownId.includes('dreadnought')||ownKeywords.includes('dreadnought')))
      effects.push('marine-ironclad-champions');
    const toCode=name=>'marine-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    for(const def of getSpaceMarineEnhancementDefinitions(ownRosterUnit)){
      effects.push(toCode(def.name));
    }
    // Only explicit unit-wide permanent effects pass between attached members.
    // Bearer-only defences and weapon bonuses stay on the equipped model.
    const unitWideNames=new Set(['Furious Assault','Champion of the First Company','Honour of Vigilance']);
    for(const member of members)for(const def of getSpaceMarineEnhancementDefinitions(getBattleRosterUnit(state,member))){
      if(unitWideNames.has(def.name) && !effects.includes(toCode(def.name))) effects.push(toCode(def.name));
    }
  }
  if(ownId.startsWith('tyranids:')){
    if(selectedDetachments.has('Subterranean Assault'))
      effects.push('tyranid-surprise-assault');
    if(selectedDetachments.has('Ambush Predators') &&
      ['tyranids:lictor','tyranids:neurolictor'].includes(ownId))
      effects.push('tyranid-mindhunger');
  }
  const ownEnhancements = ownId.startsWith('tyranids:')?getUnitUpgradeNames(ownRosterUnit):[];
  for (const name of ownEnhancements) effects.push('tyranid-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
  for (const member of members) {
    for (const name of getUnitUpgradeNames(getBattleRosterUnit(state, member))) {
      if (!unitWideTyranid.has(name)) continue;
      const code='tyranid-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if (!effects.includes(code)) effects.push(code);
    }
  }
  const ownDatasheet = getBattleUnitDatasheet(state, unit);
  const rosterUnit = getBattleRosterUnit(state, unit);
  const shield = ADEPTUS_CUSTODES_DATASHEET_DETAILS['adeptus-custodes:shield-captain'].abilities.find(ability => ability.name === 'Praesidium Shield');
  const validEquipment = !['source-invalid','rules-invalid','manual-selection-required','unverified'].includes(rosterUnit?.loadoutValidation?.status);
  if (validEquipment && matches(ownDatasheet, shield) &&
      rosterUnit?.equippedWargear?.some(item => normalized(item.name) === 'praesidium shield' && item.quantity > 0)) {
    effects.push('captain-shield');
  }
  const fnp = (ownDatasheet?.abilities ?? []).flatMap(ability => {
    const match = String(ability.name ?? '').match(/^Feel No Pain ([2-6])\+$/i);
    // Conditional FNP (mortal/psychic wounds, objective range, etc.) is not general protection.
    return match && /^This (?:model|unit) has Feel No Pain [2-6]\+\.$/i.test(ability.description ?? '') ? [Number(match[1])] : [];
  });
  const memberIds = new Set(members.map(member => member.id));
  const chargedThisTurn = (state?.history ?? []).some(event => event?.type === 'charge.outcome_recorded' &&
    event.payload?.outcome === 'successful' && memberIds.has(event.payload.unitId) &&
    event.payload.turn === state.turn && (event.payload.round == null || event.payload.round === state.battle?.round));
  const rootToughness = root?.characteristics?.toughness ?? root?.profile?.characteristics?.toughness ?? getBattleUnitDatasheet(state, root)?.characteristics?.Toughness;
  const auramiteAttackers=getActiveGuardiansEffects(state,unit.id).filter(use=>use.stratagemId==='in-auramite-clad').map(use=>use.enemyUnitId);
  const kaptaris=state.phase==='fight' && (state.history??[]).some(event=>event.type==='custodes.katah_expended' && event.payload?.unitId===root?.id && event.payload.katahName==='Kaptaris' && event.payload.round===state.battle?.round && event.payload.turn===state.turn);
  const shackleSave=(state.history??[]).some(event=>event.type==='rules.reminder_used' && event.payload?.unitId===unit.id && event.payload.ruleId==='moment-shackle' && event.payload.choice==='save' && event.payload.contextKey===rulesContextKey(state));
  return { effects, chargedThisTurn, formationRootId:root?.id??unit.id, auramiteAttackers,kaptaris,temporaryInvulnerableSave:shackleSave?3:null,
    unitToughness: Number.isFinite(Number(rootToughness)) && Number(rootToughness) > 0 ? Number(rootToughness) : null,
    feelNoPain: fnp.length ? Math.min(...fnp) : 0 };
}
