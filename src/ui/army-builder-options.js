import { escapeHtml } from "./army-builder-html.js";
import { DETACHMENT_POINT_BUDGET, getFactionDetachments } from "../data/faction-detachments.js";

function selectedSet(values){return new Set((Array.isArray(values)?values:[values]).map(v=>String(v??'').trim()).filter(Boolean));}

export function detachmentOptions(faction, selected = null) {
  const selectedNames=selectedSet(selected);
  const options = ['<option value="">Choose a detachment…</option>'];
  const detachments=getFactionDetachments(faction);
  for(const detachment of detachments){
    const shieldHost = detachment.uniqueShieldHost ? ' · Unique Shield Host' : '';
    const warning = detachment.legends ? ' · Legends (not standard matched play)' :
      detachment.category==='chapter-supplement-unverified' ? ' · Supplement: verify current GW eligibility' : '';
    options.push('<option value="'+escapeHtml(detachment.name)+'"'+(selectedNames.has(detachment.name)?' selected':'')+
      (detachment.legends&&!selectedNames.has(detachment.name)?' disabled':'')+'>'+
      escapeHtml(detachment.name+' · '+detachment.forceDisposition+' · '+detachment.detachmentPoints+' DP'+shieldHost+warning)+'</option>');
  }
  return options.join('');
}

function renderDetachmentDetails(detachment){
  const ruleName=String(detachment.ruleName??'').trim();
  const rule=String(detachment.rule??detachment.ruleSummary??detachment.description??'').trim();
  const katah=String(detachment.favouredKatah??'').trim();
  const katahEffect=String(detachment.favouredKatahEffect??'').trim();
  const ruleHtml=rule
    ? `<p class="ab-detachment-rule">${ruleName?`<strong>${escapeHtml(ruleName)}</strong><br>`:''}${escapeHtml(rule)}</p>`
    : '<p class="ab-muted">Detachment rules text has not been loaded into the app yet.</p>';
  const katahHtml=katah
    ? `<p><strong>Favoured Ka'tah: ${escapeHtml(katah)}</strong>${katahEffect?`<br>${escapeHtml(katahEffect)}`:''}</p>`
    : '';
  return `<div class="ab-detachment-rule-body"><p class="ab-muted">${escapeHtml(detachment.detachmentPoints)} DP · ${escapeHtml(detachment.forceDisposition)}${detachment.uniqueShieldHost?' · Unique Shield Host':''}</p>${ruleHtml}${katahHtml}</div>`;
}

export function renderDetachmentChecklist(faction, selected = []) {
  const chosen=selectedSet(selected);
  const detachments=getFactionDetachments(faction);
  if(!detachments.length) return '<p class="ab-muted">Detachment data for this faction is not loaded yet.</p>';
  const used=detachments.filter(d=>chosen.has(d.name)).reduce((sum,d)=>sum+(d.detachmentPoints??0),0);
  const rows=detachments.map(d=>{
    const caution=d.legends?' · Legends (not current matched play)':
      d.category==='chapter-supplement-unverified'?' · Supplement eligibility pending':'';
    const locked=d.legends&&!chosen.has(d.name);
    const dispositions=(d.forceDispositionOptions??[d.forceDisposition]).join(' / ');
    return `<div class="ab-detachment-choice"><label class="ab-detachment-select"><input type="checkbox" data-roster-detachment-checkbox value="${escapeHtml(d.name)}" ${chosen.has(d.name)?'checked':''} ${locked?'disabled':''} aria-label="Select ${escapeHtml(d.name)}"></label><details class="ab-detachment-details"><summary><span><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.detachmentPoints)} DP · ${escapeHtml(dispositions)}${d.uniqueShieldHost?' · Unique Shield Host':''}${escapeHtml(caution)}</small></span></summary>${renderDetachmentDetails(d)}</details></div>`;
  }).join('');
  return `<div class="ab-detachment-picker"><p><strong>Detachments · ${used}/${DETACHMENT_POINT_BUDGET} DP used</strong></p><p class="ab-muted">Tap a detachment name to view its rules.</p>${rows}</div>`;
}
