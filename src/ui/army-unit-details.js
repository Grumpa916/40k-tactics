import { renderUnitSizeControls } from './army-unit-size-controls.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { escapeHtml as e } from './army-builder-html.js';
import { renderAttachmentControls } from './army-builder-attachments.js';
import { renderWargearEditor } from './army-wargear-editor.js';
import { findArmyUnitCandidates } from '../data/army-unit-catalog.js';

function resolveUnitProfile(unit, faction = null) {
 if (unit?.datasheet || !faction) return unit;
 return findArmyUnitCandidates({ faction }).find(candidate => candidate.id === unit.datasheetId || candidate.name === unit.name) ?? unit;
}

const COMMON_ABILITY_PATTERNS = Object.freeze([
 /^Leader$/i,
 /^Deadly Demise\b/i,
 /^Shadow in the Warp$/i,
 /^Synapse$/i,
 /^Deep Strike$/i,
 /^Scouts\b/i,
 /^Infiltrators$/i,
 /^Lone Operative$/i,
 /^Stealth$/i,
 /^Fights First$/i,
 /^Feel No Pain\b/i
]);

export function isCommonAbilityName(name) {
 const normalized=String(name ?? '').trim();
 return COMMON_ABILITY_PATTERNS.some(pattern=>pattern.test(normalized));
}

/** Keep source order within each bucket while surfacing unit-specific rules first. */
export function orderAbilitiesForDisplay(abilities=[]) {
 const special=[];
 const common=[];
 for(const ability of abilities ?? []) {
  (isCommonAbilityName(ability?.name) ? common : special).push(ability);
 }
 return [...special,...common];
}

export function unitStats(unit) {
 const c=unit.datasheet?.characteristics ?? {};
 const invulnerable=c['Invulnerable save'] ?? c.invulnerableSave ?? c.invulnerable;
 const stats=[['M','Move'],['T','Toughness'],['Sv','Save'],['W','Wounds'],['Ld','Leadership'],['OC','Objective Control']];
 return '<div class="ab-stats">'+stats.map(([label,key])=>label==='Sv'
  ? `<span class="ab-save-stat"><small>${label}</small><strong>${e(c[key] ?? '—')}</strong>${invulnerable != null && invulnerable !== '' ? `<em>Inv ${e(invulnerable)}</em>` : ''}</span>`
  : `<span><small>${label}</small><strong>${e(c[key] ?? '—')}</strong></span>`).join('')+'</div>';
}
export function renderUnitDetails(unit, {current=null,busy=false,editable=false}={}) {
 if(!unit) return '';
 const displayUnit = resolveUnitProfile(unit, current?.faction);
 const d=busy?'disabled':'';
 unit = { ...displayUnit, ...unit, datasheet: displayUnit.datasheet ?? unit.datasheet };
 const source=unit.dataSource?.sourceUrl ?? unit.sourceUrl;
 const safeSource=typeof source==='string' && /^https?:\/\//i.test(source);
 const weapons=unit.datasheet?.weapons ?? [];
 const abilities=orderAbilitiesForDisplay(unit.datasheet?.abilities ?? []);
 return `<section class="ab-detail"><button type="button" data-builder-browse>← Unit browser</button>${editable?`<button data-remove-unit="${e(unit.id)}" ${d}>Remove unit from list</button>`:''}<h3>${e(unit.name)}</h3>${unitStats(unit)}
 ${editable?`${renderUnitSizeControls(unit,current)}${renderWargearEditor(unit)}<label>Enhancements / notes<textarea data-unit-notes="${e(unit.id)}" maxlength="2000">${e(unit.notes ?? '')}</textarea></label><button data-save-unit="${e(unit.id)}" ${d}>Save unit changes</button>${renderAttachmentControls(unit,current,busy)}`:`<button class="ab-primary" data-add-catalog-unit="${e(unit.id)}" ${d}>+ Add to list · ${e(unit.defaultPoints ?? 'Unknown')} pts</button>`}
 ${editable&&getTyranidWargearRuleSet(unit.datasheetId)?'<details class="ab-profile-reference"><summary>Full weapon profiles and alternate attack modes</summary>':''}
 ${['Ranged','Melee'].map(kind=>{const list=weapons.filter(w=>(String(w.range).toLowerCase()==='melee')===(kind==='Melee'));return `<h4>${kind} weapons</h4>${list.length?`<div class="ab-table"><table><thead><tr><th>Weapon</th><th>Range</th><th>A</th><th>Skill</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>${list.map(w=>`<tr><th>${e(w.name)}${w.abilities?`<small>${e(w.abilities)}</small>`:''}</th>${['range','attacks','skill','strength','ap','damage'].map(k=>`<td>${e(w[k] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>Profiles unavailable.</p>'}`}).join('')}
 ${editable&&getTyranidWargearRuleSet(unit.datasheetId)?'</details>':''}
 <h4>Abilities</h4>${abilities.map(a=>`<details><summary>${e(a.name)}</summary><p>${e(a.description)}</p></details>`).join('')||'<p>Ability text unavailable.</p>'}
 <p>${e((unit.datasheet?.keywords ?? []).join(' · '))}</p>
 <h4>Published model / points options</h4>${(unit.pointsOptions ?? []).map(o=>`<p>${e(o.models)} models · ${e(o.points)} pts ${e(o.condition ?? '')}</p>`).join('')||'<p>No cost options available.</p>'}
 <p class="ab-muted">Data status: ${e(unit.dataSource?.status ?? unit.verificationStatus ?? 'manual-entry')}. Check current source rules; missing values are not treated as zero.</p>
 ${safeSource?`<p><a href="${e(source)}" target="_blank" rel="noopener noreferrer">Open datasheet source</a></p>`:''}
 </section>`;
}
