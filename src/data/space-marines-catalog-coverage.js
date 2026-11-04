/**
 * November 2026 Space Marines catalog coverage.
 *
 * This supplements the older, Warhammer App-export-derived 72-entry catalog
 * with missing *current* names, plus a separate Legends name index. Current
 * unit prices here are community-reference values, NOT a direct MFM check.
 * No unreviewed datasheet statistics or wargear options are fabricated.
 *
 * Source (updated 2026-11-02): https://warmind.online/factions/space-marines
 * Official authority: https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/
 */
const CURRENT_MISSING = Object.freeze([
  ['Aethon Shaan',105,1,'epic-hero'],
  ['Caanok Var',100,1,'epic-hero'],
  ['Captain Titus',115,1,'epic-hero'],
  ['Cato Sicarius',115,1,'epic-hero'],
  ['Chief Librarian Tigurius',115,1,'epic-hero'],
  ['Darnath Lysander',160,1,'epic-hero'],
  ['Iron Father Feirros',85,1,'epic-hero'],
  ['Kaius Konorius',100,1,'epic-hero'],
  ['Kayvaan Shrike',95,1,'epic-hero'],
  ["Kor'sarro Khan",80,1,'epic-hero'],
  ['Roboute Guilliman',415,1,'epic-hero'],
  ['Suboden Khan',105,1,'epic-hero'],
  ['Tor Garadon',90,1,'epic-hero'],
  ['Wardens of Ultramar',115,6,'epic-hero'],
  ['Victrix Honour Guard',120,3,'epic-hero']
]);

const LEGENDS = Object.freeze({
  'epic-hero': [
    'Carab Culln the Risen','Chaplain Cassius','Ferren Areios',
    'Pedro Kantor','Sergeant Chronus','Sergeant Telion','Uriel Ventris'
  ],
  'character': [
    'Ancient on Bike','Apothecary on Bike','Company Champion on Bike',
    'Imperial Space Marine','Librarian on Bike','Librarian with Jump Pack',
    'Lieutenant in Reiver Armour','Primaris Company Champion','Techmarine on Bike'
  ],
  'battleline': ['Tactical Squad'],
  'infantry': [
    'Assault Squad','Assault Squad with Jump Packs','Astartes Servitors',
    'Centurion Assault Squad','Centurion Devastator Squad','Command Squad',
    'Devastator Squad','Relic Terminator Squad','Scout Sniper Squad',
    'Suppressor Squad','Tyrannic War Veterans','Vanguard Veteran Squad'
  ],
  'mounted': [
    'Attack Bike Squad','Bike Squad','Company Veterans on Bikes','Scout Bike Squad'
  ],
  'vehicle': [
    'Caestus Assault Ram','Cerberus','Chaplain Venerable Dreadnought',
    'Deathstorm Drop Pod','Deimos Predator','Deredeo Dreadnought','Dreadnought',
    'Dreadnought Drop Pod','Falchion','Fellblade','Fire Raptor Gunship','Hunter',
    'Ironclad Dreadnought','Javelin Attack Speeder','Kratos',
    'Land Raider Achilles','Land Raider Excelsior','Land Raider Helios',
    'Land Raider Prometheus','Land Raider Proteus','Land Speeder Tempest',
    'Land Speeder Tornado','Land Speeder Typhoon','Leviathan Dreadnought',
    'Mastodon','Mortis Dreadnought','Predator Annihilator',
    'Predator Destructor','Rapier Carrier','Relic Contemptor Dreadnought',
    'Rhino Primaris','Sicaran','Sokar-Pattern Stormbird','Spartan','Stalker',
    'Storm Eagle Gunship','Stormhawk Interceptor','Stormraven Gunship',
    'Stormtalon Gunship','Tarantula Air Defence Battery',
    'Tarantula Sentry Battery','Terminus Ultra','Terrax-Pattern Termite',
    'Thunderfire Cannon','Thunderhawk Transporter','Typhon',
    'Venerable Dreadnought','Vindicator','Vindicator Laser Destroyer',
    'Whirlwind','Whirlwind Scorpius','Xiphon Interceptor'
  ],
  'fortification': ['Hammerfall Bunker'],
  'transport': ['Land Speeder Storm','Razorback','Relic Razorback']
});

const slug=(name)=>name.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const groups=Object.freeze({
  'epic-hero': ['Epic Hero','Character'],
  character:['Character'],
  battleline:['Battleline','Infantry'],
  infantry:['Infantry'],
  mounted:['Mounted'],
  vehicle:['Vehicle'],
  transport:['Transport','Vehicle'],
  fortification:['Fortification']
});
const sourceUrl='https://warmind.online/factions/space-marines';
const base={faction:'Space Marines',
  sourceName:'Independent 11e Space Marines datasheet-name index (not official datasheet verification)',
  sourceUrl,reviewedAt:'2026-11-03',officialRulesCrossCheck:'pending',
  combatDataCoverage:'unverified-no-datasheet'};

export const SPACE_MARINES_ADDITIONAL_CURRENT_CANDIDATES=Object.freeze(CURRENT_MISSING.map(([name,points,models,role])=>
  Object.freeze({...base,id:'space-marines:'+slug(name),name,
    keywords:Object.freeze(groups[role]),defaultModelCount:models,defaultPoints:points,
    pointsOptions:Object.freeze([Object.freeze({models,points})]),
    verificationStatus:'name-and-points-reference-only',
    pointsSourceName:'Independent Nov 2, 2026 list (direct MFM comparison pending)',
    pointsSourceUrl:sourceUrl,legends:false})
));

export const SPACE_MARINES_LEGENDS_CANDIDATES=Object.freeze(Object.entries(LEGENDS).flatMap(([role,names])=>
  names.map(name=>Object.freeze({...base,id:'space-marines:'+slug(name),name,
    keywords:Object.freeze(groups[role]),legends:true,
    sourceName:'Legends name index; matched-play eligibility must be checked',
    verificationStatus:'legends-name-only-unverified'}))
));

export const SPACE_MARINES_COVERAGE_SOURCE=Object.freeze({
  reference:'Warmind 11th edition Space Marines index',
  referenceDate:'2026-11-02',
  reviewedAt:'2026-11-03',
  expectedDatasheetNames:176,
  officialRulesVerified:false,
  currentPlayableNamesIndependentlyCrossChecked:true,
  legendsStatus:'name-reference-only-check-event-permission'
});
