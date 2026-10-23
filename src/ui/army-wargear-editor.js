import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { createWargearChoiceState, getWargearSlots, readWargearChoiceState, checkWargearChoice, changeWargearQuantity } from '../rules/army-wargear-choices.js';
import { escapeHtml as e } from './army-builder-html.js';

function profileCells(unit,name) {
 const choice=[...(getTyranidWargearRuleSet(unit.datasheetId)?.slots ?? []).flatMap(slot=>slot.choices),...(getTyranidWargearRuleSet(unit.datasheetId)?.optional ?? [])].find(choice=>choice.name===name);
 const names=choice?.profiles ?? [name];
 const profiles=(unit.datasheet?.weapons ?? []).filter(weapon=>names.includes(weapon.name));
 if(!profiles.length) return '<td colspan="6">See weapon profile below</td>';
 const weapon=profiles[0];
 return ['range','attacks','skill','strength','ap','damage'].map(key=>`<td>${e(weapon[key]??'—')}</td>`).join('');
}
function row(unit,name,control,reason='') {
 const wrapper=control.startsWith('<input')?'label':'div';
 return `<tr class="${reason?'ab-choice-blocked':''}"><th scope="row"><${wrapper} class="ab-weapon-choice">${control}<span>${e(name)}${reason?`<small>${e(reason)}</small>`:''}</span></${wrapper}></th>${profileCells(unit,name)}</tr>`;
}
const table=body=>`<div class="ab-table ab-choice-table"><table><thead><tr><th>Weapon / equipment</th><th>Range</th><th>A</th><th>Skill</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>${body}</tbody></table></div>`;
function choiceControl(slot,name,selected,reason,extra='') {
 return `<input type="radio" name="wargear-${e(slot)}" data-wargear-choice="${e(slot)}" value="${e(name)}" aria-label="${e(name)}" ${selected?'checked':''} ${reason?'disabled':''} ${extra}>`;
}
function quantityControl(name,quantity,decrease,increase,attributes) {
 return `<span class="ab-weapon-stepper"><button type="button" data-wargear-step="-1" ${attributes} aria-label="Remove one ${e(name)}" ${decrease?'':'disabled'}>−</button><output aria-label="${e(name)} quantity">${quantity}</output><button type="button" data-wargear-step="1" ${attributes} aria-label="Add one ${e(name)}" ${increase?'':'disabled'}>+</button></span>`;
}
export function renderWargearEditor(unit) {
 const rules=getTyranidWargearRuleSet(unit?.datasheetId);
 if(!rules) return '<p class="ab-muted">Use the weapon reference below. Selectable loadout rules are not available for this unit yet.</p>';
 const state=unit.builderWargearState ?? createWargearChoiceState(unit), slots=getWargearSlots(unit);
 const selections=readWargearChoiceState(unit,state);
 const count=name=>selections.find(item=>item.name===name)?.quantity??0;
 let html=`<section class="ab-wargear" data-wargear-editor="${e(unit.id)}"><h4>Selected wargear</h4><p>Choose one weapon in each replacement group. Switching a choice replaces the previous weapon. Save unit changes to apply this loadout in battle.</p>${state.needsReview?'<p role="alert">Saved equipment needs review. Check the choices below before saving.</p>':''}`;
 if(rules.fixed?.length) html+=`<p class="ab-fixed-wargear"><strong>Always equipped:</strong> ${rules.fixed.map(item=>`${(item.count??0)+(item.perModel??0)*unit.modelCount} × ${e(item.name)}`).join(' · ')}</p>`;
 const perModelCards=(rules.slots?.length??0)>1 && rules.slots.some(slot=>slot.perModel);
 const models=perModelCards?Array.from({length:unit.modelCount},(_,i)=>i+1):[null];
 for(const model of models) {
  if(model) html+=`<section class="ab-model-wargear"><h4>${e(unit.name==='Carnifexes'?'Carnifex':unit.name)} ${model}</h4>`;
  for(const spec of rules.slots ?? []) {
   const groupSlots=slots.filter(slot=>slot.slotId===spec.id && (!perModelCards||slot.model===model));
   if(!groupSlots.length) continue;
   const title=spec.id==='extra-talons-slot'?'Extra scything talons — choose one':spec.id==='scything-talons-slot'?'Scything talons — choose one':spec.id.replaceAll('-',' ');
   html+=`<fieldset class="ab-weapon-group"><legend>${e(title)}</legend>`;
   if(groupSlots.length===1) {
    const slot=groupSlots[0];
    html+=table(slot.choices.map(choice=>{
     const selected=state.assignments[slot.id]===choice.name;
     const reason=selected?'':checkWargearChoice(unit,state,slot.id,choice.name);
     return row(unit,choice.name,choiceControl(slot.id,choice.name,selected,reason,`data-wargear-single="${e(spec.id)}"`),reason);
    }).join(''));
   } else {
    const baselineRule=(rules.constraints??[]).find(rule=>rule.type==='same-baseline'&&rule.selections.some(name=>spec.choices.some(choice=>choice.name===name)));
    const base=state.baselines?.[spec.id]??spec.choices[0].name;
    if(baselineRule) {
     html+='<p>Choose the unit’s standard weapon. Special weapons below replace that many standard weapons automatically.</p>';
     html+=table(spec.choices.filter(choice=>baselineRule.selections.includes(choice.name)).map(choice=>row(unit,choice.name,`<input type="radio" name="baseline-${e(spec.id)}" data-wargear-baseline="${e(spec.id)}" value="${e(choice.name)}" aria-label="${e(choice.name)}" ${base===choice.name?'checked':''}>`)).join(''));
    }
    html+=`<p><strong>${count(base)} × ${e(base)}</strong> · ${groupSlots.length} models total. Other selections replace this weapon.</p>`;
    const alternatives=spec.choices.filter(choice=>choice.name!==base && (!baselineRule||!baselineRule.selections.includes(choice.name)));
    html+=table(alternatives.map(choice=>{
     const selected=count(choice.name),next=changeWargearQuantity(unit,state,spec.id,choice.name,1),canAdd=next!==state;
     const maxRule=(rules.constraints??[]).find(rule=>rule.type==='max-per-models'&&rule.selection===choice.name);
     const maximum=maxRule?Math.floor(unit.modelCount/maxRule.models)*(maxRule.maxEach??1):groupSlots.length;
     const help=maxRule?`Up to ${maximum}; ${maxRule.maxEach??1} per ${maxRule.models} models.`:'';
     const attrs=`data-wargear-slot="${e(spec.id)}" data-wargear-name="${e(choice.name)}"`;
     const control=maximum<=1?`<input type="checkbox" data-wargear-special="${e(spec.id)}" data-wargear-name="${e(choice.name)}" aria-label="${e(choice.name)}" ${selected?'checked':''} ${!selected&&!canAdd?'disabled':''}>`:quantityControl(choice.name,selected,selected>0,canAdd,attrs);
     return row(unit,choice.name,control,help);
    }).join(''));
   }
   html+='</fieldset>';
  }
  if(model) html+='</section>';
 }
 if(rules.optional?.length) {
  html+='<fieldset class="ab-weapon-group"><legend>Additional equipment</legend><p>These choices add equipment; they do not replace a weapon.</p>';
  html+=table(rules.optional.map(item=>{
   const max=unit.modelCount*(item.perModel??1),quantity=state.optional[item.name]??0;
   const control=item.allOrNone||max===1?`<input type="checkbox" data-wargear-toggle="${e(item.name)}" aria-label="${e(item.name)}" ${quantity?'checked':''}>`:quantityControl(item.name,quantity,quantity>0,quantity<max,`data-wargear-optional="${e(item.name)}"`);
   return row(unit,item.name,control,item.allOrNone?`All ${unit.modelCount} models or none.`:`Up to ${max}; one per model.`);
  }).join(''))+'</fieldset>';
 }
 return html+'</section>';
}
export function readWargearSelections(container,unit) {
 if(unit.builderWargearState) return readWargearChoiceState(unit,unit.builderWargearState);
 // Read current checked slot controls for callers outside the draft controller.
 const state=createWargearChoiceState(unit);if(!state)return null;
 for(const input of container.querySelectorAll('[data-wargear-choice]')) if(input.checked)state.assignments[input.getAttribute('data-wargear-choice')]=input.value;
 // Support the former single-select representation when loading older embedded editors.
 for(const input of container.querySelectorAll('[data-wargear-single]')) if(input.tagName==='SELECT'||input.checked===undefined){const slot=getWargearSlots(unit).find(slot=>slot.slotId===input.getAttribute('data-wargear-single'));if(slot)state.assignments[slot.id]=input.value;}
 return readWargearChoiceState(unit,state);
}
