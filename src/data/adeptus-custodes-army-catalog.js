import { getAdeptusCustodesDatasheetDetails } from './adeptus-custodes-datasheet-details.js';
import { getAdeptusCustodesAttachmentMetadata } from './adeptus-custodes-leader-bodyguard-compatibility.js';
import { getRulesDataRevisionForFaction } from './rules-data-revisions.js';

const RULES_REVISION = getRulesDataRevisionForFaction('Adeptus Custodes');

const units = Object.freeze([
  ['Trajann Valoris','trajann-valoris'],
  ['Blade Champion','blade-champion'],
  ['Shield-Captain','shield-captain'],
  ['Shield-Captain in Allarus Terminator Armour','shield-captain-in-allarus-terminator-armour'],
  ['Shield-Captain on Dawneagle Jetbike','shield-captain-on-dawneagle-jetbike'],
  ['Custodian Guard Sodality','custodian-guard-sodality'],
  ['Sentinel Guard Sodality','sentinel-guard-sodality'],
  ['Custodian Wardens','custodian-wardens'],
  ['Allarus Custodians','allarus-custodians'],
  ['Aquilon Terminators with Solarite Power Gauntlets','aquilon-terminators-with-solarite-power-gauntlets'],
  ['Aquilon Terminators with Solarite Power Talons','aquilon-terminators-with-solarite-power-talons'],
  ['Venatari with Kinetic Destroyers','venatari-with-kinetic-destroyers'],
  ['Venatari with Verutum Lances','venatari-with-verutum-lances'],
  ['Vertus Praetors','vertus-praetors'],
  ['Gyrfalcon Jetbike Sodality','gyrfalcon-jetbike-sodality'],
  ['Contemptor-Galatus Dreadnought','contemptor-galatus-dreadnought'],
  ['Contemptor-Achillus Dreadnought','contemptor-achillus-dreadnought'],
  ['Telemon Heavy Dreadnought','telemon-heavy-dreadnought'],
  ['Pallas Grav-Attack','pallas-grav-attack'],
  ['Caladius Grav-Tank','caladius-grav-tank'],
  ['Caladius Annihilator Grav-Tank','caladius-annihilator-grav-tank'],
  ['Coronus Grav-Carrier','coronus-grav-carrier'],
  ['Knight-Centura','knight-centura'],
  ['Prosecutor Squad','prosecutor-squad'],
  ['Witchseeker Squad','witchseeker-squad'],
  ['Vigilator Squad','vigilator-squad'],
  ['Anathema Psykana Rhino','anathema-psykana-rhino'],
  ['Ares Gunship','ares-gunship'],
  ['Orion Assault Dropship','orion-assault-dropship'],
  ['Aleya','aleya'],
  ['Valerian','valerian'],
  ['Custodian Guard Sodality with Adrasite Spears','custodian-guard-sodality-with-adrasite-spears'],
  ['Custodian Guard Sodality with Pyrithite Spears','custodian-guard-sodality-with-pyrithite-spears'],
  ['Sagittarum Custodians Sodality','sagittarum-custodians-sodality'],
  ['Venerable Land Raider','venerable-land-raider'],
  ['Venerable Contemptor Dreadnought','venerable-contemptor-dreadnought']
]);

export const ADEPTUS_CUSTODES_ARMY_CATALOG = Object.freeze(units.map(([name,slug]) => {
  const id=`adeptus-custodes:${slug}`;
  const details=getAdeptusCustodesDatasheetDetails(id);
  if(!details) throw new Error(`Missing reviewed Adeptus Custodes datasheet details for ${id}.`);
  const attachmentMetadata=getAdeptusCustodesAttachmentMetadata(id);
  const {defaultModelCount,defaultPoints,pointsOptions,dataSource,...datasheetProfile}=details;
  return Object.freeze({
    id,
    name,
    faction:'Adeptus Custodes',
    defaultModelCount,
    defaultPoints,
    pointsOptions,
    sourceName:dataSource?.sourceName ?? 'October 2026 Codex: Adeptus Custodes',
    sourceUrl:dataSource?.sourceUrl ?? RULES_REVISION?.factionRules?.sourceUrl,
    reviewedAt:dataSource?.reviewedAt ?? RULES_REVISION?.reviewedAt ?? null,
    pointsSourceName:RULES_REVISION?.points ? `${RULES_REVISION.points.name} (${RULES_REVISION.points.revisionLabel})` : dataSource?.pointsSourceName,
    pointsSourceUrl:RULES_REVISION?.points?.sourceUrl ?? dataSource?.pointsSourceUrl,
    rulesDataRevisionId:RULES_REVISION?.revisionId ?? null,
    officialRulesCrossCheck:dataSource?.officialRulesCrossCheck ?? 'partial',
    verificationStatus:dataSource?.status ?? 'source-reviewed',
    ...(dataSource?.legends ? { legends:true } : {}),
    datasheet:Object.freeze({
      ...datasheetProfile,
      ...(attachmentMetadata ?? {})
    })
  });
}));
