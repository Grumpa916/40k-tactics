import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_RULES_DATA } from '../data/adeptus-custodes-faction-rules.js';

const norm=value=>String(value??'').trim().toLowerCase();
export function isAdeptusCustodesFaction(faction){return norm(faction)==='adeptus custodes';}

export function getRosterDetachmentNames(roster){
 const many=Array.isArray(roster?.detachments)?roster.detachments.map(value=>String(value??'').trim()).filter(Boolean):[];
 const one=String(roster?.detachment??'').trim();
 return [...new Set(many.length?many:(one?[one]:[]))];
}

export function assessCustodesDetachmentSelection(names=[]){
 const selected=[...new Set((names??[]).map(value=>String(value??'').trim()).filter(Boolean))];
 const byName=new Map(ADEPTUS_CUSTODES_DETACHMENTS.map(item=>[item.name,item]));
 const unknown=selected.filter(name=>!byName.has(name));
 const detachments=selected.map(name=>byName.get(name)).filter(Boolean);
 const used=detachments.reduce((sum,item)=>sum+(item.detachmentPoints??0),0);
 const budget=ADEPTUS_CUSTODES_RULES_DATA.detachmentPointBudget??3;
 const issues=[];
 if(unknown.length)issues.push(`Unknown Custodes detachment: ${unknown.join(', ')}.`);
 if(used>budget)issues.push(`Custodes detachments use ${used}/${budget} DP.`);
 for(const restriction of ADEPTUS_CUSTODES_RULES_DATA.uniqueDetachmentRules??[]){
  const tagged=detachments.filter(item=>item.uniqueTag===restriction.tag);
  if(tagged.length>(restriction.max??1))issues.push(`Select no more than ${restriction.max??1} ${restriction.tag} detachment; selected ${tagged.map(item=>item.name).join(', ')}.`);
 }
 return {status:issues.length?'invalid':'valid',selected,detachments,used,budget,remaining:budget-used,issues};
}

export function normalizeRosterDetachmentSelection(roster,names){
 if(!isAdeptusCustodesFaction(roster?.faction)){
  const first=String(names?.[0]??'').trim()||null;
  return {...roster,detachment:first,detachments:first?[first]:[]};
 }
 const assessment=assessCustodesDetachmentSelection(names);
 if(assessment.status!=='valid')throw new Error(assessment.issues.join(' '));
 return {...roster,detachments:assessment.selected,detachment:assessment.selected[0]??null};
}
