/**
 * Space Marines 11e current Codex enhancement index (33 entries).
 * Current secondary references: 30 October 2026 data
 *   https://tactical40k.com/codex/space-marines
 * and selected November 8 cost rows:
 *   https://warmind.online/factions/space-marines
 * GW October MFM and complete Codex have not been directly compared.
 *
 * scope: 'model' uses the standard Character-only enhancement rule;
 * scope: 'unit' represents a published unit-only Upgrade.
 * A restriction always applies to the actual bearer, not just its parent faction.
 */
const source='https://tactical40k.com/codex/space-marines';
const item=(detachment,name,points,restrict='adeptus astartes',scope='model',summary='Refer to published Codex for the complete effect.')=>
  Object.freeze({
    id:name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    name,detachment,points,restriction:restrict,scope,
    upgrade:scope==='unit',description:summary,sourceUrl:source,
    verificationStatus:'11e-current-secondary-cross-check-official-mfm-pending'
  });
export const SPACE_MARINES_CURRENT_ENHANCEMENTS=Object.freeze([
  item('Gladius Task Force','Standard of the Emperor Ascendant',25,'ancient','model',
    '+1 Objective Control and Leadership, Feel No Pain 5+; once per battle, enhance melee attacks.'),
  item('Gladius Task Force','Laurels of Triumph',20,'adeptus astartes','model',
    'Bearer melee attacks gain Strength and Armour Penetration; stronger under Assault Doctrine.'),
  item('Gladius Task Force','Adept of the Codex',20,'captain','model',
    'Tactical Doctrine remains active for this unit alongside any other doctrine.'),
  item('Gladius Task Force','Artificer Armour',15,'adeptus astartes','model',
    'Bearer gets a 2+ Save and Feel No Pain 5+.'),
  item('Ironstorm Spearhead','Redoubtable Machine Spirit',25,'vehicle-excluding-transport-fly-walker','unit',
    'Vehicle receives a 5+ invulnerable save and regains one wound in Command.'),
  item('Ironstorm Spearhead','Gunnery Honours',15,'vehicle-excluding-transport-fly-walker','unit',
    'Vehicle ranged attacks gain Heavy.'),
  item('Stormlance Task Force','Supercharged Engines',10,'mounted','unit',
    'Mounted unit can re-roll Advance rolls.'),
  item('Stormlance Task Force','Auspex Triangulation Shrines',10,'speeder','unit',
    'Speeder can identify a nearby enemy for additional Detection Range.'),
  item('Deathwatch Support','Beacon Angelis',25,'adeptus astartes','model',
    'If attached to a Kill Team, the unit gains Deep Strike and cheaper Rapid Ingress.'),
  item('Gauntlet Task Force','Linebreaker Onslaught',20,'infantry','model',
    'After disembarking, unit re-rolls Charge rolls and cannot be Snap Shot.'),
  item('Gauntlet Task Force','Damocles-class Uplink',15,'captain','model',
    'Embarked Captain can activate a Combat Doctrine for nearby Infantry.'),
  item('Phobos Shadow Force','Venator Omni-auspex',15,'phobos','model',
    'Unit re-rolls Wound rolls against Hidden enemies, improved under Assault Doctrine.'),
  item('Phobos Shadow Force','Execute and Redeploy',25,'phobos','model',
    'After shooting, unengaged unit may make a short Normal Move but cannot charge.'),
  item('Tacticus Attack Force','Martial Paragon',10,'tacticus','model',
    'Unit may re-roll one Hit roll and one Wound roll.'),
  item('Tacticus Attack Force','Spearpoint War Leader',15,'tacticus','model',
    'Unit gains Scouts 6 inches.'),
  item('Phobos Shock Force','Seal of Shrouding',15,'phobos','model',
    'The unit cannot be targeted by Snap Shooting.'),
  item('Phobos Shock Force','Venator Omni-auspex',15,'phobos','model',
    'Unit re-rolls Wound rolls against Hidden enemies, improved under Assault Doctrine.'),
  item('Terminator Storm Force','Champion of the First Company',20,'terminator','model',
    'Unit melee attacks gain Lethal Hits.'),
  item('Terminator Storm Force','Corporeum Reliquary',25,'terminator','model',
    'Unit may make an Ingress move in its first Movement phase.'),
  item('Assault Brethren',"Imperium's Sword",20,'adeptus astartes','model',
    'Bearer gains a specialist melee weapon; compare full profile before live damage automation.'),
  item('Assault Brethren','Furious Assault',10,'infantry','unit',
    'Unit melee attacks gain Sustained Hits 1 against non-Monster/Vehicle targets.'),
  item('Gravis Linebreaker Force','Indefatigable Fortitude',20,'gravis','model',
    'Attacks with Strength greater than this unit Toughness suffer a Wound-roll penalty.'),
  item('Gravis Linebreaker Force','Relentless Advance',20,'gravis','model',
    'Unit gains Scouts 5 inches.'),
  item('Devastator Brethren','Master-forged Firearms',15,'infantry-or-mounted','model',
    'Non-Psychic bearer ranged attacks gain +1 Attack, Strength, AP and Damage.'),
  item('Devastator Brethren','Honour of Vigilance',20,'adeptus astartes','model',
    'Unit ranged attacks have Lethal Hits; re-roll Advance under Devastator Doctrine.'),
  item('Gravis Siege Force','Immovable Conquerors',15,'gravis','unit',
    'Unit gains +1 Objective Control.'),
  item('Gravis Siege Force','Narthecis Gauntlet',20,'apothecary-biologis','model',
    'Apothecary Biologis can restore wounds in Command.'),
  item('Tactical Brethren','Laurels of Vigilance',10,'adeptus astartes','model',
    'Once per round, reduce cost of eligible nearby Battleline Overwatch/Heroic Intervention.'),
  item('Tactical Brethren','Tactical Insight',15,'captain','model',
    'Tactical Doctrine remains active for this unit alongside any other doctrine.'),
  item('Ironclad Champions','Artificer Sarcophagus',40,'dreadnought','unit',
    'Reduce damage allocated to Dreadnought unit by one.'),
  item('Ironclad Champions','Venerable Champion (Aura)',30,'dreadnought','unit',
    'Nearby friendly Infantry/Mounted units re-roll Hit rolls of 1.'),
  item('Tacticus Firestorm Force','Cyber-familiar',15,'tacticus','model',
    'Redeploy up to three eligible Infantry units after both armies have deployed.'),
  item('Tacticus Firestorm Force','Tempered in Battle (Aura)',10,'tacticus','model',
    'Nearby friendly Astartes can re-roll Leadership rolls.')
]);
// Names such as Venator Omni-auspex occur in two detachments. A selected
// upgrade must be identified by both its detachment and its name.
export const getSpaceMarineCurrentEnhancementsForDetachment=name=>
  SPACE_MARINES_CURRENT_ENHANCEMENTS.filter(item=>item.detachment===name);
export const getSpaceMarineCurrentEnhancement=(detachment,name)=>
  SPACE_MARINES_CURRENT_ENHANCEMENTS.find(item=>item.detachment===detachment&&item.name===name)??null;
