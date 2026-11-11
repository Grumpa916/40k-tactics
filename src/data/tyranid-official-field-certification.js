/**
 * Primary-source Tyranid 11th-edition certification register, 2026-11-11.
 *
 * Only fields actually compared against the GW June 2026 Faction Pack are
 * described as source-checked. The publication supplements the Codex, and a
 * newer October Faction Pack exists. This is not a blanket certification of
 * the Tyranid Codex, October pack, October MFM, or all weapon/fire modes.
 */
export const TYRANID_JUNE_2026_OFFICIAL_SOURCE = Object.freeze({
  name: 'Games Workshop Tyranids Faction Pack, 11th edition v1.0',
  url: 'https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf',
  legalFrom: '2026-06-20',
  inspectedAt: '2026-11-11'
});

export const TYRANID_CURRENT_FACTION_PACK = Object.freeze({
  name: 'Games Workshop Tyranids Faction Pack 11th edition v1.3',
  url: 'https://assets.warhammer-community.com/eng_14-10_wh40k_faction_pack_tyranids-an12izciwp-np2hnkcsje.pdf',
  publicationDate: '2026-10-14',
  status: 'publication-indexed-current-content-not-directly-retrieved'
});

const item = (page, checkedFields, notes = '') => Object.freeze({
  status: 'june-2026-official-fields-matched-current-october-recheck-pending',
  sourceUrl: TYRANID_JUNE_2026_OFFICIAL_SOURCE.url,
  sourceVersion: '11e Faction Pack 1.0',
  page, checkedFields: Object.freeze(checkedFields), notes
});

/** Per-field reviews, not whole-datasheet or current-version certification. */
export const TYRANID_OFFICIAL_FIELD_CHECKS = Object.freeze({
  'tyranids:the-red-terror': item(7, [
    'characteristics', 'wargearNamesAndProfiles', 'keywords', 'coreAbilities'
  ], 'Removed unlisted Mobile keyword; no change to point cost (October MFM pending).'),
  'tyranids:tyranid-prime-with-lash-whip': item(9, [
    'characteristics', 'wargearNamesAndProfiles', 'extraAttacks', 'leaderEligibility'
  ]),
  'tyranids:raveners': item(11, [
    'characteristics', 'wargearNamesAndProfiles', 'unitComposition', 'vanguardInvaderKeyword'
  ]),
  'tyranids:harridan': item(13, [
    'characteristics', 'wargearNamesAndProfiles', 'twoDireBioCannons', 'damagedRule'
  ], 'Added missing -1 to Hit while 1-10 wounds remain.'),
  'tyranids:hierophant': item(15, [
    'characteristics', 'wargearNamesAndProfiles', 'twoDireBioCannons', 'damagedRule'
  ]),
  'tyranids:barbed-hierodule': item(23, [
    'wargearNamesAndProfiles', 'twoBioCannons', 'damagedRule'
  ], 'Corrected two Bio-cannons, previously one in the fixed-gear fallback.')
});

/** GW official fixed-equipment correction overrides an inferred single count. */
export const TYRANID_OFFICIAL_EQUIPMENT_OVERRIDES = Object.freeze({
  'tyranids:barbed-hierodule': Object.freeze({
    reviewedAt: '2026-11-11',
    sourceName: TYRANID_JUNE_2026_OFFICIAL_SOURCE.name,
    sourceUrl: TYRANID_JUNE_2026_OFFICIAL_SOURCE.url,
    officialWargearCertification: 'june-2026-verified-current-october-pending',
    coverageSource: 'local-datasheet-default-weapons',
    fixed: Object.freeze([
      Object.freeze({ name: 'Bio-cannon', profiles: Object.freeze(['Bio-cannon']), count: 2 }),
      Object.freeze({ name: 'Hierodule scything talons', profiles: Object.freeze(['Hierodule scything talons']), count: 1 })
    ])
  })
});

export function tyranidCurrentRulesCertificationSummary(candidates) {
  const items = (candidates ?? []).filter(x => String(x?.id ?? '').startsWith('tyranids:'));
  return Object.freeze({
    total: items.length,
    juneFieldsChecked: items.filter(x => Boolean(TYRANID_OFFICIAL_FIELD_CHECKS[x.id])).length,
    fullCurrentCodexAndFactionPackCertified: 0,
    octoberPointsFullyCertified: 0,
    missingCurrentCodexComparison: items.map(x => x.id),
    status: 'partial-primary-source-cross-check-current-october-certification-pending'
  });
}
