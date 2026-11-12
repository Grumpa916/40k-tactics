# Tyranid and Space Marine 11th-edition points reconciliation
**Audit:** 12 November 2026 · **Repository:** Grumpa916/40k-tactics

## Executive result

**144 / 144 independently benchmarked current first-copy/default-size rows match the 8 November 2026 independent 11e reference.**

| Audit scope | Rows | Result | Official GW 14-Oct MFM certification |
| --- | ---: | --- | --- |
| Tyranids | 57, including 5 Legends | 57 matched | **0 officially verified** |
| Space Marines | 87 current, excludes 89 separately indexed Legends | 87 matched | **0 officially verified** |
| Additional published model-size rows sampled | 45 | 45 matched | Not directly certified |
| Focused higher-copy and wargear-price checks | 20 tier cases, 8 named gun cases | Passed in CI | Not directly certified |
| Tyranid enhancements / Upgrades | 34 definitions | 34 still marked pending primary MFM certification | 0 |
| Space Marine Enhancements / Upgrades | 33 definitions | 33 still marked pending primary MFM certification | 0 |

**Critical distinction:** Matching an independent source is *not* certifying an official Games Workshop MFM value.

## Authoritative GW source and access limitation

- Official [Warhammer 40,000 Downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) lists the Munitorum Field Manual updated **14 October 2026**.
- Official live factions: [Tyranids](https://mfm.warhammer-community.com/en/tyranids), [Space Marines](https://mfm.warhammer-community.com/en/space-marines). **Both returned HTTP 403 on 12 November.**
- Search engines sometimes display **v1.0** MFM page text crawled roughly four months earlier. Some of its values are demonstrably superseded (e.g. Tyranid Tervigon 160 rather than 150; Marine Intercessors 75 rather than 85). Do **not** mistake those rows for the 14 October live publication.

## Exact independent reference used

- [Warmind Tyranids 11e points](https://warmind.online/factions/tyranids) — lists its data updated 8 November 2026; default unit sizes and some larger sizes across all 57.
- [Warmind Space Marines 11e points](https://warmind.online/factions/space-marines) — updated 8 November 2026, 87 current entries within 176 including Legends.
- [Warp Nexus Space Marine 2 October price change ledger](https://warpnexus.app/updates/2026-10-02/) — details 48 first-copy changed prices and 23 extra-copy changes; its [14 October update](https://warpnexus.app/updates/2026-10-14/) reports no subsequent Marine point changes in that update.
- [Praetorium Victrix 11e MFM v1.6](https://praetorium.gg/factions/ultramarines/rules/mfm-1-6/datasheets/victrix-honour-guard) corroborates that current Victrix Honour Guard **3-model** prices are 120 for copies 1–2, 150 from copy 3 onward; 6-model prices 250 and 280. Old v1.0 indexed second-copy prices are obsolete.

These are **third-party transcriptions**; no official endorsement or direct GW row-by-row verification is claimed.

## Key cross-check cases

Tyranids: Norn Emissary and Norn Assimilator 250 base (extra copy +20), Exocrine 135 (third copy 145), Tervigon 150, Tyrannofex 170 base (acid spray +10, rupture cannon +20), Neurolictor 80 (+10 on third), Raveners 125 (+10 on third), Pyrovores sizes and extra-copy tiers, Zoanthropes 3/6 models 90/190, and five Legends.

Space Marines: Marneus Calgar 180, Guilliman 415, Captain Titus 115, Repulsor Executioner 260 (Heavy Laser Destroyer +10, third+ 280 before weapon), Redemptor Dreadnought 170 (Macro Plasma Incinerator +10), Heavy Intercessors 5/10 models 115/230, Terminators 5/10 models 190/380, Aggressors 3/6 models 90/180, and Victrix Honour Guard 120/250 for first two copies and 150/280 for later copies.

## Implementation and acceptance

1. Source-scoped first-copy snapshots in `src/data/mfm-points-independent-reconciliation-20261112.js`, including date and confidence status.
2. Deterministic drift detection in `src/rules/mfm-points-independent-audit.js`, with missing and mismatched unit records.
3. Regression tests in `tests/state/tyranid-space-marine-points-independent-20261112.test.js` for 144 first-copy values, 45 additional squad sizes, important extra-copy pricing and weapon premiums.
4. Updated unit source metadata and rules revision labels **without changing any unit, weapon or enhancement prices or overwriting any saved roster**. No revision bump is necessary when only evidence metadata changes.
5. CI must succeed and PR must receive explicit user approval before merge.

## What remains to finish actual *official* certification

1. Capture accessible **14 October 2026 GW MFM** Tyranid and Space Marine pages (full-page screenshots, accessible HTML/text export or official Warhammer 40,000 app price export) and compare every base, size, extra-copy and wargear/Upgrade tier to the current local rules.
2. Confirm all **67 enhancement/Upgrade prices** and **all detachment DP/force disposition** rows against that same direct GW version. The independent 144-default-point audit does not perform this step.
3. Verify all **89 Space Marine Legends** price rows separately if desired for casual play; Legends are not part of the current 87-unit benchmark.
4. When differences are established against an official 14 October row, prepare explicit change-by-change tests and update the source catalog, without silently rewriting previously saved battle records.

**Certification summary:** independent price audit **passed**, official current-GW numeric certification **blocked**, not completed.
