/**
 * Ultramarines named-unit profile review.
 *
 * Current 11e weapon values, unit names and model layouts: compared with
 * current 11e datasheet reference and official GW June 2026 faction pack.
 * Some October-era numbers/abilities differ from the June pack: this does
 * NOT certify a full October Codex transcription or the GW MFM live data.
 *
 * GW: https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf
 * Current: https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html
 */
const R=(name,range,attacks,skill,strength,ap,damage,abilities='')=>Object.freeze({name,range,attacks,skill,strength,ap,damage,abilities});
const M=(name,attacks,skill,strength,ap,damage,abilities='')=>R(name,'Melee',attacks,skill,strength,ap,damage,abilities);
const A=(name,description)=>Object.freeze({name,description});
const stats=(Move,Toughness,Save,Wounds,Leadership,OC,invuln=null)=>Object.freeze({
  Move,Toughness,Save,Wounds,Leadership,'Objective Control':OC,
  ...(invuln ? {'Invulnerable save':invuln} : {})
});
const PROFILE_SOURCE='https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html';
const GW_SOURCE='https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf';
const shared={reviewedAt:'2026-11-03',sourceName:'Current 11e datasheet comparison; October official Codex direct audit pending',
  sourceUrl:PROFILE_SOURCE,officialFactionPackSourceUrl:GW_SOURCE,
  officialOctoberCodexFullTextVerified:false,verificationStatus:'current-11e-cross-checked'};

export const WARDENS_OF_ULTRAMAR_MODELS=Object.freeze([
 Object.freeze({name:'Ancient Gadriel',characteristics:stats('6"','5','3+','4','6+','2'),
  wargear:Object.freeze(['Bolt Rifle','Ceramite Fists'])}),
 Object.freeze({name:'Veteran Sergeant Metaurus',characteristics:stats('6"','5','3+','4','6+','1','4+'),
  wargear:Object.freeze(['Heavy Bolt Pistol','Master-crafted Power Weapon','Storm Shield'])}),
 Object.freeze({name:'Gaius Silva',characteristics:stats('6"','3','4+','3','6+','1','5+'),
  wargear:Object.freeze(['Archeotech Laspistol','Power Weapon','Refractor Field'])}),
 Object.freeze({name:'Aemelia Minervas',characteristics:stats('6"','3','4+','3','6+','1','5+'),
  wargear:Object.freeze(['Archeotech Laspistol','Power Weapon'])}),
 Object.freeze({name:'Dainal Kornelius',characteristics:stats('6"','3','4+','3','6+','1','5+'),
  wargear:Object.freeze(['Astropathic Blast','Force Stave'])}),
 Object.freeze({name:'Lucia Vestha',characteristics:stats('6"','3','4+','3','6+','1','5+'),
  wargear:Object.freeze(['Archeotech Laspistol','Ultramarian Combat Weapons'])})
]);

export const SPACE_MARINES_NAMED_ULTRAMARINES_DATASHEETS=Object.freeze({
 'Cato Sicarius':Object.freeze({...shared,name:'Cato Sicarius',
  characteristics:stats('6"','5','2+','5','6+','1','4+'),
  weapons:Object.freeze([
    R('Artisan Plasma Pistol','12"','1','2+','8','-3','2','Close-Quarters'),
    M('Talassarian Tempest Blade - Strike','5','2+','6','-3','3','Devastating Wounds'),
    M('Talassarian Tempest Blade - Sweep','9','2+','5','-2','1','Sustained Hits 1: Infantry'),
    M('Talassarian Tempest Blade - Coup de Grace','7','2+','6','-2','2','Precision')
  ]),
  abilities:Object.freeze([
    A('Captain of the Honour Guard','If your army contains Marneus Calgar, Cato becomes Support instead of Leader. He still attaches to Victrix Honour Guard. Confirm attachment order and conditions on the tabletop.'),
    A('Knight Champion of Macragge','Once per phase: in the opponent Movement phase, when an enemy finishes a move within 8 inches of this unengaged unit, it can make a Normal move up to 6 inches.'),
    A('Honour or Death','Heroic Intervention targeting this unit costs 1 CP less. Confirm stratagem timing and CP on the tabletop.')
  ]),
  keywords:Object.freeze(['Infantry','Character','Epic Hero','Tacticus','Ultramarines','Adeptus Astartes'])
 }),
 'Victrix Honour Guard':Object.freeze({...shared,name:'Victrix Honour Guard',
  characteristics:stats('6"','5','2+','3','6+','2'),
  weapons:Object.freeze([
    R('Master-crafted Bolt Carbine','24"','2','2+','5','-1','2','Assault, Rapid Fire 1'),
    M('Master-crafted Power Weapon','5','2+','5','-2','2'),
    M('Blades of Honour','6','2+','6','-2','2','Precision, Twin-linked')
  ]),
  abilities:Object.freeze([
    A('Honour Guard of Macragge','Attacks targeting this unit have -1 to wound rolls. Confirm whether the current card imposes any additional attachment condition.'),
    A('Glory of Ultramar','Opponent Shooting phase: if an enemy finishes shooting and destroys a model in this unit, this unit can make a surge move up to D6 inches.'),
    A('Banner of Macragge','At the end of your Movement phase, if this unit controls an objective, that objective becomes secured. Once per battle when selected to fight, the banner can grant +1 Strength and Attacks to melee weapons in the unit; track its use manually.')
  ]),
  keywords:Object.freeze(['Infantry','Tacticus','Victrix Honour Guard','Ultramarines','Adeptus Astartes']),
  unitComposition:Object.freeze({defaultGuardModels:3,maxChapterAncient:1,maxChapterChampion:1,
    allowedTotalModels:Object.freeze([3,6]),
    note:'Model-count options represent the total squad; a Chapter Ancient and Chapter Champion replace ordinary Guard models in the selected total.'})
 }),
 'Wardens of Ultramar':Object.freeze({...shared,name:'Wardens of Ultramar',
  // These six named individuals have different T/Sv/W/OC; no fabricated
  // unified statline is exposed to the tactical damage calculator.
  characteristics:Object.freeze({Move:'6"',Leadership:'6+'}),
  modelProfiles:WARDENS_OF_ULTRAMAR_MODELS,
  modelSpecificStatline:true,
  weapons:Object.freeze([
    R('Bolt Rifle - Focused Fire','24"','1','3+','6','-1','2','Heavy, Rapid Fire 1'),
    R('Bolt Rifle - Saturation','24"','2','3+','5','-1','1','Assault, Rapid Fire 1'),
    R('Heavy Bolt Pistol','18"','1','3+','5','-1','1','Close-Quarters'),
    R('Archeotech Laspistol','12"','1','3+','4','-1','1','Close-Quarters'),
    R('Astropathic Blast','12"','3','3+','4','-1','1','Blast 1, Psychic'),
    M('Ceramite Fists','4','3+','5','0','1'),
    M('Master-crafted Power Weapon','5','2+','5','-2','2','Precision'),
    M('Power Weapon','4','2+','4','-2','1'),
    M('Force Stave','1','2+','5','-2','2','Psychic'),
    M('Ultramarian Combat Weapons','4','3+','4','0','1')
  ]),
  abilities:Object.freeze([
    A('Raise the Banner','At the end of your Movement phase, if this unit controls an objective, that objective becomes secured.'),
    A('Strategium Command','After both armies deploy, this unit can redeploy up to three friendly Adeptus Astartes units, including placing them in Strategic Reserves under the card conditions.'),
    A('Mixed named models','Each of the six models has different characteristic and equipment lines. Use the individual model reference; do not infer a whole-unit Wounds/Toughness value.')
  ]),
  keywords:Object.freeze(['Infantry','Epic Hero','Psyker','Tacticus','Wardens of Ultramar','Ultramarines','Adeptus Astartes'])
 })
});
