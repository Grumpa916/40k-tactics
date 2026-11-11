import { TYRANID_ENHANCEMENTS } from '../data/tyranid-enhancements.js';
import { getTyranidEnhancementNames, isEligibleTyranidEnhancementBearer } from '../rules/tyranid-enhancements.js';
import { getRosterDetachmentNames } from '../rules/roster-detachment-selection.js';
import { escapeHtml as e } from './army-builder-html.js';

export function renderTyranidEnhancementEditor(unit,roster){
  if(!String(unit?.datasheetId??'').startsWith('tyranids:'))return '';
  const detachments=new Set(getRosterDetachmentNames(roster));
  const selected=unit?.unitUpgradeDraft??getTyranidEnhancementNames(unit)[0]??'';
  const assigned=(roster?.units??[]).filter(other=>other.id!==unit.id)
    .flatMap(getTyranidEnhancementNames);
  const counts=new Map();
  for(const name of assigned)counts.set(name,(counts.get(name)??0)+1);
  const isTrygon=unit.datasheetId==='tyranids:trygon'&&detachments.has('Subterranean Assault');
  const effective={...unit,...(isTrygon&&unit.subterraneanCharacterDraft!==undefined
    ? {subterraneanCharacter:unit.subterraneanCharacterDraft}: {})};
  const eligible=TYRANID_ENHANCEMENTS.filter(def=>detachments.has(def.detachment) &&
    (isEligibleTyranidEnhancementBearer(effective,def,roster)||selected===def.name));
  if(!eligible.length&&!isTrygon)return '';
  const choices=eligible.map(def=>{
    const max=def.upgrade?3:1;
    const taken=counts.get(def.name)??0;
    const allowed=isEligibleTyranidEnhancementBearer(effective,def,roster);
    const disabled=(!allowed||taken>=max)&&selected!==def.name;
    const suffix=def.upgrade?' · Upgrade':'';
    return '<option value="'+e(def.name)+'"'+(selected===def.name?' selected':'')+
      (disabled?' disabled':'')+'>'+e(def.name)+' · +'+def.points+' pts'+suffix+
      (taken>=max?' · limit reached':'')+'</option>';
  }).join('');
  const active=eligible.find(def=>def.name===selected);
  const trygonChoice=isTrygon?'<label class="ab-unit-upgrade__character"><input type="checkbox" data-tyranid-trygon-character="'+e(unit.id)+'"'+
    (effective.subterraneanCharacter?' checked':'')+'> Designate Trygon as CHARACTER (max 2 per army; Subterranean Assault)</label>':'';
  return '<section class="ab-unit-upgrade" aria-label="Tyranid enhancements">'+
    '<h4>Tyranid enhancements &amp; Upgrades</h4>'+trygonChoice+
    '<label>Enhancement / Upgrade<select data-unit-upgrade="'+e(unit.id)+'" style="min-height:44px;width:100%">'+
      '<option value="">None</option>'+choices+'</select></label>'+
    (active?'<p class="ab-muted"><strong>'+e(active.name)+':</strong> '+e(active.description)+'</p>':'')+
    '<p class="ab-muted">Only one per unit (including attached units). Ordinary enhancements require a non-Epic Hero CHARACTER and are unique; Upgrades can be taken up to three times per army. Standard limit: 2 Incursion / 4 Strike Force; additional copies of an Upgrade do not count again. Points are added when saved.</p>'+
    (selected&&!active?'<p role="alert">Review your existing enhancement. Its detachment may no longer be selected.</p>':'')+
    '</section>';
}
