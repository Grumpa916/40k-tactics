import { getCombatFormationRoot, getCombatFormationMembers } from '../rules/battle-unit-reference.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getCasualtyLoadoutState } from '../rules/live-casualty-loadout.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function casualtyPicker(unit, casualty) {
  if (!casualty?.canRecordCasualty) return '';
  if (!casualty.requiresIdentity) {
    return '<button type="button" data-record-casualty data-unit-id="'+esc(unit.id)+'" aria-label="Remove one model from '+esc(unit.name ?? unit.id)+'">−1 model</button>';
  }
  // Never guess which weapons survive when casualties have different loadouts.
  const body=!casualty.complexIdentity && casualty.slotChoices.length===1
    ? casualty.slotChoices[0].choices.map(choice=>
      '<button type="button" data-record-casualty data-unit-id="'+esc(unit.id)+
      '" data-casualty-slot-id="'+esc(casualty.slotChoices[0].id)+
      '" data-casualty-selection="'+esc(choice.name)+'">Remove '+esc(choice.name)+'</button>'
    ).join('')
    : '<div data-casualty-editor="'+esc(unit.id)+'"><p>Identify the removed model’s equipment.</p>'+
      casualty.slotChoices.map(slot=>'<label>'+esc(slot.id)+'<select data-casualty-slot="'+esc(slot.id)+'">'+
        slot.choices.map(choice=>'<option value="'+esc(choice.name)+'">'+esc(choice.name)+' · '+esc(choice.quantity)+' remaining</option>').join('')+
      '</select></label>').join('')+
      casualty.optionalChoices.map(choice=>'<label><input type="checkbox" data-casualty-optional="'+esc(choice.name)+'"> Model had '+esc(choice.name)+'</label>').join('')+
      '<button type="button" data-submit-casualty>Confirm casualty</button></div>';
  return '<details class="unit-quick-adjust__casualty-picker" data-view-key="quick-casualty-'+esc(unit.id)+
    '" data-casualty-controls><summary>−1 model · choose equipment</summary><div class="unit-quick-adjust__picker-body">'+
    '<p>Which model was removed? This keeps surviving weapons accurate.</p>'+body+
    '<span data-casualty-message role="status"></span></div></details>';
}

function renderUnitControls(state, unit, { member = false } = {}) {
  const vitals=getLiveUnitVitals(state,unit);
  const casualty=getCasualtyLoadoutState(state,unit);
  const wounds=Number.isFinite(vitals.wounds)?vitals.wounds:null;
  const max=Number.isFinite(vitals.startingWounds)?vitals.startingWounds:null;
  const models=Number.isInteger(casualty?.currentModels)?casualty.currentModels:
    Number.isInteger(vitals.models)?vitals.models:null;
  const initialModels=Number.isInteger(casualty?.startingModels)?casualty.startingModels:
    Number.isInteger(vitals.startingModels)?vitals.startingModels:null;
  const active=state.battle?.status==='active';
  const valid=['deployed','reserves'].includes(unit.status);
  const woundButtons=active && valid && wounds!=null
    ? '<div class="unit-quick-adjust__buttons">'+
      '<button type="button" data-adjust-unit-wounds="-1" data-unit-id="'+esc(unit.id)+'" aria-label="Decrease wounds for '+esc(unit.name ?? unit.id)+'"'+(wounds<=0?' disabled':'')+'>−</button>'+
      '<button type="button" data-adjust-unit-wounds="1" data-unit-id="'+esc(unit.id)+'" aria-label="Increase wounds for '+esc(unit.name ?? unit.id)+'"'+(max!=null&&wounds>=max?' disabled':'')+'>+</button></div>'
    : '';
  const casualtyButton=active && valid ? casualtyPicker(unit,casualty) : '';
  const undo=active && casualty?.canUndo
    ? '<button type="button" data-undo-casualty data-unit-id="'+esc(unit.id)+'" aria-label="Undo most recent casualty for '+esc(unit.name ?? unit.id)+'">Undo last casualty</button>'
    : '';
  const shocked=isUnitBattleShocked(unit);
  const shock=active && valid
    ? '<button type="button" data-toggle-live-battle-shock data-unit-id="'+esc(unit.id)+
      '" aria-pressed="'+String(shocked)+'">'+(shocked?'Battle-shocked':'Battle-shock: Off')+'</button>'
    : '';
  const hint=(!casualtyButton && initialModels!=null && initialModels>1 && models==null)
    ? '<small>Model count unknown · check at table</small>' : '';
  return '<section class="unit-quick-adjust__unit'+(member?' is-member':'')+'" data-global-state-controls data-casualty-controls data-quick-unit-id="'+esc(unit.id)+'">'+
    (member?'<h4>'+esc(unit.name??unit.id)+'</h4>':'')+
    '<div class="unit-quick-adjust__metric"><span>Wounds</span><strong>'+esc(wounds??'—')+
      (max!=null?' / '+esc(max):'')+'</strong>'+woundButtons+'</div>'+
    '<div class="unit-quick-adjust__metric"><span>Models</span><strong>'+esc(models??'—')+
      (initialModels!=null?' / '+esc(initialModels):'')+'</strong>'+
      (casualtyButton&&!casualty?.requiresIdentity?casualtyButton:'')+
      (undo?undo:'')+'</div>'+
    (casualty?.requiresIdentity?casualtyButton:'')+hint+
    (shock?'<div class="unit-quick-adjust__actions">'+shock+'</div>':'')+
    '<span class="unit-quick-adjust__message" data-global-state-message role="status"></span><span data-casualty-message role="status"></span>'+ 
  '</section>';
}

// The existing live-casualty-controls binding handles every action;
// this view never dispatches commands, changes saves or infers model identity.
export function renderSelectedUnitQuickAdjust(state, selectedUnitId) {
  if (!selectedUnitId || state?.battle?.status!=='active') return '';
  const selected=(state.units??[]).find(unit=>unit.id===selectedUnitId);
  if (!selected || !['deployed','reserves'].includes(selected.status)) return '';
  const root=getCombatFormationRoot(state,selected)??selected;
  const members=getCombatFormationMembers(state,root);
  const otherMembers=members.filter(unit=>unit.id!==root.id && ['deployed','reserves'].includes(unit.status));
  const extras=otherMembers.length
    ? '<details class="unit-quick-adjust__members" data-view-key="quick-formation-members-'+esc(root.id)+'">'+
      '<summary>Attached models · '+otherMembers.length+' member'+(otherMembers.length===1?'':'s')+'</summary>'+
      otherMembers.map(member=>renderUnitControls(state,member,{member:true})).join('')+
      '</details>' : '';
  const sheet = new URL('./styles/selected-unit-quick-adjust.css', import.meta.url).href;
  return '<link rel="stylesheet" href="'+esc(sheet)+'"><section class="unit-quick-adjust" aria-label="Quick adjust selected unit" data-selected-unit-quick-adjust>'+ 
    '<header><span>SELECTED UNIT · QUICK ADJUST</span><strong>'+esc(root.name??root.id)+'</strong></header>'+
    renderUnitControls(state,root)+extras+'</section>';
}
