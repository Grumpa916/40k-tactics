import { resizeBuilderFixedEquipment } from '../rules/army-builder-fixed-equipment.js';
import { createWargearChoiceState, chooseWargear, chooseWargearBaseline, changeWargearQuantity, readWargearChoiceState, resizeWargearChoices } from '../rules/army-wargear-choices.js';
import { getBuilderModelCounts, resolveBuilderUnitCost } from '../rules/army-builder-cost.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';

/** Keep unsaved touch selections local to the unit editor; persistence stays in the panel. */
export function createArmyUnitEditorController(container,{getUnit,getRoster,render}={}) {
 const drafts=new Map();
 function draft(unit) {
  if(!unit)return null;
  let entry=drafts.get(unit.id);
  if(!entry||entry.source!==unit){entry={source:unit,unit:{...structuredClone(unit),builderWargearState:createWargearChoiceState(unit)}};drafts.set(unit.id,entry);}
  return entry.unit;
 }
 function capture(unit) {
  const notes=container.querySelector(`[data-unit-notes="${unit.id}"]`);
  if(notes)unit.notes=notes.value;
 }
 function update(mutator) {
  const unit=draft(getUnit());if(!unit)return;
  capture(unit);mutator(unit);render();
 }
 return {
  getDraft:draft,
  handleClick(event) {
   const button=event.target?.closest?.('[data-unit-size], [data-wargear-step]');
   if(!button||!container.contains(button)||button.disabled||!button.matches('[data-unit-size]')&&!button.matches('[data-wargear-step]'))return false;
   event.preventDefault?.();
   update(unit=>{
    if(button.matches('[data-unit-size]')){
     const count=Number(button.getAttribute('data-unit-size'));
     if(!getBuilderModelCounts(unit).includes(count))return;
     const previous={...unit};unit.modelCount=count;
     unit.builderWargearState=resizeWargearChoices(previous,unit,unit.builderWargearState);
    }else{
     const delta=Number(button.getAttribute('data-wargear-step')),optional=button.getAttribute('data-wargear-optional');
     if(optional){const item=getTyranidWargearRuleSet(unit.datasheetId)?.optional?.find(item=>item.name===optional);if(!item)return;const max=unit.modelCount*(item.perModel??1);unit.builderWargearState.optional[optional]=Math.max(0,Math.min(max,(unit.builderWargearState.optional[optional]??0)+delta));}
     else unit.builderWargearState=changeWargearQuantity(unit,unit.builderWargearState,button.getAttribute('data-wargear-slot'),button.getAttribute('data-wargear-name'),delta);
    }
   });return true;
  },
  handleChange(event) {
   const input=event.target;
   if(!input?.matches?.('[data-wargear-choice], [data-wargear-baseline], [data-wargear-special], [data-wargear-toggle]'))return false;
   update(unit=>{
    if(input.matches('[data-wargear-choice]'))unit.builderWargearState=chooseWargear(unit,unit.builderWargearState,input.getAttribute('data-wargear-choice'),input.value);
    else if(input.matches('[data-wargear-baseline]'))unit.builderWargearState=chooseWargearBaseline(unit,unit.builderWargearState,input.getAttribute('data-wargear-baseline'),input.value);
    else if(input.matches('[data-wargear-special]'))unit.builderWargearState=changeWargearQuantity(unit,unit.builderWargearState,input.getAttribute('data-wargear-special'),input.getAttribute('data-wargear-name'),input.checked?1:-1);
    else{const name=input.getAttribute('data-wargear-toggle'),rule=getTyranidWargearRuleSet(unit.datasheetId)?.optional?.find(item=>item.name===name);unit.builderWargearState.optional[name]=input.checked?unit.modelCount*(rule?.perModel??1):0;}
   });return true;
  },
  prepareSave(existing) {
   const unit=draft(existing);capture(unit);
   const selections=readWargearChoiceState(unit,unit.builderWargearState);
   const {builderWargearState,...result}=unit;
   if(getBuilderModelCounts(unit).length){
    if(!getBuilderModelCounts(unit).includes(unit.modelCount))throw new Error('Choose a published unit size.');
    const price=resolveBuilderUnitCost(unit,getRoster(),selections??unit.equippedWargear);
    if(price.points==null)throw new Error(price.reason);
    result.points=price.points;
   }else{
    result.modelCount=Number(container.querySelector(`[data-unit-models="${unit.id}"]`)?.value??unit.modelCount);
    const raw=container.querySelector(`[data-unit-points="${unit.id}"]`)?.value??'';result.points=raw===''?null:Number(raw);
    if(!Number.isInteger(result.modelCount)||result.modelCount<1)throw new Error('Model count must be a positive whole number.');
    if(result.points!=null&&(!Number.isFinite(result.points)||result.points<0))throw new Error('Points must be non-negative.');
   }
   if(builderWargearState)result.wargearSlotAssignments={...builderWargearState.assignments};
   return {unit:selections?result:resizeBuilderFixedEquipment(result),selections};
  },
  reset(unitId){drafts.delete(unitId);}
 };
}
