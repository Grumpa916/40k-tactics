/**
 * Primary Mission evidence ledger, reviewed 4 November 2026.
 *
 * These are photographs of the user's physical Chapter Approved 2026-27
 * mission deck, previously uploaded in the project. A photographed scoring
 * face verifies only visible scoring tiers; it does not certify the reverse.
 * An action face verifies only its own printed Action rules.
 *
 * The official Event Companion v1.2 (14 October 2026), page 4, was separately
 * checked for mission FAQs. Neither the photos nor the Event Companion alone
 * prove that each entire printed mission card has been reviewed.
 */
export const PRIMARY_PHOTOGRAPHED_SCORING_FACES = Object.freeze({
  'meatgrinder':'IMG_0178.jpeg',
  'search-and-scour':'IMG_0178.jpeg',
  'immovable-object':'IMG_0178.jpeg',
  'unstoppable-force':'IMG_0178.jpeg',
  'delaying-action':'IMG_0178.jpeg',
  'outmanoeuvre':'IMG_0178.jpeg',
  'consecrate':'IMG_0178.jpeg',
  'punishment':'IMG_0182.jpeg',
  'sabotage':'IMG_0182.jpeg',
  'extract-relic':'IMG_0183.jpeg',
  'vital-link':'IMG_0183.jpeg',
  'destroyers-wrath':'IMG_0179.jpeg',
  'gather-intel':'IMG_0179.jpeg',
  'vanguard-operation':'IMG_0179.jpeg'
});

export const PRIMARY_PHOTOGRAPHED_ACTION_FACES = Object.freeze({
  'death-trap':'IMG_0188.jpeg',
  'smoke-and-mirrors':'IMG_0180.jpeg',
  'locate-and-deny':'IMG_0181.jpeg',
  'surveil-the-foe':'IMG_0181.jpeg',
  'triangulation':'IMG_0180.jpeg',
  'secure-asset':'IMG_0188.jpeg',
  'sabotage':'IMG_0188.jpeg',
  'vital-link':'IMG_0189.jpeg',
  'extract-relic':'IMG_0189.jpeg',
  'gather-intel':'IMG_0189.jpeg',
  'vanguard-operation':'IMG_0191.jpeg'
});

// Concise interpretations of the *official* Event Companion v1.2 p. 4 FAQs.
// These are published clarifications, not substitutions for full card text.
export const PRIMARY_OFFICIAL_FAQ_NOTES = Object.freeze({
  'death-trap': Object.freeze([
    'Event Companion FAQ: the terrain area does not have to be trapped when the enemy unit is destroyed.',
    'Event Companion FAQ: removing an operation marker also removes any status that marker applies.'
  ]),
  'surveil-the-foe': Object.freeze([
    'Event Companion FAQ: removing the relevant operation marker later in the same turn can still allow a previously surveilled enemy unit to count.'
  ]),
  'vital-link': Object.freeze([
    'Event Companion FAQ: with multiple central objectives, the cumulative marker VP can count markers at different central objectives that you control.'
  ]),
  'smoke-and-mirrors': Object.freeze([
    'Event Companion FAQ: when a decoy operation marker is removed, the decoyed status it applies is also removed.'
  ])
});

export const PRIMARY_MISSION_EVIDENCE_SOURCES = Object.freeze({
  missionPack:'Chapter Approved 2026–27',
  officialCompanionVersion:'1.2',
  officialCompanionUrl:'https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf',
  officialCardAmendments:'none-as-of-event-companion-v1.2',
  independentlyTranscribedMissionCount:25,
  independentReferenceUrl:'https://github.com/wn-mitch/40kdc-data/tree/709ecd9f5bb6c06b7446eda6a6a0eae6b921a1c8/data/core',
  officialFullCardCertificateCount:0,
  checkedAt:'2026-11-04'
});
