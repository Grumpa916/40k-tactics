import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { validateWargearLoadout } from './wargear-loadout-validation.js';

export function getWargearSlots(unit) {
 const rules = getTyranidWargearRuleSet(unit?.datasheetId);
 return (rules?.slots ?? []).flatMap(slot => Array.from({length:(slot.count ?? 0)+(slot.perModel ?? 0)*unit.modelCount}, (_,index) => ({
  id: `${slot.id}:${index}`, slotId: slot.id, model: slot.perModel ? index+1 : null, choices: slot.choices
 })));
}
function countsOf(items) {
 const counts = new Map();
 for (const item of items ?? []) counts.set(item.name,(counts.get(item.name) ?? 0)+item.quantity);
 return counts;
}
function add(items, name, quantity) {
 if (!name || quantity <= 0) return;
 const found = items.find(item => item.name===name);
 if (found) found.quantity+=quantity; else items.push({name,quantity});
}
export function createWargearChoiceState(unit) {
 const rules = getTyranidWargearRuleSet(unit?.datasheetId);
 if (!rules) return null;
 const slots = getWargearSlots(unit), counts = countsOf(unit.equippedWargear);
 const assignments = {};
 const ordered = [...slots].sort((a,b)=>a.choices.length-b.choices.length);
 function place(index) {
  if (index===ordered.length) return true;
  const slot=ordered[index];
  const preferred=unit.wargearSlotAssignments?.[slot.id];
  const choices=[...slot.choices].sort((a,b)=>Number(b.name===preferred)-Number(a.name===preferred));
  for(const choice of choices) {
   if ((counts.get(choice.name) ?? 0)<=0) continue;
   counts.set(choice.name,counts.get(choice.name)-1);assignments[slot.id]=choice.name;
   if(place(index+1)) return true;
   counts.set(choice.name,counts.get(choice.name)+1);delete assignments[slot.id];
  }
  return false;
 }
 const hasExplicit=!!unit.equippedWargear?.length;
 const restored=place(0);
 if (!restored) for(const slot of slots) assignments[slot.id]=slot.choices[0]?.name;
 const optional={};
 for(const item of rules.optional ?? []) optional[item.name]=Math.min(unit.modelCount*(item.perModel ?? 1), unit.equippedWargear?.filter(x=>x.name===item.name).reduce((sum,x)=>sum+x.quantity,0) ?? 0);
 const baselines={};
 for(const slot of rules.slots ?? []) {
  const baselineRule=(rules.constraints ?? []).find(rule=>rule.type==='same-baseline'&&rule.selections.some(name=>slot.choices.some(choice=>choice.name===name)));
  if(baselineRule) baselines[slot.id]=baselineRule.selections.find(name=>unit.equippedWargear?.some(item=>item.name===name&&item.quantity>0)) ?? baselineRule.selections[0];
 }
 return { assignments, optional, baselines, needsReview: hasExplicit && (!restored || validateWargearLoadout(unit).status==='rules-invalid') };
}
export function readWargearChoiceState(unit, state) {
 if (!state) return null;
 const rules=getTyranidWargearRuleSet(unit.datasheetId), result=[];
 for(const item of rules.fixed ?? []) add(result,item.name,(item.count ?? 0)+(item.perModel ?? 0)*unit.modelCount);
 for(const name of Object.values(state.assignments)) add(result,name,1);
 for(const [name,quantity] of Object.entries(state.optional)) add(result,name,quantity);
 return result;
}
export function checkWargearChoice(unit, state, slotId, name) {
 const slot=getWargearSlots(unit).find(slot=>slot.id===slotId);
 if (!slot?.choices.some(choice=>choice.name===name)) return 'Not an option for this weapon slot.';
 const next={...state,assignments:{...state.assignments,[slotId]:name}};
 const validation=validateWargearLoadout({...unit,equippedWargear:readWargearChoiceState(unit,next)});
 return validation.errors.join(' ');
}
export function chooseWargear(unit, state, slotId, name) {
 const reason=checkWargearChoice(unit,state,slotId,name);
 if(reason) throw new Error(reason);
 return {...state,needsReview:false,assignments:{...state.assignments,[slotId]:name}};
}
export function changeWargearQuantity(unit, state, slotId, name, delta) {
 const slots=getWargearSlots(unit).filter(slot=>slot.slotId===slotId), base=state.baselines?.[slotId] ?? slots[0]?.choices[0]?.name;
 const from=delta>0?base:name,to=delta>0?name:base;
 const slot=slots.find(slot=>state.assignments[slot.id]===from && !checkWargearChoice(unit,state,slot.id,to));
 if(!slot) return state;
 return chooseWargear(unit,state,slot.id,to);
}
export function resizeWargearChoices(previous, nextUnit, state) {
 if(!state) return createWargearChoiceState(nextUnit);
 let next=createWargearChoiceState({...nextUnit,equippedWargear:[],wargearSlotAssignments:{}});
 for(const [slotId,baseline] of Object.entries(state.baselines ?? {})) next=chooseWargearBaseline(nextUnit,next,slotId,baseline);
 for(const slot of getWargearSlots(nextUnit)) {
  const old=state.assignments[slot.id];
  if(old && !checkWargearChoice(nextUnit,next,slot.id,old)) next.assignments[slot.id]=old;
 }
 for(const [name,count] of Object.entries(state.optional)) next.optional[name]=Math.min(count,nextUnit.modelCount);
 // An all-or-none option follows the new unit size when previously enabled.
 for(const item of getTyranidWargearRuleSet(nextUnit.datasheetId)?.optional ?? []) if(item.allOrNone&&state.optional[item.name]) next.optional[item.name]=nextUnit.modelCount*(item.perModel??1);
 return next;
}

export function chooseWargearBaseline(unit,state,slotId,name) {
 const rules=getTyranidWargearRuleSet(unit.datasheetId);
 const constraint=(rules.constraints ?? []).find(rule=>rule.type==='same-baseline'&&rule.selections.includes(name));
 if(!constraint) throw new Error('Unknown baseline selection.');
 const assignments={...state.assignments};
 for(const slot of getWargearSlots(unit).filter(slot=>slot.slotId===slotId)) if(constraint.selections.includes(assignments[slot.id])) assignments[slot.id]=name;
 return {...state,needsReview:false,baselines:{...state.baselines,[slotId]:name},assignments};
}
