# Adeptus Custodes data audit — October 2026

Reviewed: 2026-10-23

## Current rules snapshot

- Edition: Warhammer 40,000 11th edition.
- Faction rules: **Codex: Adeptus Custodes**, October 2026.
- Points / army construction: Games Workshop **Munitorum Field Manual**, updated 14/10/2026.
- Current Codex detachment system: **3 Detachment Points**, 13 current detachments, at most one detachment tagged **Unique Shield Host**.
- Current faction rule model: six Martial Ka'tah options — Conservai, Calistus, Salvus, Dacatarai, Kaptaris and Rendax.

## Source hierarchy

1. Games Workshop / Warhammer Community Warhammer 40,000 Downloads.
2. Current Munitorum Field Manual for points and army-construction metadata.
3. Current Codex and Games Workshop preview articles for changed profiles, army rules and detachment structure.
4. Current Warhammer App presentation / current Codex-derived structured references for full datasheet and wargear text that is not reproduced on the public Games Workshop pages.
5. Current Orpheax Custodes Builder as a secondary Codex-derived cross-check for datasheets, detachments, enhancements and stratagems.
6. Wahapedia only as a secondary cross-check for current Legends material where needed.

Never silently replace a user's saved equipment when this source snapshot changes. Advance the Custodes rules-data revision, revalidate the saved list and flag any affected selections for review.

## Catalog coverage

The app contains **36 Adeptus Custodes catalog entries**:

- 29 current Codex / current additional datasheet entries.
- 7 entries explicitly tagged as Legends.

Each entry is required by regression tests to have:

- characteristics;
- at least one combat weapon profile;
- ability text;
- current points options;
- source/review metadata;
- the current Custodes rules-data revision id.

Key regression anchors include:

- Custodian Guard Sodality: T7, W5, 3 models / 240 points.
- Telemon Heavy Dreadnought: T11, W14, 280 points.
- Blade Champion: 175 points.
- Ares Gunship: 580 points with current Arachnus weapon profiles.
- Orion Assault Dropship: 690 points with current Spiculus Heavy Bolt Launcher profile.
- Sisters of Silence units include their current variable-size points options.

## Structured wargear

Reviewed structured loadout rules are present for option-bearing Custodes datasheets, including exact multi-piece combinations where a flat weapon picker would be unsafe.

Examples:

- Shield-Captain weapon / shield combinations.
- Allarus and Dawneagle Shield-Captains.
- Custodian Guard, Sentinel Guard, Wardens and Allarus Custodians.
- Vertus Praetors and Gyrfalcon Jetbike Sodality.
- Achillus paired arm weapons.
- Telemon paired arm / Caestus combinations.
- Pallas, Caladius variants and Coronus secondary weapons.
- Knight-Centura loadouts.
- Anathema Psykana Rhino and reviewed Legends vehicle options.

Illegal combinations remain `rules-invalid`; unresolved equipment is not allowed to fall back to every datasheet weapon for Tactical Advisor calculations.

## Leader and support relationships

Reviewed attachment metadata covers current Custodes command models and the current Sisters of Silence command relationship. The existing formation engine represents Knight-Centura's Support relationship through attachment metadata while preserving its separate profile.

## Army rules and detachments

The current data contains:

- 6 Martial Ka'tah options;
- 13 current detachments;
- 29 enhancements / unit upgrades;
- 41 detachment stratagems;
- each detachment's DP cost and Force Disposition;
- the Unique Shield Host tag on the six applicable detachments;
- favored Ka'tah metadata for those Shield Hosts.

The older June-2026 Faction Pack detachment set is not mixed into the current October Codex selector.

## Multi-detachment state

Roster state is backward compatible:

- `detachment` remains the primary / first selected detachment for legacy code;
- `detachments` stores the complete selected set.

`assessCustodesDetachmentSelection` enforces the 3-DP budget and the maximum of one Unique Shield Host.

## Rules-data revision

Current revision id:

`adeptus-custodes-11e-codex-2026-10-mfm-2026-10-14-catalog-2026-10-23.1`

A future Codex, balance update, MFM or reviewed catalog change must advance this id. Existing saved Custodes lists should then be revalidated instead of silently considered current.

## Automation boundary

The imported data is sufficient for roster building, unit reference, selected-loadout combat profiles and the rules reference layer. Not every contextual 11th-edition rule is automatically modeled by the probability engine yet.

Examples that may still require table context or future engine work include:

- Martial Ka'tah readiness / expenditure timing;
- favored Ka'tah side effects;
- Anti-X, Blast, Melta, Rapid Fire, Lance, Precision and Extra Attacks where the combat engine does not yet model that keyword;
- objective-dependent detachment bonuses;
- reactive moves and once-per-battle abilities;
- actively spending detachment stratagems / enhancements in the battle-state engine.

These rules remain available as reference data and must not be silently approximated in expected-damage calculations.
