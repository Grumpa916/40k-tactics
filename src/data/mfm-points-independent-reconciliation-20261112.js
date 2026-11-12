/**
 * 11e points reconciliation snapshot, 2026-11-12.
 *
 * IMPORTANT: Not a primary-source October 2026 GW certification.
 * GW official 14-Oct MFM listing is accessible, but both current faction
 * HTML endpoints return HTTP 403. Search indexes still expose the stale v1.0
 * text, so DO NOT use that older text to overwrite 14-Oct points.
 *
 * First-copy/default-size numeric rows were manually compared with Warmind's
 * 08-Nov-2026 11e points table. Copy-specific premiums and conditions are
 * checked separately against dated October independent changes, not this list.
 * Names and amounts are individual factual data, not copied page prose.
 */
export const PRICE_RECONCILIATION_SOURCES=Object.freeze({
  gwOfficialIndex:'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
  gwTyranids:'https://mfm.warhammer-community.com/en/tyranids',
  gwSpaceMarines:'https://mfm.warhammer-community.com/en/space-marines',
  independentTyranids:'https://warmind.online/factions/tyranids',
  independentSpaceMarines:'https://warmind.online/factions/space-marines',
  independentMarineUpdate:'https://warpnexus.app/updates/2026-10-02/',
  independentNoChangeNote:'https://warpnexus.app/updates/2026-10-14/',
  officialMfmPublicationDate:'2026-10-14',
  independentSnapshotDate:'2026-11-08',
  checkedAt:'2026-11-12',
  directOctoberMfmRetrieved:false,
  directlyCertifiedUnitRows:0,
  status:'independent-first-copy-price-reconciliation-primary-GW-October-pending',
  note:'No claim of 14-Oct GW unit, detachment or enhancement cost certification without direct current publication access.'
});
const parse=(source)=>Object.freeze(source.trim().split('\n').map(row=>{
 const [name,models,points]=row.split('|');
 return Object.freeze({name,models:Number(models),points:Number(points),
  status:'independent-price-row-confirmed-current-official-mfm-pending'});
}));
export const TYRANID_FIRST_COPY_POINT_BENCHMARK=parse(`Hive Tyrant|1|195
Winged Hive Tyrant|1|185
Neurotyrant|1|120
Tervigon|1|150
Tyrannofex|1|170
Exocrine|1|135
Maleceptor|1|180
Psychophage|1|110
Screamer-Killer|1|125
Carnifexes|1|90
Termagants|10|55
Hormagaunts|10|70
Neurogaunts|11|45
Genestealers|5|75
Barbgaunts|5|50
Biovores|1|60
Hive Guard|3|80
Zoanthropes|3|90
Gargoyles|10|75
Lictor|1|60
Deathleaper|1|80
Neurolictor|1|80
Pyrovores|1|40
Von Ryan’s Leapers|3|55
Ripper Swarms|1|30
Parasite of Mortrex|1|65
Haruspex|1|125
The Red Terror|1|120
Mucolid Spores|1|30
Spore Mines|3|55
Venomthropes|3|55
Harpy|1|185
Hive Crone|1|170
Harridan|1|610
Hierophant|1|810
Tyrannocyte|1|80
Sporocyst|1|145
Trygon|1|135
Mawloc|1|130
Norn Assimilator|1|250
Norn Emissary|1|250
Toxicrene|1|120
Broodlord|1|80
The Swarmlord|1|210
Old One Eye|1|130
Tyranid Prime with Lash Whip|1|75
Winged Tyranid Prime|1|65
Hyperadapted Raveners|5|165
Raveners|5|125
Tyrant Guard|3|80
Tyranid Warriors with Melee Bio-weapons|3|75
Tyranid Warriors with Ranged Bio-weapons|3|60
Malanthrope|1|75
Barbed Hierodule|1|340
Dimachaeron|1|200
Scythed Hierodule|1|330
Sky-slasher Swarms|3|60`);
export const SPACE_MARINE_FIRST_COPY_POINT_BENCHMARK=parse(`Adrax Agatone|1|90
Vulkan He’stan|1|105
Marneus Calgar|1|180
Ancient|1|40
Ancient in Terminator Armour|1|75
Apothecary|1|45
Apothecary Biologis|1|60
Bladeguard Ancient|1|70
Captain|1|90
Captain in Gravis Armour|1|90
Captain in Phobos Armour|1|75
Captain in Terminator Armour|1|90
Captain on Bike|1|110
Captain with Jump Pack|1|90
Chaplain|1|60
Chaplain in Terminator Armour|1|75
Chaplain on Bike|1|75
Chaplain with Jump Pack|1|75
Judiciar|1|50
Librarian|1|75
Librarian in Phobos Armour|1|75
Librarian in Terminator Armour|1|80
Lieutenant|1|50
Lieutenant in Phobos Armour|1|40
Lieutenant with Combi-Weapon|1|85
Techmarine|1|55
Assault Intercessor Squad|5|85
Heavy Intercessor Squad|5|115
Intercessor Squad|5|85
Aggressor Squad|3|90
Assault Intercessors with Jump Packs|5|95
Bladeguard Veteran Squad|3|90
Company Heroes|4|125
Desolation Squad|5|140
Eliminator Squad|3|85
Eradicator Squad with Melta Rifles|3|100
Eradicator Squad with Heavy Bolters|3|100
Hellblaster Squad|5|115
Inceptor Squad|3|130
Incursor Squad|5|90
Infernus Squad|5|95
Infiltrator Squad|5|85
Reiver Squad|5|85
Scout Squad|5|65
Sternguard Veteran Squad|5|105
Terminator Assault Squad|5|170
Terminator Squad|5|190
Vanguard Veteran Squad with Jump Packs|5|110
Outrider Squad|3|80
Invader ATVs|1|65
Astraeus|1|550
Ballistus Dreadnought|1|150
Brutalis Dreadnought|1|160
Firestrike Servo-turrets|1|80
Gladiator Lancer|1|160
Gladiator Reaper|1|165
Gladiator Valiant|1|165
Invictor Tactical Warsuit|1|135
Land Raider|1|245
Land Raider Crusader|1|230
Land Raider Redeemer|1|245
Land Speeder|1|105
Redemptor Dreadnought|1|170
Repulsor|1|190
Repulsor Executioner|1|260
Storm Speeder Hailstrike|1|110
Storm Speeder Hammerstrike|1|140
Storm Speeder Thunderstrike|1|140
Thunderhawk Gunship|1|850
Drop Pod|1|60
Impulsor|1|70
Rhino|1|70
Aethon Shaan|1|105
Caanok Var|1|100
Captain Titus|1|115
Cato Sicarius|1|115
Chief Librarian Tigurius|1|115
Darnath Lysander|1|160
Iron Father Feirros|1|85
Kaius Konorius|1|100
Kayvaan Shrike|1|95
Kor'sarro Khan|1|80
Roboute Guilliman|1|415
Suboden Khan|1|105
Tor Garadon|1|90
Wardens of Ultramar|6|115
Victrix Honour Guard|3|120`);
export const getFirstCopyPointBenchmark=faction=>{
 const normalized=String(faction??'').trim().toLowerCase();
 return normalized==='tyranids'?TYRANID_FIRST_COPY_POINT_BENCHMARK:
   normalized==='space marines'?SPACE_MARINE_FIRST_COPY_POINT_BENCHMARK:[];
};
