import { CUSTODES_REMINDER_DEFINITIONS, GUARDIANS_REMINDER_PHASES } from '../data/custodes-reminder-definitions.js';
import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_RULE_SOURCES, ADEPTUS_CUSTODES_KATAH } from '../data/adeptus-custodes-faction-rules.js';
import { getBattleUnitDatasheet, getBattleRosterUnit, getCombatFormationRoot } from './battle-unit-reference.js';
import { getCustodesKatahState, hasCustodesDetachment } from './custodes-tactical-advisor.js';
import { getRecordedCombatRules } from './recorded-combat-rules.js';
import { getLiveUnitVitals } from './live-unit-vitals.js';
import { getDatasheetWeaponOptions } from './saved-roster-combat-profile.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS } from '../data/adeptus-custodes-datasheet-details.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { rulesContextKey, isRulesPhaseOpening } from './rules-phase-window.js';
export { rulesContextKey, isRulesPhaseOpening } from './rules-phase-window.js';

const norm = value => String(value ?? '').trim().toLowerCase();
export const reminderUseHistory = state => (state?.history ?? []).filter(event => event.type === 'rules.reminder_used').map(event => event.payload);
const ability = (state, unit, name) => (getBattleUnitDatasheet(state, unit)?.abilities ?? []).find(item => norm(item.name) === norm(name));
const reviewedAbilities = Object.values(ADEPTUS_CUSTODES_DATASHEET_DETAILS).flatMap(sheet=>sheet.abilities??[]);
const reviewedAbility = (state,unit,name) => {const selected=ability(state,unit,name);return selected && reviewedAbilities.some(item=>norm(item.name)===norm(name)&&norm(item.description)===norm(selected.description));};
const activePlayer = state => state?.activePlayer ?? state?.battle?.activePlayerId;
const isCustodes = (state, id) => norm(state?.armyRosters?.[id]?.faction) === 'adeptus custodes';

export function getReminderUse(state, entry) {
  return reminderUseHistory(state).findLast(use => {
    if (use.playerId !== entry.playerId || use.ruleId !== entry.ruleId) return false;
    if (entry.limit?.endsWith('unit') && use.unitId !== entry.unitId) return false;
    if (entry.limit?.startsWith('round') && use.round !== state.battle?.round) return false;
    if (entry.limit?.startsWith('phase') && use.contextKey !== rulesContextKey(state)) return false;
    return true;
  }) ?? null;
}

function decorate(state, entry) {
  const used = entry.limit ? getReminderUse(state, entry) : null;
  const sourceUrl=entry.sourceUrl ?? (entry.unitId && entry.kind!=='stratagem'?'https://orpheax.github.io/custobuilder/datasheets.html':ADEPTUS_CUSTODES_RULE_SOURCES.currentReference);
  return { ...entry, used, activeThisPhase: used?.contextKey===rulesContextKey(state), available: !used && (!entry.opening || isRulesPhaseOpening(state)), sourceUrl };
}

export function getBattleRulesReminders(state, { playerId, unitId = null, includeUsed = true } = {}) {
  if (state?.battle?.status !== 'active' || !playerId) return [];
  const entries = [], ownTurn = activePlayer(state) === playerId;
  const engaged = new Set(getFightEngagementState(state).engagedUnitIds);
  const focused = state.units?.find(unit => unit.id === unitId && unit.ownerId === playerId);
  const focusRoot = focused && getCombatFormationRoot(state, focused);
  const units = (state.units ?? []).filter(unit => unit.ownerId === playerId && ['deployed', 'reserves'].includes(unit.status) &&
    (!focusRoot || getCombatFormationRoot(state, unit)?.id === focusRoot.id));
  if (isCustodes(state, playerId)) {
    for (const unit of units) {
      for (const def of CUSTODES_REMINDER_DEFINITIONS) {
        if (!def.phases.includes(state.phase) || !reviewedAbility(state, unit, def.ability)) continue;
        if (def.id==='praesidium-shield' && !getRecordedCombatRules(state,unit).effects.includes('sentinel-shield')) continue;
        if (unit.status !== (def.reserves ? 'reserves' : 'deployed')) continue;
        if (def.turn === 'own' && !ownTurn || def.turn === 'opponent' && ownTurn) continue;
        if (def.id === 'take-wing' && engaged.has(getCombatFormationRoot(state,unit)?.id)) continue;
        // The additional CP is a round-opening decision, even if the opponent goes first.
        if (def.id === 'aquila-commander' && state.battle.firstPlayerId && activePlayer(state) !== state.battle.firstPlayerId) continue;
        entries.push(decorate(state, { ...def, ruleId: def.id, playerId, unitId: unit.id, unitName: unit.name, title: def.ability, kind: def.opening ? 'decision' : 'unit' }));
      }
      if(unit.status==='deployed' && ['shooting','fight'].includes(state.phase)) {
        const weapons=getDatasheetWeaponOptions(state,unit,{type:state.phase==='fight'?'melee':'ranged'});
        const equipped=new Set((getBattleRosterUnit(state,unit)?.equippedWeapons??[]).filter(item=>item.quantity>0).map(item=>norm(item.name)));
        const reminders=weapons.flatMap(weapon=>{
          // A catalog can list alternative loadouts. Never describe an optional
          // weapon as equipped unless the roster selects it or it is unambiguous.
          if(!equipped.has(norm(weapon.name)) && weapons.length!==1 && !(reviewedAbility(state,unit,'Slayer of Tyrants')&&/grenade launcher/i.test(weapon.name)))return [];
          const c=weapon.characteristics??{},text=[];
          if(c.lance)text.push('Lance: check the successful charge recorded this turn');
          if(c.precision)text.push('Precision: check eligible Character allocation');
          if(c.twinLinked)text.push('Twin-linked: re-roll Wound rolls');
          if(/grenade launcher/i.test(weapon.name))text.push('remember this additional ranged weapon');
          return text.length?[weapon.name+': '+text.join('; ')]:[];
        });
        if(reminders.length)entries.push(decorate(state,{ruleId:'weapon-keywords',playerId,unitId:unit.id,unitName:unit.name,title:'Equipped weapon reminders',kind:'unit',timing:'When selecting weapons',effect:reminders.join('. ')}));
        const damaged=(getBattleUnitDatasheet(state,unit)?.abilities??[]).find(item=>/^Damaged \d+$/.test(item.name));
        const wounds=getLiveUnitVitals(state,unit).wounds;
        if(damaged && Number.isFinite(wounds) && wounds<=Number(damaged.name.match(/\d+/)[0]))entries.push(decorate(state,{ruleId:'damaged-profile',playerId,unitId:unit.id,unitName:unit.name,title:damaged.name,kind:'unit',timing:'While damaged',effect:wounds+' wounds remaining. Apply the datasheet’s Damaged rule when resolving attacks.'}));
      }
      if (unit.status === 'deployed' && state.phase === 'fight' && ability(state, unit, 'Martial Ka\'tah') && getCombatFormationRoot(state, unit)?.id === unit.id) {
        const readiness = getCustodesKatahState(state, {playerId, unitId: unit.id});
        const names = isRulesPhaseOpening(state) ? ['Dacatarai', 'Kaptaris', 'Rendax'] : ['Rendax'];
        if (readiness.readied) entries.push(decorate(state, { ruleId: 'katah-fight-window', playerId, unitId: unit.id, unitName: unit.name,
          title: 'Martial Ka’tah', kind: 'decision', timing: isRulesPhaseOpening(state) ? 'Start of Fight phase' : 'When selected to fight',
          effect: ADEPTUS_CUSTODES_KATAH.filter(item => names.includes(item.name)).map(item => item.name + ': ' + item.effect).join(' '),
          katahChoices: names.map(name=>({id:name,label:'Use '+name})),sourceUrl:ADEPTUS_CUSTODES_RULE_SOURCES.officialArmyRulesPreview }));
      }
    }
    if(focusRoot && ['shooting','fight'].includes(state.phase) && !(getBattleUnitDatasheet(state,focusRoot)?.keywords??[]).some(keyword=>['Monster','Vehicle'].includes(keyword)) && !entries.some(entry=>entry.ruleId==='captain-general')) {
      const commander=(state.units??[]).find(unit=>unit.ownerId===playerId && unit.status==='deployed' && reviewedAbility(state,unit,'Captain-General (Aura)'));
      if(commander)entries.push(decorate(state,{ruleId:'captain-general-range-check',playerId,unitId:commander.id,unitName:focusRoot.name,title:'Captain-General aura · range check',kind:'unit',timing:'When attacking',effect:'Check whether this unit is within 6″ of '+commander.name+'. Eligible non-Monster/Vehicle Custodes units can re-roll Hit and Wound rolls of 1.'}));
    }
    if (ownTurn && state.phase === 'command') entries.unshift(decorate(state, {ruleId:'katah-readiness', playerId, title:'Ka’tah readiness', kind:'army', timing:'Your Command phase', effect:'Eligible units become readied at the start of your Command phase. A use spends that unit’s readiness; check the Ka’tah panel for current status.'}));
    if (hasCustodesDetachment(state, playerId, 'Guardians of the Throne')) {
      if (state.phase === 'fight') entries.unshift(decorate(state, {ruleId:'martial-mastery', playerId, title:'Martial Mastery', kind:'army', timing:'Each eligible unit selected to fight', effect:'Choose Sustained Hits 1 or Lethal Hits for melee attacks. Check for existing Lethal/Sustained Hits on the unit or weapon before choosing.'}));
      const guardians = ADEPTUS_CUSTODES_DETACHMENTS.find(item => item.name === 'Guardians of the Throne');
      for (const strat of guardians.stratagems) {
        if (!GUARDIANS_REMINDER_PHASES[strat.name]?.includes(state.phase)) continue;
        if (['Unlimited Endurance','Prime Target'].includes(strat.name) && !ownTurn) continue;
        if (['Swift as the Eagle','In Auramite Clad'].includes(strat.name) && ownTurn) continue;
        if (strat.name === 'Shield of Honour' && !isRulesPhaseOpening(state)) continue;
        const eligible = units.filter(unit => unit.status === 'deployed' && ability(state, unit, 'Martial Ka\'tah'));
        if (strat.name === 'Superhuman Focus') {
          for (const unit of eligible.filter(unit => getCombatFormationRoot(state, unit)?.id === unit.id)) {
            if (getCustodesKatahState(state,{playerId,unitId:unit.id}).readied) continue;
            entries.push(decorate(state, {ruleId:'superhuman-focus',playerId,unitId:unit.id,unitName:unit.name,title:strat.name,kind:'stratagem',timing:strat.timing,effect:strat.description,limit:'round-unit',cpCost:1,action:'Spend 1 CP · Re-ready'}));
          }
        } else {
          const candidates=eligible.filter(unit=>{
            const sheet=getBattleUnitDatasheet(state,unit);
            if(strat.name==='In Auramite Clad' && ability(state,getCombatFormationRoot(state,unit),'Living Fortress'))return false;
            if(strat.name==='Swift as the Eagle' && !(sheet?.keywords??[]).includes('Trusted Sentinel'))return false;
            if(strat.name==='Swift as the Eagle' && engaged.has(getCombatFormationRoot(state,unit)?.id))return false;
            if(strat.name==='Shield of Honour' && !(sheet?.keywords??[]).some(k=>['Infantry','Mounted'].includes(k)))return false;
            return true;
          });
          if(candidates.length)entries.push(decorate(state,{ruleId:'guardians-'+norm(strat.name).replaceAll(' ','-'),playerId,title:strat.name,kind:'stratagem',timing:strat.timing,effect:strat.description,cpCost:strat.cpCost}));
        }
      }
    }
  }
  const opponent = state.players?.find(player => player.id !== playerId);
  if (norm(state.armyRosters?.[opponent?.id]?.faction) === 'space marines') entries.push({ruleId:'opponent-doctrine',playerId,title:'Opponent Combat Doctrine',kind:'opponent',timing:'Confirm with your opponent',effect:'Check the active army and unit-specific doctrine. Assault can enable Advance-and-charge; Devastator grants Assault to ranged attacks; Tactical can enable shooting/charging after Falling Back.',sourceUrl:'https://www.warhammer-community.com/en-gb/articles/ifgezlgu/space-marines-rules-first-look/',available:true});
  return entries.filter(entry => includeUsed || !entry.used).filter(entry => entry.available || entry.used)
    .sort((a,b) => Number(Boolean(a.used))-Number(Boolean(b.used)) || Number(b.kind==='decision')-Number(a.kind==='decision'));
}

export function getTargetDefenseReminders(state, { targetUnitId, allocationTargetId = null, weapon = null, phase = state?.phase } = {}) {
  const unit = state?.units?.find(item => item.id === (allocationTargetId ?? targetUnitId));
  if (!unit || unit.status !== 'deployed' || !isCustodes(state,unit.ownerId) || !['shooting','fight'].includes(phase) || state.phase!==phase) return [];
  const root = getCombatFormationRoot(state,unit), rules = getRecordedCombatRules(state,unit);
  const strength = Number(weapon?.characteristics?.strength ?? weapon?.strength);
  const highStrength = !Number.isFinite(strength) || !rules.unitToughness ? null : strength > rules.unitToughness;
  const result = [], add = (id,title,effect,conditional=false) => result.push({id,title,effect,conditional});
  if (rules.effects.includes('living-fortress')) add('living-fortress','Living Fortress','Worsen incoming AP by 1: AP −2 becomes AP −1.');
  if (highStrength !== false && rules.effects.some(id=>['sentinel-shield','unyielding-ancient'].includes(id))) add('strong-attack-defense','Strength above Toughness','−1 to incoming Wound rolls when attack Strength exceeds this unit’s Toughness.' + (highStrength===null?' Check the weapon’s Strength.':''),highStrength===null);
  if (rules.effects.includes('captain-shield')) add('captain-shield','Praesidium Shield · allocated model','Reduce Damage by 1 for attacks allocated to '+unit.name+' only.');
  if (rules.effects.includes('guardian-eternal') && phase==='shooting') add('guardian-eternal','Guardian Eternal','Reduce incoming ranged Damage by 1.');
  if (rules.effects.includes('aegis-of-the-emperor')) add('aegis','Aegis of the Emperor','If mortal wounds are inflicted: Feel No Pain 5+. No additional general Feel No Pain is implied.',true);
  if (rules.feelNoPain) add('personal-fnp','Allocated model only','Feel No Pain '+rules.feelNoPain+'+ for wounds allocated to '+unit.name+'.');
  if (ability(state,unit,'Daughters of the Abyss')) add('psychic-null','Daughters of the Abyss','Against Psychic attacks: Feel No Pain 3+. Check the 6″ Psychic Null aura for nearby eligible Custodes.',true);
  const psychic=weapon?.characteristics?.psychic===true || /\bpsychic\b/i.test(String(weapon?.abilities??''));
  if(psychic && !ability(state,unit,'Daughters of the Abyss') && (state.units??[]).some(source=>source.ownerId===unit.ownerId && source.status==='deployed' && reviewedAbility(state,source,'Daughters of the Abyss'))) add('psychic-aura-check','Psychic Null · range check','If this Custodes unit is within 6″ of an eligible Anathema Psykana unit, it has Feel No Pain 5+ against Psychic attacks. Confirm range at the table.',true);
  if (phase==='fight') {
    const katah = (state.history??[]).findLast(event=>event.type==='custodes.katah_expended' && event.payload?.unitId===root?.id && event.payload?.katahName==='Kaptaris' && event.payload.turn===state.turn && event.payload.round===state.battle?.round);
    if (katah) add('kaptaris','Kaptaris active','−1 to Hit rolls for incoming melee attacks.');
  }
  const shackle = reminderUseHistory(state).findLast(use=>use.unitId===unit.id && use.ruleId==='moment-shackle' && use.choice==='save' && use.contextKey===rulesContextKey(state));
  if (shackle) add('shackle-save','Moment Shackle active','3+ invulnerable save for '+unit.name+' only, for this phase.');
  if (hasCustodesDetachment(state,unit.ownerId,'Guardians of the Throne') && activePlayer(state)!==unit.ownerId && !rules.effects.includes('living-fortress')) add('auramite-option','In Auramite Clad · 1 CP','Consider before resolving attacks: worsen incoming AP by 1 until this attacking unit finishes. Confirm the stratagem window.',true);
  return result;
}

export function getUnitBattleNote(state, unitId) {
  const unit=state?.units?.find(item=>item.id===unitId);
  return String(unit?.metadata?.battleRulesNote ?? getBattleRosterUnit(state,unit)?.notes ?? '');
}
