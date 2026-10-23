const REVIEWED_AT = '2026-10-23';
const RULES_VERSION = 'Warhammer 40,000 11th edition; October 2026 Codex and current MFM';
const SOURCE = 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/';

function review() {
  return Object.freeze({ status:'source-reviewed', officialRulesCrossCheck:'current-mfm', reviewedAt:REVIEWED_AT, rulesVersion:RULES_VERSION, sources:Object.freeze([SOURCE]) });
}
function leader(allowedBodyguardDatasheetIds, { support = false } = {}) {
  return Object.freeze({ leader:Object.freeze({ isLeader:true, support, allowedBodyguardDatasheetIds:Object.freeze(allowedBodyguardDatasheetIds), compatibilityReview:review() }) });
}
function bodyguard(maxAttachedLeaders = 1) {
  return Object.freeze({ bodyguard:Object.freeze({ canReceiveLeader:true, maxAttachedLeaders, compatibilityReview:review() }) });
}

const id = (name) => `adeptus-custodes:${name}`;
const guard=id('custodian-guard-sodality'), sentinel=id('sentinel-guard-sodality'), wardens=id('custodian-wardens');
const adrasite=id('custodian-guard-sodality-with-adrasite-spears'), pyrithite=id('custodian-guard-sodality-with-pyrithite-spears'), sagittarum=id('sagittarum-custodians-sodality');
const allarus=id('allarus-custodians'), aquilonG=id('aquilon-terminators-with-solarite-power-gauntlets'), aquilonT=id('aquilon-terminators-with-solarite-power-talons');
const vertus=id('vertus-praetors'), gyrfalcon=id('gyrfalcon-jetbike-sodality');
const prosecutor=id('prosecutor-squad'), vigilator=id('vigilator-squad'), witchseeker=id('witchseeker-squad');

const leaders = {
  [id('trajann-valoris')]: leader([allarus,aquilonG,aquilonT,guard,sentinel,wardens,adrasite,pyrithite,sagittarum]),
  [id('blade-champion')]: leader([guard,sentinel,wardens,adrasite,pyrithite]),
  [id('shield-captain')]: leader([guard,sentinel,wardens,adrasite,pyrithite,sagittarum]),
  [id('shield-captain-in-allarus-terminator-armour')]: leader([allarus,aquilonG,aquilonT]),
  [id('shield-captain-on-dawneagle-jetbike')]: leader([vertus,gyrfalcon]),
  [id('valerian')]: leader([guard,sentinel,wardens,adrasite,pyrithite,sagittarum]),
  [id('aleya')]: leader([prosecutor,vigilator,witchseeker]),
  // 11th-edition Knight-Centura uses the Support mechanic. The existing battle
  // formation engine models attached command models through the same metadata;
  // Sister squads therefore allow two attached command models so Aleya and a
  // Knight-Centura support model can coexist without losing either profile.
  [id('knight-centura')]: leader([prosecutor,vigilator,witchseeker], { support:true })
};

const bodyguards = Object.fromEntries([
  allarus,aquilonG,aquilonT,guard,sentinel,wardens,adrasite,pyrithite,sagittarum,vertus,gyrfalcon
].map(key => [key, bodyguard(1)]));
for (const key of [prosecutor,vigilator,witchseeker]) bodyguards[key] = bodyguard(2);

export const ADEPTUS_CUSTODES_ATTACHMENT_METADATA = Object.freeze(Object.fromEntries(
  [...new Set([...Object.keys(leaders),...Object.keys(bodyguards)])].map(key => [key,Object.freeze({
    ...(leaders[key]?.leader ? { leader:leaders[key].leader } : {}),
    ...(bodyguards[key]?.bodyguard ? { bodyguard:bodyguards[key].bodyguard } : {})
  })])
));

export function getAdeptusCustodesAttachmentMetadata(datasheetId) {
  return ADEPTUS_CUSTODES_ATTACHMENT_METADATA[datasheetId] ?? null;
}
