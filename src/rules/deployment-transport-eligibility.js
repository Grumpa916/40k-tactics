/**
 * Deployment-only transport declarations. Unknown or uncertified transport profiles
 * cannot silently accept passengers. The 11e Space Marine profiles below reflect the
 * locally reviewed October Codex transcription; official datasheets still govern play.
 */
import { getBattleRosterUnit, getBattleUnitDatasheet } from './battle-unit-reference.js';

const MARINE_TRANSPORTS = Object.freeze({
  'land-raider': {capacity:14, denied:['JUMP PACK','CENTURION','WULFEN'], double:['GRAVIS','TERMINATOR']},
  'land-raider-crusader': {capacity:16, denied:['JUMP PACK','CENTURION','WULFEN'], double:['GRAVIS','TERMINATOR']},
  'land-raider-redeemer': {capacity:14, denied:['JUMP PACK','CENTURION','WULFEN'], double:['GRAVIS','TERMINATOR']},
  'repulsor': {capacity:14, denied:['JUMP PACK','CENTURION','WULFEN'], double:['GRAVIS','TERMINATOR']},
  'repulsor-executioner': {capacity:7, denied:['JUMP PACK','CENTURION','WULFEN'], double:['GRAVIS','TERMINATOR']},
  'impulsor': {capacity:7, denied:['JUMP PACK','TERMINATOR','CENTURION','WULFEN'], double:['GRAVIS']},
  'rhino': {capacity:12, denied:['GRAVIS','JUMP PACK','TERMINATOR','CENTURION','WULFEN']},
  'drop-pod': {capacity:12, denied:['GRAVIS','JUMP PACK','TERMINATOR','CENTURION','WULFEN']},
  'thunderhawk-gunship': {capacity:30, denied:['CENTURION','WULFEN'], double:['GRAVIS','JUMP PACK','TERMINATOR'], mounted:4}
});
const norm = value => String(value??'').toUpperCase().replace(/[_–-]/g,' ').replace(/\s+/g,' ').trim();
const tags = (state,unit) => new Set([
  ...(unit?.keywords??[]),...(unit?.profile?.keywords??[]),
  ...(getBattleRosterUnit(state,unit)?.keywords??[]),
  ...(getBattleUnitDatasheet(state,unit)?.keywords??[])
].map(norm));
const has = (tags,word) => tags.has(word);
const roster = (state,unit) => getBattleRosterUnit(state,unit)??unit;
const rosterId = (state,unit) => roster(state,unit)?.id??unit.id;
const rootId = (state,unit) => {
  const parent=roster(state,unit)?.attachedToBodyguardId;
  if(!parent)return unit.id;
  return state.units.find(x=>x.ownerId===unit.ownerId && (rosterId(state,x)===parent || x.id===parent))?.id??unit.id;
};
const roots = state => (state.units??[]).filter(u=>u.status!=='destroyed' && rootId(state,u)===u.id);
const form = (state,unit) => state.preparation?.formations?.[rootId(state,unit)]??{kind:'field'};
const members = (state,unit) => (state.units??[]).filter(u=>u.status!=='destroyed' && rootId(state,u)===unit.id);
const count = (state,unit) => {
  const data=roster(state,unit);
  const n=data.modelCount??unit.modelCount??(Array.isArray(unit.models)?unit.models.length:null);
  return Number.isInteger(n)&&n>0?n:null;
};
function marineKey(state,unit) {
  const faction=state.armyRosters?.[unit.ownerId]?.faction;
  if(norm(faction)!=='SPACE MARINES')return null;
  const id=String(roster(state,unit)?.datasheetId??unit.metadata?.datasheetId??'').toLowerCase();
  const suffix=id.startsWith('space-marines:')?id.slice('space-marines:'.length):'';
  if(MARINE_TRANSPORTS[suffix])return suffix;
  const byName=String(roster(state,unit)?.name??unit.name??'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return MARINE_TRANSPORTS[byName]?byName:null;
}
export function isDeploymentTransport(state,unit) {
  return !!unit && unit.status!=='destroyed' && has(tags(state,unit),'TRANSPORT');
}
export function getDeploymentTransportProfile(state,unit) {
  if(!isDeploymentTransport(state,unit))return null;
  const key=marineKey(state,unit);
  return key?MARINE_TRANSPORTS[key]:null;
}
export function getDeploymentTransports(state,playerId=null) {
  return roots(state).filter(u=>(!playerId||u.ownerId===playerId) && isDeploymentTransport(state,u));
}
function footprint(state,passenger,profile) {
  if(isDeploymentTransport(state,passenger))return {reason:'A Transport cannot embark within another Transport.'};
  let space=0;
  for(const modelUnit of members(state,passenger)) {
    const k=tags(state,modelUnit);
    const marine=has(k,'ADEPTUS ASTARTES') || has(k,'FACTION: ADEPTUS ASTARTES');
    const infantry=has(k,'INFANTRY');
    const mounted=has(k,'MOUNTED');
    if(!marine || (!infantry && !(profile.mounted&&mounted)))
      return {reason:modelUnit.name+' is not an eligible Adeptus Astartes Infantry'+(profile.mounted?' or Mounted':'')+' unit.'};
    const disallowed=profile.denied.find(word=>has(k,word));
    if(disallowed)return {reason:modelUnit.name+' has excluded keyword '+disallowed+'.'};
    const n=count(state,modelUnit);
    if(n===null)return {reason:'Model count is unknown for '+modelUnit.name+'; verify its datasheet before embarking.'};
    const cost=mounted ? profile.mounted : profile.double.some(word=>has(k,word))?2:1;
    space+=n*cost;
  }
  return {space};
}
export function assessDeploymentEmbarkation(state,passenger,transport) {
  if(!passenger || !transport || passenger.id===transport.id ||
     passenger.ownerId!==transport.ownerId || transport.status==='destroyed')
    return {ok:false,reason:'Choose a friendly Transport and a different passenger unit.'};
  if(rootId(state,passenger)!==passenger.id)
    return {ok:false,reason:'Attached Leaders embark with their Bodyguard.'};
  if(!isDeploymentTransport(state,transport))
    return {ok:false,reason:'The selected carrier does not have the TRANSPORT keyword.'};
  if(form(state,transport).kind==='embarked')
    return {ok:false,reason:'An embarked Transport cannot carry passengers.'};
  if(roots(state).some(u=>form(state,u).kind==='embarked'&&form(state,u).transportId===passenger.id))
    return {ok:false,reason:'Remove the unit’s passengers before embarking it.'};
  const profile=getDeploymentTransportProfile(state,transport);
  if(!profile)return {ok:false,reason:'Transport capacity/eligibility are not yet verified for '+transport.name+'.'};
  const proposed=footprint(state,passenger,profile);
  if(proposed.reason)return {ok:false,reason:proposed.reason};
  let used=0;
  for(const unit of roots(state)) {
    if(unit.id===passenger.id)continue;
    const f=form(state,unit);
    if(f.kind!=='embarked'||f.transportId!==transport.id)continue;
    const existing=footprint(state,unit,profile);
    if(existing.reason)return {ok:false,reason:existing.reason};
    used+=existing.space;
  }
  if(used+proposed.space>profile.capacity)
    return {ok:false,reason:transport.name+' has '+Math.max(0,profile.capacity-used)+' spaces remaining; '+passenger.name+' needs '+proposed.space+'.',used,capacity:profile.capacity,spaces:proposed.space};
  return {ok:true,used,capacity:profile.capacity,spaces:proposed.space};
}
export function getDeploymentTransportChoices(state,passenger) {
  return getDeploymentTransports(state,passenger.ownerId).filter(t=>assessDeploymentEmbarkation(state,passenger,t).ok);
}
export function getDeploymentTransportOccupancy(state,transport) {
  const profile=getDeploymentTransportProfile(state,transport);
  if(!profile)return null;
  let used=0;
  for(const unit of roots(state)) {
    const f=form(state,unit);
    if(f.kind!=='embarked'||f.transportId!==transport.id)continue;
    const result=footprint(state,unit,profile);
    if(result.reason)return null;
    used+=result.space;
  }
  return {used,capacity:profile.capacity};
}
export function deploymentTransportIssues(state) {
  const issues=[];
  for(const unit of roots(state)) {
    const f=form(state,unit);
    if(f.kind!=='embarked')continue;
    const transport=state.units.find(t=>t.id===f.transportId);
    const result=assessDeploymentEmbarkation(state,unit,transport);
    if(!result.ok)issues.push('Invalid transport for '+unit.name+': '+result.reason);
  }
  for(const transport of getDeploymentTransports(state)) {
    const k=tags(state,transport);
    if(has(k,'DEDICATED TRANSPORT')&&!roots(state).some(unit=>form(state,unit).kind==='embarked'&&form(state,unit).transportId===transport.id))
      issues.push('Dedicated Transport '+transport.name+' needs an embarked unit before battle.');
  }
  return issues;
}
