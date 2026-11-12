// Current 11e Space Marines stratagem reference, reviewed 11 Nov 2026.
// 15 current Codex detachments (48 entries) plus Deathwatch Support (4).
// The Codex is not freely available in full from Games Workshop: all timings,
// effects and prices here are independently cross-checked, NOT officially
// certified printed-Codex transcriptions. Confirm conditions at the tabletop.
// https://wahapedia.ru/wh40k11ed/factions/space-marines/
// https://tactical40k.com/codex/space-marines
const SOURCE='https://wahapedia.ru/wh40k11ed/factions/space-marines/';
const sourceStatus='2026-11-current-independent-transcription-codex-primary-pending';
// [name, CP, phases, turn, who can be targeted, timing/requirement, effect summary]
const data={
 'Gladius Task Force':[
  ['Armour of Contempt',1,'shooting|fight','opponent','Adeptus Astartes','When enemy attacks target your unit','Reduce incoming AP by 1 for that attacker.'],
  ['A Worthy Death',1,'fight','either','Adeptus Astartes','When enemy targets unit in Fight','Roll to let models destroyed before their unit fights remain until they fight or phase ends.'],
  ['Might of Angels',1,'fight','either','Adeptus Astartes','When friendly unit fights','Melee attacks gain Lance.'],
  ['Adaptive Strategy',1,'command','own','Adeptus Astartes','Your Command phase','Activate a chosen Combat Doctrine for this unit until your next Command phase.'],
  ['Storm of Devastation',1,'shooting','own','Adeptus Astartes','When friendly unit shoots','Ranged attacks gain Ignores Cover.'],
  ['Responsive Tactics',1,'movement','opponent','Infantry or Mounted','After enemy ends move within 8 inches of unengaged unit','Unit makes a Normal Move up to D6 inches.']
 ],
 'Assault Brethren':[
  ['Armour of Contempt',1,'shooting|fight','opponent','Adeptus Astartes','When enemy targets unit','Worsen AP of the current attacker by one.'],
  ['Gene-wrought Might',1,'fight','either','Adeptus Astartes','When friendly unit fights','Melee gains Lance; if Assault Doctrine is active, also +1 AP.'],
  ['Duty in Death',1,'fight','either','Adeptus Astartes','When enemy targets unit','Destroyed unfought models may fight on a 4+, modified when Assault Doctrine is active.']
 ],
 'Tactical Brethren':[
  ['Armour of Contempt',1,'shooting|fight','opponent','Adeptus Astartes','When enemy targets unit','Worsen AP of the current attacker by one.'],
  ['Domination Fire',1,'shooting','own','Adeptus Astartes','Immediately after friendly unit shoots','Select enemy hit by attack; suppressed enemy gets -1 to hit until your next turn.'],
  ['Masterful Tactics',1,'movement','opponent','Infantry or Mounted','Enemy ends move within 8 inches of unengaged unit','Make D6-inch normal move, or 6 inches if Tactical Doctrine is active.']
 ],
 'Devastator Brethren':[
  ['Armour of Contempt',1,'shooting|fight','opponent','Adeptus Astartes','When enemy targets unit','Worsen AP of the current attacker by one.'],
  ['Storm of Fire',1,'shooting','own','Adeptus Astartes','When unit shoots','Ranged attacks gain Ignores Cover, and +1 AP during Devastator Doctrine.'],
  ['Hail of Vengeance',2,'shooting','opponent','Adeptus Astartes','After enemy shoots and destroys friendly model','The affected unit shoots at that enemy unit only.']
 ],
 'Terminator Storm Force':[
  ['Tactical Dreadnought Fortitude',2,'shooting|fight','opponent','Terminator','When enemy attacks a Terminator unit','Attacks targeting the unit have -1 Damage for that attacker.'],
  ['Merciless Veterans',1,'shooting','own','Terminator','When Terminator unit shoots','Ranged attacks gain Lethal Hits and Sustained Hits 1.'],
  ['Gunship Extraction',1,'fight','opponent','Terminator','End of opponent Fight phase; unengaged Terminator','Place Terminator unit in Strategic Reserves.']
 ],
 'Tacticus Attack Force':[
  ['Relentless Assault',1,'shooting|fight','own','Tacticus','When friendly Tacticus unit attacks','Choose Sustained Hits against infantry-like targets or Lethal Hits against Monsters/Vehicles.'],
  ['Transhuman Swiftness',1,'fight','either','Tacticus','After enemy has fought; unit near objective','Unit gains Fights First and must fight next.'],
  ['Tactical Focus',1,'fight','either','Tacticus','When unit consolidates','Consolidate up to D3+3 inches.']
 ],
 'Tacticus Firestorm Force':[
  ['For the Emperor!',1,'command','either','Tacticus','In Command phase, near objective','Unit receives +1 Objective Control until end of turn.'],
  ['Relentless Assault',1,'shooting|fight','own','Tacticus','When unit attacks','Choose Sustained Hits for non-Monster/Vehicle or Lethal Hits for Monster/Vehicle.'],
  ['Point-blank Brutality',1,'shooting','own','Tacticus','When engaged unit shoots','Non-Blast ranged attacks gain Close-Quarters and Ignores Cover.']
 ],
 'Phobos Shadow Force':[
  ['Strike from the Shadows',1,'shooting|fight','own','Phobos','When hidden Phobos unit attacks','Attacks gain +1 Strength and Lethal Hits.'],
  ['Mortis Snares',1,'movement','own','Phobos or Scout','End of Movement; unengaged near controlled objective','Snare objective; enemy trigger may take D6 mortal wounds on 2+.'],
  ['Tactical Withdrawal',1,'fight','opponent','Phobos or Scout','End of opponent Fight; unengaged unit','Put eligible unit into Strategic Reserves.']
 ],
 'Phobos Shock Force':[
  ['Strike from the Shadows',1,'shooting|fight','own','Phobos','When hidden Phobos unit attacks','Attacks gain +1 Strength and Lethal Hits.'],
  ['Transhuman Reactions',1,'movement','opponent','Phobos','Enemy finishes move within 8 inches of unengaged Phobos','Unit moves D6, or 6 inches with Tactical Doctrine.'],
  ['Umbral Evasion',1,'shooting','opponent','Phobos','When an enemy targets Phobos unit','Enemy ranged attacks have -1 to Hit.']
 ],
 'Gravis Linebreaker Force':[
  ['Annihilating Force',1,'shooting|fight','own','Gravis','When friendly Gravis unit attacks','Attacks gain Lethal Hits.'],
  ['Purgation Push',1,'shooting','own','Gravis','After unengaged Gravis unit has shot','Move up to 5 inches toward objective, but cannot charge or embark this turn.'],
  ['Armoured Impact',1,'charge','own','Gravis','Immediately after completing charge','Roll for each engaged model; mortal wounds on 3+ against one enemy.']
 ],
 'Gravis Siege Force':[
  ['Annihilating Force',1,'shooting|fight','own','Gravis','When Gravis unit attacks','Attacks gain Lethal Hits.'],
  ['Stand Unyielding',1,'movement','own','Gravis','End of Movement phase','Secure one controlled objective.'],
  ['Suppression Volleys',1,'shooting','own','Gravis','After Gravis unit shoots and hits enemy','Enemy unit makes Battle-shock roll with -1.']
 ],
 'Stormlance Task Force':[
  ['Wind-swift Evasion',1,'fight','either','Mounted','End of Fight for unit eligible to fight','Move normally if unengaged; Fall Back if engaged.'],
  ['Sudden Onslaught',1,'movement','own','Mounted or Speeder','When unit Advances','Set Advance roll to 6.'],
  ['Hurtling Targets',1,'shooting','opponent','Mounted or Speeder','When enemy targets unit in Shooting','Attacker takes -1 to ranged Hit rolls.']
 ],
 'Ironclad Champions':[
  ['Adamantine Terror',1,'fight','either','Dreadnought','At start of Fight phase','Engaged enemies take Battle-shock rolls at -1.'],
  ['Mercy is Weakness',1,'shooting|fight','own','Dreadnought','When Dreadnought attacks','Choose Lethal Hits or Sustained Hits 1.'],
  ['Upstoppable Advance',1,'movement|charge','own','Dreadnought','When Dreadnought moves or declares charge','Gain Mobile keyword for move/charge.']
 ],
 'Gauntlet Task Force':[
  ['Aggressive Disembarkation',1,'movement','either','Infantry','When embarked unit disembarks','Relax the transport set-up positioning requirement.'],
  ['Duty is Never Done',1,'fight','either','Infantry','End of Fight; unengaged and near eligible Transport','Embark in friendly eligible transport.'],
  ['Storm and Secure',1,'movement','own','Transport','End of Movement; Battleline embarked','Secure a controlled objective.']
 ],
 'Ironstorm Spearhead':[
  ['Layered Ceramite',1,'command|movement|shooting|charge|fight|end','either','Vehicle','When Vehicle suffers mortal wound','Feel No Pain 5+ against mortal wounds.'],
  ['Might of the Machine Spirit',1,'command','own','Vehicle','In Command; exclude Transport/Fly/Walker','Ignore modifiers to Movement, BS and Hit/Wound rolls until next Command.'],
  ['Headhunter Doctrine',1,'shooting','own','Vehicle','When eligible Vehicle shoots','Ranged attacks gain Lethal Hits against Monster/Vehicle.']
 ],
 'Deathwatch Support':[
  ['Kraken Rounds',1,'shooting','own','Kill Team','When Kill Team shoots','Ranged weapons +6 inches range and +1 Strength.'],
  ['Dragonfire Rounds',1,'shooting','own','Kill Team','When Kill Team shoots','Ranged attacks re-roll Wound rolls of 1 and ignore cover.'],
  ['Hellfire Rounds',1,'shooting','own','Kill Team','When Kill Team shoots','Ranged non-Devastating Wounds attacks gain Anti-non-Vehicle 4+.'],
  ['Blackstar Extraction',1,'fight','opponent','Kill Team','End opponent Fight phase; unengaged','Place Kill Team in Strategic Reserves.']
 ]
};
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const SPACE_MARINES_STRATAGEM_CATALOG=Object.freeze(Object.entries(data)
 .flatMap(([detachment,rows])=>rows.map(([name,cpCost,phases,turn,target,timing,description])=>
   Object.freeze({
     id:slug(detachment+' '+name),name,detachment,cpCost,
     commandPointCost:cpCost,phases:Object.freeze(phases.split('|')),
     turn,target,timing,description,
     sourceUrl:SOURCE,
     sourceStatus,
     timingVerificationRequired:true,
     requiresManualTabletopConfirmation:true
   }))));
export const SPACE_MARINES_STRATAGEMS_BY_DETACHMENT=Object.freeze(Object.fromEntries(
 Object.keys(data).map(detachment=>[detachment,
   Object.freeze(SPACE_MARINES_STRATAGEM_CATALOG.filter(s=>s.detachment===detachment))])
));
export const getSpaceMarineStratagemDefinition=(detachment,id)=>
 SPACE_MARINES_STRATAGEMS_BY_DETACHMENT[detachment]?.find(s=>s.id===id)??null;
