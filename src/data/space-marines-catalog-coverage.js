import { SPACE_MARINES_NAMED_ULTRAMARINES_DATASHEETS } from './space-marines-named-ultramarines-datasheets.js';
import { PRICE_RECONCILIATION_SOURCES } from './mfm-points-independent-reconciliation-20261112.js';
import { addReviewedUltramarinesAttachmentMetadata } from './space-marines-ultramarines-attachments.js';
import { applyReviewedSpaceMarineWargearProfiles } from './space-marines-reviewed-combat-profiles.js';

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
// GW distinguishes these from Legends: models use the indicated modern
// datasheet as Legendary Proxies, subject to event-organiser permission.
export const SPACE_MARINES_LEGENDARY_PROXY_REFERENCES=Object.freeze({
  'Tactical Squad':'Intercessor Squad',
  'Devastator Squad':'Desolation Squad',
  'Suppressor Squad':'Inceptor Squad',
  'Pedro Kantor':'Captain',
  'Uriel Ventris':'Captain'
});
const LEGENDARY_PROXY_SOURCE='https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/';

// These figures are supplementary identity/source notes, not an October 2026
// current-Codex combat profile or official up-to-date MFM price certification.
const GW_UNIT_COMPOSITIONS=Object.freeze({
  'Victrix Honour Guard':Object.freeze({
    permittedModels:Object.freeze([3,6]),
    optionalChapterAncientMaximum:1,optionalChapterChampionMaximum:1,
    sourceVersion:'June 2026 11e Faction Pack v1.0; October Codex recheck outstanding'
  }),
  'Wardens of Ultramar':Object.freeze({
    permittedModels:Object.freeze([6]),
    sourceVersion:'June 2026 11e Faction Pack v1.0; October Codex recheck outstanding'
  })
});
const GW_DATASHEET_SOURCE='https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf';
const sourceUrl='https://warmind.online/factions/space-marines';
const base={faction:'Space Marines',
  sourceName:'Independent 11e Space Marines datasheet-name index (not official datasheet verification)',
  sourceUrl,reviewedAt:'2026-11-03',officialRulesCrossCheck:'pending',
  combatDataCoverage:'unverified-no-datasheet'};

export const SPACE_MARINES_ADDITIONAL_CURRENT_CANDIDATES=Object.freeze(CURRENT_MISSING.map(([name,points,models,role])=>{
  const original=SPACE_MARINES_NAMED_ULTRAMARINES_DATASHEETS[name]??null;
  const reviewed=applyReviewedSpaceMarineWargearProfiles(name,original);
  return Object.freeze({...base,id:'space-marines:'+slug(name),name,
    keywords:Object.freeze(groups[role]),defaultModelCount:models,defaultPoints:points,
    pointsOptions:name==='Victrix Honour Guard'
      ? Object.freeze([
        Object.freeze({models:3,points:120,condition:'1st–2nd units'}),
        Object.freeze({models:6,points:250,condition:'1st–2nd units'}),
        Object.freeze({models:3,points:150,condition:'3rd+ units'}),
        Object.freeze({models:6,points:280,condition:'3rd+ units'})
      ])
      :Object.freeze([Object.freeze({models,points})]),
    ...(reviewed
      ? {datasheet:addReviewedUltramarinesAttachmentMetadata(name,reviewed),
         combatDataCoverage:original?.modelSpecificStatline
           ? 'per-model-reference-manual-allocation'
           : 'current-11e-profile-cross-checked',
         verificationStatus:'current-11e-profile-cross-checked',
         sourceName:original?.sourceName??'Current 11e named-character datasheet cross-check (official October Codex pending)',
         sourceUrl:reviewed.sourceUrl??sourceUrl
       } : {verificationStatus:'name-and-points-reference-only'}),
    pointsSourceName:'Independent 8 Nov 2026 price check; official GW MFM row certification pending',
    officialPointsCrossCheck:'pending-direct-current-mfm-read',
    independentDefaultPriceReviewAt:PRICE_RECONCILIATION_SOURCES.independentSnapshotDate,
    officialMfmSourceUrl:PRICE_RECONCILIATION_SOURCES.gwSpaceMarines,
    pointsSourceUrl:PRICE_RECONCILIATION_SOURCES.independentSpaceMarines,legends:false,
    ...(GW_UNIT_COMPOSITIONS[name] ? {
      officialCompositionSourceUrl:GW_DATASHEET_SOURCE,
      officialComposition:GW_UNIT_COMPOSITIONS[name],
      completeOctoberCodexCrossCheck:false
    } : {})});
}));

export const SPACE_MARINES_LEGENDS_CANDIDATES=Object.freeze(Object.entries(LEGENDS).flatMap(([role,names])=>
  names.map(name=>{
    const proxyAs=SPACE_MARINES_LEGENDARY_PROXY_REFERENCES[name];
    return Object.freeze({...base,id:'space-marines:'+slug(name),name,
      keywords:Object.freeze(groups[role]),legends:true,
      ...(proxyAs ? {
        legendaryProxy:true,proxyAs,
        sourceName:'Games Workshop 2026 Codex Legendary Proxy list',
        sourceUrl:LEGENDARY_PROXY_SOURCE
      } : {}),
      ...(!proxyAs ? {sourceName:'Legends name index; matched-play eligibility must be checked'} : {}),
      verificationStatus:proxyAs?'legendary-proxy-reference-only':'legends-name-only-unverified'});
  })
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
