import { SPACE_MARINES_DATASHEET_DATA } from './space-marines-datasheet-data.js';
import { SPACE_MARINES_SUPPLEMENTAL_DATASHEETS } from './space-marines-supplemental-datasheets.js';

// Space Marines unit names and points captured from the supplied Warhammer App export.
// Datasheet profiles are linked from the reviewed 11th-edition community reference projection;
// missing profiles remain null rather than being guessed.
const entries = [
 ['Adrax Agatone',90,1],['Vulkan He’stan',105,1],['Marneus Calgar',180,1],['Ancient',40,1],['Ancient in Terminator Armour',75,1],['Apothecary',45,1],['Apothecary Biologis',60,1],['Bladeguard Ancient',70,1],['Captain',90,1],['Captain in Gravis Armour',90,1],['Captain in Phobos Armour',75,1],['Captain in Terminator Armour',90,1],['Captain on Bike',110,1],['Captain with Jump Pack',90,1],['Chaplain',60,1],['Chaplain in Terminator Armour',75,1],['Chaplain on Bike',75,1],['Chaplain with Jump Pack',75,1],['Judiciar',50,1],['Librarian',75,1],['Librarian in Phobos Armour',75,1],['Librarian in Terminator Armour',80,1],['Lieutenant',50,1],['Lieutenant in Phobos Armour',40,1],['Lieutenant with Combi-Weapon',85,1],['Techmarine',55,1],
 ['Assault Intercessor Squad',85,5],['Heavy Intercessor Squad',115,5],['Intercessor Squad',85,5],['Aggressor Squad',90,3],['Assault Intercessors with Jump Packs',95,5],['Bladeguard Veteran Squad',90,3],['Company Heroes',125,4],['Desolation Squad',140,5],['Eliminator Squad',85,3],['Eradicator Squad with Melta Rifles',100,3],['Eradicator Squad with Heavy Bolters',100,3],['Hellblaster Squad',115,5],['Inceptor Squad',130,3],['Incursor Squad',90,5],['Infernus Squad',95,5],['Infiltrator Squad',85,5],['Reiver Squad',85,5],['Scout Squad',65,5],['Sternguard Veteran Squad',105,5],['Terminator Assault Squad',170,5],['Terminator Squad',190,5],['Vanguard Veteran Squad with Jump Packs',110,5],
 ['Outrider Squad',80,3],['Invader ATVs',65,1],
 ['Astraeus',550,1],['Ballistus Dreadnought',150,1],['Brutalis Dreadnought',160,1],['Firestrike Servo-turrets',80,1],['Gladiator Lancer',160,1],['Gladiator Reaper',165,1],['Gladiator Valiant',165,1],['Invictor Tactical Warsuit',135,1],['Land Raider',245,1],['Land Raider Crusader',230,1],['Land Raider Redeemer',245,1],['Land Speeder',105,1],['Redemptor Dreadnought',170,1],['Repulsor',190,1],['Repulsor Executioner',270,1],['Storm Speeder Hailstrike',110,1],['Storm Speeder Hammerstrike',140,1],['Storm Speeder Thunderstrike',140,1],['Thunderhawk Gunship',850,1],
 ['Drop Pod',60,1],['Impulsor',70,1],['Rhino',70,1]
];
const slug = (name) => name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-');
export const SPACE_MARINES_ARMY_CATALOG = Object.freeze(entries.map(([name, points, models]) => Object.freeze({
 id: `space-marines:${slug(name)}`, name, faction: 'Space Marines', defaultModelCount: models,
 defaultPoints: points, pointsOptions: [{ models, points }],
 datasheet: SPACE_MARINES_DATASHEET_DATA[name] ?? SPACE_MARINES_SUPPLEMENTAL_DATASHEETS[name] ?? null,
 sourceName: 'Warhammer App export supplied for 40K Tactics Space Marines expansion',
 sourceUrl: 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
 verificationStatus: 'points-reviewed', officialRulesCrossCheck: 'pending'
})));
