import { getBuilderModelCounts, resolveBuilderUnitCost } from '../rules/army-builder-cost.js';
import { createWargearChoiceState, readWargearChoiceState } from '../rules/army-wargear-choices.js';
import { escapeHtml as e } from './army-builder-html.js';
export function renderUnitSizeControls(unit,roster) {
 const counts=getBuilderModelCounts(unit);
 if(!counts.length) return `<div class="ab-fields"><label>Models<input type="number" min="1" step="1" data-unit-models="${e(unit.id)}" value="${unit.modelCount??1}"></label><label>Manual points<input type="number" min="0" data-unit-points="${e(unit.id)}" value="${e(unit.points??'')}"></label></div><p>No published size or price options are available for this unit.</p>`;
 const selections=readWargearChoiceState(unit,unit.builderWargearState??createWargearChoiceState(unit))??unit.equippedWargear;
 const price=resolveBuilderUnitCost(unit,roster,selections);
 return `<section class="ab-unit-size"><h4>Unit size</h4><div class="ab-size-options" role="group" aria-label="Unit size">${counts.map(count=>{
  const sized={...unit,modelCount:count},cost=resolveBuilderUnitCost(sized,roster,selections);
  return `<button type="button" data-unit-size="${count}" aria-pressed="${unit.modelCount===count}" class="${unit.modelCount===count?'is-selected':''}">${count} ${count===1?'model':'models'}${cost.points!=null?` · ${cost.points} pts`:''}</button>`;
 }).join('')}</div><p class="ab-unit-price" aria-live="polite"><strong>${price.points??'—'} pts</strong> <span>${e(price.reason)}</span></p><p class="ab-muted">Points update with unit size and priced equipment. Save unit changes to update the list total.</p></section>`;
}
