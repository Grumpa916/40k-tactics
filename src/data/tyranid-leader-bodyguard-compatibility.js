/**
 * Tyranid Leader/Bodyguard pairings transcribed from current 40k.app datasheet
 * "Leads"/"Led by" entries on 2026-10-12. This is compatibility-only metadata:
 * points, profiles, weapons, and abilities remain unverified. Official GW
 * cross-check is explicitly pending where a public current datasheet source
 * was not available for this review.
 */
const REVIEWED_AT = "2026-10-12";
const RULES_VERSION = "Warhammer 40,000 11th edition; 40k.app datasheet listings checked 2026-10-12";

function review(sourcePage) {
  return Object.freeze({
    status: "source-reviewed",
    officialRulesCrossCheck: "pending",
    reviewedAt: REVIEWED_AT,
    rulesVersion: RULES_VERSION,
    sources: Object.freeze([sourcePage])
  });
}

function leader(allowedBodyguardDatasheetIds, leaderPage) {
  return Object.freeze({
    leader: Object.freeze({
      isLeader: true,
      allowedBodyguardDatasheetIds: Object.freeze(allowedBodyguardDatasheetIds),
      compatibilityReview: review(leaderPage)
    })
  });
}

function bodyguard(sourcePages) {
  return Object.freeze({
    bodyguard: Object.freeze({
      canReceiveLeader: true,
      maxAttachedLeaders: 1,
      compatibilityReview: Object.freeze({
        status: "source-reviewed",
        officialRulesCrossCheck: "pending",
        reviewedAt: REVIEWED_AT,
        rulesVersion: RULES_VERSION,
        sources: Object.freeze(sourcePages)
      })
    })
  });
}

const ids = {
  hiveTyrant: "tyranids:hive-tyrant",
  neurotyrant: "tyranids:neurotyrant",
  broodlord: "tyranids:broodlord",
  swarmlord: "tyranids:the-swarmlord",
  oldOneEye: "tyranids:old-one-eye",
  tyranidPrime: "tyranids:tyranid-prime-with-lash-whip",
  wingedPrime: "tyranids:winged-tyranid-prime",
  hyperadaptedRaveners: "tyranids:hyperadapted-raveners",
  raveners: "tyranids:raveners",
  tyrantGuard: "tyranids:tyrant-guard",
  neurogaunts: "tyranids:neurogaunts",
  zoanthropes: "tyranids:zoanthropes",
  genestealers: "tyranids:genestealers",
  carnifexes: "tyranids:carnifexes",
  hormagaunts: "tyranids:hormagaunts",
  termagants: "tyranids:termagants",
  meleeWarriors: "tyranids:tyranid-warriors-with-melee-bio-weapons",
  rangedWarriors: "tyranids:tyranid-warriors-with-ranged-bio-weapons"
};

const pages = {
  hiveTyrant: "https://www.40k.app/factions/tyranids/units/hive-tyrant",
  neurotyrant: "https://www.40k.app/factions/tyranids/units/neurotyrant",
  broodlord: "https://www.40k.app/factions/tyranids/units/broodlord",
  swarmlord: "https://www.40k.app/879/factions/tyranids/units/the-swarmlord",
  oldOneEye: "https://www.40k.app/879/factions/tyranids/units/old-one-eye",
  tyranidPrime: "https://www.40k.app/factions/tyranids/units/tyranid-prime-with-lash-whip",
  rangedWarriors: "https://www.40k.app/factions/tyranids/units/tyranid-warriors-with-ranged-bio-weapons",
  raveners: "https://www.40k.app/factions/tyranids/units/raveners"
};

const leaderRecords = {
  [ids.hiveTyrant]: leader([ids.tyrantGuard], pages.hiveTyrant),
  [ids.neurotyrant]: leader([ids.neurogaunts, ids.tyrantGuard, ids.zoanthropes], pages.neurotyrant),
  [ids.broodlord]: leader([ids.genestealers], pages.broodlord),
  [ids.swarmlord]: leader([ids.tyrantGuard], pages.swarmlord),
  [ids.oldOneEye]: leader([ids.carnifexes], pages.oldOneEye),
  [ids.tyranidPrime]: leader([ids.hormagaunts, ids.termagants, ids.meleeWarriors, ids.rangedWarriors], pages.tyranidPrime),
  [ids.wingedPrime]: leader([ids.rangedWarriors], pages.rangedWarriors),
  [ids.hyperadaptedRaveners]: leader([ids.raveners], pages.raveners)
};

const bodyguardRecords = {
  [ids.tyrantGuard]: bodyguard([pages.hiveTyrant, pages.neurotyrant, pages.swarmlord]),
  [ids.neurogaunts]: bodyguard([pages.neurotyrant]),
  [ids.zoanthropes]: bodyguard([pages.neurotyrant]),
  [ids.genestealers]: bodyguard([pages.broodlord]),
  [ids.carnifexes]: bodyguard([pages.oldOneEye]),
  [ids.hormagaunts]: bodyguard([pages.tyranidPrime]),
  [ids.termagants]: bodyguard([pages.tyranidPrime]),
  [ids.meleeWarriors]: bodyguard([pages.tyranidPrime]),
  [ids.rangedWarriors]: bodyguard([pages.tyranidPrime, pages.rangedWarriors]),
  [ids.raveners]: bodyguard([pages.raveners])
};

export const TYRANID_ATTACHMENT_METADATA = Object.freeze(
  Object.fromEntries(Object.entries({ ...leaderRecords, ...bodyguardRecords }).map(([id, metadata]) => [
    id,
    Object.freeze({
      ...(metadata.leader ? { leader: metadata.leader } : {}),
      ...(metadata.bodyguard ? { bodyguard: metadata.bodyguard } : {})
    })
  ]))
);

export function getTyranidAttachmentMetadata(datasheetId) {
  return TYRANID_ATTACHMENT_METADATA[datasheetId] ?? null;
}
