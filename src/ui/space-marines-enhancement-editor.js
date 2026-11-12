import { SPACE_MARINES_CURRENT_ENHANCEMENTS } from '../data/space-marines-enhancements.js';
import { getEligibleSpaceMarineEnhancements, getSpaceMarineEnhancementDefinition } from '../rules/space-marines-enhancements.js';
import { getRosterDetachmentNames } from '../rules/roster-detachment-selection.js';
import { escapeHtml as e } from './army-builder-html.js';

export function renderSpaceMarineEnhancementEditor(unit,roster){
  if(!String(unit?.datasheetId??'').startsWith('space-marines:'))return '';
  const selected=unit.unitUpgradeDraft??unit.unitUpgrades?.[0]?.id??'';
  const source=unit.unitUpgrades?.[0];
  const existing=getSpaceMarineEnhancementDefinition(source);
  const current=getSpaceMarineEnhancementDefinition(selected)??existing;
  const eligible=getEligibleSpaceMarineEnhancements(unit,roster);
  const activeNames=new Set(getRosterDetachmentNames(roster));
  const all=SPACE_MARINES_CURRENT_ENHANCEMENTS.filter(def=>activeNames.has(def.detachment) &&
    (eligible.includes(def)||current?.id===def.id));
  const copies=new Map();
  for(const other of (roster?.units??[]).filter(item=>item.id!==unit.id)){
    const id=other.unitUpgrades?.[0]?.id;
    if(id)copies.set(id,(copies.get(id)??0)+1);
  }
  const choices=all.map(def=>{
    const copiesTaken=copies.get(def.id)??0;
    const max=def.upgrade?3:1;
    const disabled=(!eligible.includes(def)||copiesTaken>=max)&&def.id!==current?.id;
    return '<option value="'+e(def.id)+'"'+(def.id===selected?' selected':'')+
      (disabled?' disabled':'')+'>'+e(def.name)+' · '+e(def.detachment)+' · +'+def.points+' pts'+
      (def.upgrade?' · Upgrade':'')+(copiesTaken>=max?' · limit reached':'')+'</option>';
  }).join('');
  if(!all.length&&!selected)return '';
  const detail=current
    ?'<p class="ab-muted"><strong>'+e(current.name)+':</strong> '+e(current.description)+'</p>'
    :'';
  const needsReview=selected&&!getSpaceMarineEnhancementDefinition(selected)
    ?'<p role="alert">Existing enhancement is not verified against the current 11e catalog. Review the official rules before changing it.</p>'
    :'';
  return '<section class="ab-unit-upgrade" aria-label="Space Marines enhancements">'+
    '<h4>Space Marines Enhancements / Upgrades</h4>'+
    '<label>Selected upgrade<select data-unit-upgrade="'+e(unit.id)+'" style="min-height:44px;width:100%">'+
      '<option value="">None</option>'+choices+'</select></label>'+
    detail+needsReview+
    '<p class="ab-muted">One enhancement per unit; ordinary Enhancements require non-Epic Hero Characters and are unique. Eligible Upgrades may be taken three times, counting only once against the 2 Incursion / 4 Strike Force limit. Chapter and detachment restrictions still apply. Pricing sourced to current 11e independent references; official October MFM check pending.</p>'+
    '</section>';
}
