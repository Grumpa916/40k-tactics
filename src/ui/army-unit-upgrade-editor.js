import {
  MORITOI_UPGRADES,
  getUnitUpgradeNames,
  isEligibleMoritoiDreadnought
} from '../rules/custodes-unit-upgrades.js';
import { getRosterDetachmentNames } from '../rules/roster-detachment-selection.js';
import { escapeHtml as e } from './army-builder-html.js';

export function renderUnitUpgradeEditor(unit,roster) {
  const chosen=unit?.unitUpgradeDraft??getUnitUpgradeNames(unit)[0]??'';
  const isCustodes=String(unit?.datasheetId??'').startsWith('adeptus-custodes:');
  if(!isCustodes||(!isEligibleMoritoiDreadnought(unit)&&!chosen))return '';
  const hasDetachment=getRosterDetachmentNames(roster).includes('Might of the Moritoi');
  const otherAssignments=new Set((roster?.units??[])
    .filter(item=>item.id!==unit.id).flatMap(getUnitUpgradeNames));
  const canChoose=isEligibleMoritoiDreadnought(unit)&&hasDetachment;
  const options=MORITOI_UPGRADES.map(def=>'<option value="'+e(def.name)+'"'+
    (chosen===def.name?' selected':'')+
    (!canChoose||otherAssignments.has(def.name)?' disabled':'')+
    '>'+e(def.name)+' · +'+e(def.points)+' pts'+
    (otherAssignments.has(def.name)?' · assigned elsewhere':'')+'</option>').join('');
  const existingIssue=chosen&&!canChoose
    ?'<p role="alert">This Upgrade requires an Adeptus Custodes Dreadnought and Might of the Moritoi detachment.</p>':'';
  return '<section class="ab-unit-upgrade" aria-label="Unit upgrades">'+
    '<h4>Unit Upgrade · Might of the Moritoi</h4>'+
    '<label>Enhancement / Upgrade<select data-unit-upgrade="'+e(unit.id)+'" style="min-height:44px;width:100%">'+
      '<option value="">None</option>'+options+'</select></label>'+
    '<p class="ab-muted">Only one Upgrade per unit. Each named Upgrade can be selected once per army; both are 30 pts.</p>'+
    MORITOI_UPGRADES.map(def=>'<p class="ab-muted"><strong>'+e(def.name)+':</strong> '+e(def.description)+'</p>').join('')+
    (chosen?'<p class="ab-muted"><strong>Selected:</strong> '+e(chosen)+' (points included on Save unit changes).</p>':'')+
    existingIssue+
    (!hasDetachment?'<p class="ab-muted">Select Might of the Moritoi in Detachments to enable upgrades.</p>':'')+
    '</section>';
}
