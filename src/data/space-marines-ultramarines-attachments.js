/**
 * Limited 11e Space Marine attachment eligibility checked against GW 2026
 * Faction Pack and the current Ultramarines datasheet reference.
 *
 * Distinguishes Cato's conditional Support status and Wardens' Support role.
 * Other named leaders are left unverified: no blanket Captain wildcard.
 */
const review=Object.freeze({
 status:'source-reviewed', reviewedAt:'2026-11-03',
 rulesVersion:'11th, October 2026 datasheet cross-check (current GW Codex direct comparison pending)',
 sources:Object.freeze([
   'https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf',
   'https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html'
 ])
});
const id=name=>'space-marines:'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const calgarBodyguards=[
 'Aggressor Squad','Assault Intercessor Squad','Bladeguard Veteran Squad',
 'Company Heroes','Eradicator Squad with Heavy Bolters','Eradicator Squad with Melta Rifles',
 'Heavy Intercessor Squad','Infernus Squad','Intercessor Squad',
 'Sternguard Veteran Squad','Terminator Assault Squad','Terminator Squad',
 'Victrix Honour Guard'
];
const wardenBodyguards=[
 'Assault Intercessor Squad','Bladeguard Veteran Squad','Intercessor Squad',
 'Sternguard Veteran Squad','Vanguard Veteran Squad with Jump Packs'
];
const leader=(allowed,support=false)=>Object.freeze({isLeader:true,support,
 allowedBodyguardDatasheetIds:Object.freeze(allowed.map(id)),
 compatibilityReview:review});
const bodyguard=maxAttachedLeaders=>Object.freeze({
 canReceiveLeader:true,maxAttachedLeaders,compatibilityReview:review
});
const record={
 'Marneus Calgar':Object.freeze({leader:leader(calgarBodyguards)}),
 'Cato Sicarius':Object.freeze({leader:leader(['Victrix Honour Guard'])}),
 'Wardens of Ultramar':Object.freeze({leader:leader(wardenBodyguards,true)}),
 'Victrix Honour Guard':Object.freeze({bodyguard:bodyguard(2)})
};
for(const name of new Set([...calgarBodyguards,...wardenBodyguards])){
 if(name==='Victrix Honour Guard')continue;
 record[name]=Object.freeze({bodyguard:bodyguard(wardenBodyguards.includes(name)?2:1)});
}
export const SPACE_MARINES_ULTRAMARINES_ATTACHMENTS=Object.freeze(record);
export function addReviewedUltramarinesAttachmentMetadata(name,datasheet){
 const meta=record[name];
 if(!datasheet||!meta)return datasheet;
 return Object.freeze({...datasheet,...meta});
}
export function isReviewedVictrixLeaderPair(firstId,secondId){
 const ids=new Set([firstId,secondId]);
 return ids.size===2&&ids.has(id('marneus-calgar'))&&ids.has(id('cato-sicarius'));
}
