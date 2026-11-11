// 11th-edition Tyranid loadout review, 11 November 2026.
// Equipment counts and alternate profiles have been independently checked
// against the current v1.3 datasheet presentation. This is not certification
// of every Codex and Faction Pack update: the primary-source cross-check
// and special-case casualty attribution remain separate work.
const SOURCE = 'https://www.wahapedia.ru/wh40k11ed/factions/tyranids/';
const choice = (name, profiles = [name]) => Object.freeze({ name, profiles: Object.freeze(profiles) });
const fixed = (name, { count = 0, perModel = 0, profiles = [name] } = {}) =>
  Object.freeze({ ...choice(name, profiles), count, perModel });
const rule = (slug, body) => Object.freeze({
  sourceName: '11th-edition v1.3 Tyranid datasheet, independent wargear cross-check',
  sourceUrl: SOURCE + slug,
  reviewedAt: '2026-11-11',
  officialWargearCertification: 'pending',
  ...body
});
const fixedOnly = (slug, equipment) => rule(slug, {
  // Only truly fixed equipment can be inferred without asking the player.
  coverageSource: 'local-datasheet-default-weapons',
  fixed: Object.freeze(equipment)
});

export const TYRANID_REVIEWED_ADDITIONAL_WARGEAR = Object.freeze({
  'tyranids:old-one-eye': fixedOnly('Old-One-Eye', [
    fixed("Old One Eye's claws and talons", {
      count: 1, profiles: ["Old One Eye's claws and talons (strike)", "Old One Eye's claws and talons (sweep)"]
    })
  ]),
  'tyranids:zoanthropes': fixedOnly('Zoanthropes', [
    fixed('Warp Blast', {
      perModel: 1, profiles: ['Warp Blast (witchfire)', 'Warp Blast (focused witchfire)']
    }),
    fixed('Chitinous claws and teeth', { perModel: 1 })
  ]),
  'tyranids:maleceptor': fixedOnly('Maleceptor', [
    fixed('Psychic overload', { count: 1 }),
    fixed('Massive scything talons', {
      count: 1, profiles: ['Massive scything talons (strike)', 'Massive scything talons (sweep)']
    })
  ]),
  'tyranids:norn-emissary': fixedOnly('Norn-Emissary', [
    fixed('Psychic Tendril', {
      count: 1, profiles: [
        'Psychic Tendril (neuroparasite)', 'Psychic Tendril (neuroblast)', 'Psychic Tendril (neurolance)'
      ]
    }),
    fixed('Monstrous scything talons', { count: 1 }),
    fixed('Monstrous rending claws', { count: 1 })
  ]),
  'tyranids:norn-assimilator': fixedOnly('Norn-Assimilator', [
    fixed('Toxinjector Harpoon', {
      count: 1, profiles: ['Toxinjector Harpoon (ranged)', 'Toxinjector Harpoon (melee)']
    }),
    fixed('Monstrous scything talons', { count: 1 })
  ]),
  'tyranids:toxicrene': fixedOnly('Toxicrene', [
    fixed('Massive toxic lashes', {
      count: 1, profiles: ['Massive toxic lashes (Ranged)', 'Massive toxic lashes (Melee)']
    })
  ]),
  'tyranids:hierophant': fixedOnly('Hierophant', [
    fixed('Bio-plasma torrent', { count: 1 }),
    fixed('Dire bio-cannon', { count: 2 }),
    fixed('Lashwhip pods', { count: 1 }),
    fixed('Titanic scything talons', { count: 1 })
  ]),
  'tyranids:harridan': fixedOnly('Harridan', [
    fixed('Dire bio-cannon', { count: 2 }),
    fixed('Gargantuan scything talons', { count: 1 })
  ]),
  'tyranids:harpy': rule('Harpy', {
    fixed: Object.freeze([
      fixed('Stinger salvoes', { count: 1 }),
      fixed('Scything wings', { count: 1 })
    ]),
    slots: Object.freeze([
      Object.freeze({
        id: 'main-cannon', count: 1,
        choices: Object.freeze([choice('Twin stranglethorn cannon'), choice('Twin heavy venom cannon')])
      })
    ])
  })
});
