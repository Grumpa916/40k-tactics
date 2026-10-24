import { escapeHtml } from "./army-builder-html.js";
import { DETACHMENT_POINT_BUDGET, getFactionDetachments } from "../data/faction-detachments.js";

function selectedSet(values){return new Set((Array.isArray(values)?values:[values]).map(v=>String(v??'').trim()).filter(Boolean));}

export function detachmentOptions(faction, selected = null) {
  const selectedNames=selectedSet(selected);
  const options = ['<option value="">Choose a detachment…</option>'];
  const detachments=getFactionDetachments(faction);
  for(const detachment of detachments){
    const shieldHost = detachment.uniqueShieldHost ? ' · Unique Shield Host' : '';
    options.push('<option value="'+escapeHtml(detachment.name)+'"'+(selectedNames.has(detachment.name)?' selected':'')+'>'+escapeHtml(detachment.name+' · '+detachment.forceDisposition+' · '+detachment.detachmentPoints+' DP'+shieldHost)+'</option>');
  }
  return options.join('');
}

export function renderDetachmentChecklist(faction, selected = []) {
  const chosen=selectedSet(selected);
  const detachments=getFactionDetachments(faction);
  if(!detachments.length) return '<p class="ab-muted">Detachment data for this faction is not loaded yet.</p>';
  const used=detachments.filter(d=>chosen.has(d.name)).reduce((sum,d)=>sum+(d.detachmentPoints??0),0);
  const rows=detachments.map(d=>`<label class="ab-check"><input type="checkbox" data-roster-detachment-checkbox value="${escapeHtml(d.name)}" ${chosen.has(d.name)?'checked':''}> <span><strong>${escapeHtml(d.name)}</strong> · ${escapeHtml(d.detachmentPoints)} DP · ${escapeHtml(d.forceDisposition)}${d.uniqueShieldHost?' · Unique Shield Host':''}</span></label>`).join('');
  return `<div class="ab-detachment-picker"><p><strong>Detachments · ${used}/${DETACHMENT_POINT_BUDGET} DP used</strong></p>${rows}</div>`;
}
