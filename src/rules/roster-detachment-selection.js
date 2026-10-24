import { DETACHMENT_POINT_BUDGET, getFactionDetachments, getFactionDetachmentRestrictions } from '../data/faction-detachments.js';

const clean=value=>String(value??'').trim();
const norm=value=>clean(value).toLowerCase();
export function isAdeptusCustodesFaction(faction){return norm(faction)==='adeptus custodes';}

export function getRosterDetachmentNames(roster){
 const many=Array.isArray(roster?.detachments)?roster.detachments.map(clean).filter(Boolean):[];
 const one=clean(roster?.detachment);
 return [...new Set(many.length?many:(one?[one]:[]))];
}

export function assessRosterDetachmentSelection(faction,names=[]){
 const selected=[...new Set((names??[]).map(clean).filter(Boolean))];
 const available=getFactionDetachments(faction);
 const byName=new Map(available.map(item=>[item.name,item]));
 const unknown=selected.filter(name=>available.length&&!byName.has(name));
 const detachments=selected.map(name=>byName.get(name)).filter(Boolean);
 const used=detachments.reduce((sum,item)=>sum+(Number(item.detachmentPoints)||0),0);
 const budget=DETACHMENT_POINT_BUDGET;
 const issues=[];
 if(unknown.length)issues.push(`Unknown ${clean(faction)||'faction'} detachment: ${unknown.join(', ')}.`);
 if(used>budget)issues.push(`Selected detachments use ${used}/${budget} DP.`);
 for(const restriction of getFactionDetachmentRestrictions(faction)){
  const tagged=detachments.filter(item=>item.uniqueTag===restriction.tag || (restriction.tag==='Shield Host'&&item.uniqueShieldHost));
  if(tagged.length>(restriction.max??1))issues.push(`Select no more than ${restriction.max??1} ${restriction.tag} detachment; selected ${tagged.map(item=>item.name).join(', ')}.`);
 }
 return {status:issues.length?'invalid':'valid',selected,detachments,used,budget,remaining:budget-used,issues,tracked:available.length>0};
}

export function assessCustodesDetachmentSelection(names=[]){
 return assessRosterDetachmentSelection('Adeptus Custodes',names);
}

export function normalizeRosterDetachmentSelection(roster,names){
 const assessment=assessRosterDetachmentSelection(roster?.faction,names);
 if(assessment.status!=='valid')throw new Error(assessment.issues.join(' '));
 return {...roster,detachments:assessment.selected,detachment:assessment.selected[0]??null};
}
