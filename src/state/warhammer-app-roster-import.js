import { createArmyRoster } from './army-roster-library.js';
import { ARMY_UNIT_CATALOG } from '../data/army-unit-catalog.js';
import { resolveInitialUnitPoints } from './army-roster-unit-costs.js';

function normalize(value) {
 return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function getPoints(line) {
 const matches=[...String(line).matchAll(/\b(\d{1,4})\s*(?:pts?\.?|points?)\b/gi)];
 return matches.length?Number(matches.at(-1)[1]):null;
}
function getModels(line, candidate) {
 const explicit=String(line).match(/\b(\d+)\s+models?\b/i);
 if(explicit) return Number(explicit[1]);
 const prefix=String(line).match(/^\s*(?:[•*–-]\s*)?(\d+)\s*[x×]\s*/i);
 if(prefix && Number(prefix[1])>1) return Number(prefix[1]);
 return candidate.defaultModelCount??1;
}
const ignoredLine=/^(?:army roster|army list|warhammer|battle forge|battle size|total|grand total|points limit|detachment points|force disposition|warlord|enhancements?|stratagems?|units?|detachment|faction|army rule|exported from)\b/i;

/** Parse a pasted Warhammer App roster conservatively by matching catalog unit names. */
export function importWarhammerAppRoster({text,faction,name,pointsLimit=null,id,createdAt=null,updatedAt=createdAt}={}) {
 if(typeof text!=='string'||!text.trim()) throw new TypeError('Paste a Warhammer App army list first.');
 const selectedFaction=String(faction??'').trim(); if(!selectedFaction) throw new TypeError('Choose the roster faction before importing.');
 const available=ARMY_UNIT_CATALOG.filter(unit=>unit.faction.toLowerCase()===selectedFaction.toLowerCase()).sort((a,b)=>normalize(b.name).length-normalize(a.name).length);
 if(!available.length) throw new Error('The catalog has no unit names for '+selectedFaction+' yet.');
 const units=[];const unrecognized=[];let serial=0;
 for(const raw of text.split(/\r?\n/)) {
  const line=raw.trim();if(!line||ignoredLine.test(line)) continue;
  const normalized=normalize(line);
  const candidate=available.find(unit=>{const n=normalize(unit.name);return normalized===n||normalized.startsWith(n+' ')||normalized.includes(' '+n+' ')||normalized.endsWith(' '+n);});
  if(!candidate) {
   if(/\b\d{1,4}\s*(?:pts?\.?|points?)\b/i.test(line)) unrecognized.push(line);
   continue;
  }
  const models=getModels(line,candidate);
  if(!Number.isInteger(models)||models<1||models>500) {unrecognized.push(line);continue;}
  const unitId=id+'-unit-'+(++serial);
  const importedPoints=getPoints(line);
  units.push({id:unitId,name:candidate.name,modelCount:models,points:importedPoints??resolveInitialUnitPoints(candidate,models),pointsOptions:candidate.pointsOptions??[],notes:line,datasheet:candidate.datasheet??null,datasheetId:candidate.id,dataSource:{status:candidate.verificationStatus,sourceName:candidate.sourceName,sourceUrl:candidate.sourceUrl,reviewedAt:candidate.reviewedAt??null,officialRulesCrossCheck:candidate.officialRulesCrossCheck??'pending',rosterImport:'warhammer-app-text'}});
 }
 const detachmentLine=text.split(/\r?\n/).map(line=>line.trim()).find(line=>/^(?:detachment|army detachment)\s*[:–-]/i.test(line));
 if(!units.length) throw new Error('No unit names matched the '+selectedFaction+' catalog. Keep the export and check the selected faction or send us a sample to tune the importer.');
 return {roster:createArmyRoster({id,name,faction:selectedFaction,pointsLimit,detachment:detachmentLine?detachmentLine.replace(/^(?:army )?detachment\s*[:–-]\s*/i,'').trim()||null:null,units,notes:'Imported from pasted Warhammer App text. Original export is preserved below for review.\n\n'+text,createdAt,updatedAt}),unrecognized};
}
