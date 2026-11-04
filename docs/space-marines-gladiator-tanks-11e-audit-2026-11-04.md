# 11e Space Marines Gladiator tanks — Lancer, Reaper and Valiant
Review date: 2026-11-04, US Pacific. This is a **current 11e independent datasheet transcription** cross-check and regression coverage, not full direct certification of the October GW Codex or newest official Munitorum Field Manual. PR #519 was squash-merged; this version has been reconciled onto current main.

## 11e sources
- [Gladiator Lancer, Space Marines (11e)](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Lancer)
- [Gladiator Reaper, Space Marines (11e)](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Reaper)
- [Gladiator Valiant, Space Marines (11e)](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Gladiator-Valiant)
- Official reference for later definitive verification: [GW 40k downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/), [GW live MFM — Space Marines](https://mfm.warhammer-community.com/en/space-marines).

**Important source trap:** Unversioned `40k.app/factions/space-marines/units/gladiator-*` pages found in search can reproduce **10th-edition** weapon options and mechanics. They are not the current 11e Space Marines rules. Do not restore the old optional Icarus Rocket Pod, Ironhail Stubber, Storm Bolter/Fragstorm alternatives, old Reaper 10e attack effects or old Valiant +1 to hit closest vehicle.

## Current profiles and reviewed equipment
| Datasheet | Fixed 11e equipment (no selectable swaps) | Combat/conditional rule | 11e points |
| --- | --- | --- | --- |
| Gladiator Lancer | 1 Defensive Array, 1 Laser Destroyer, 1 Armoured Hull | Laser Destroyer 72-inch, A2, S14 AP-3 D6+3, Heavy. **Aquilon Optics** permits one hit, one wound and one damage reroll only versus MONSTER/VEHICLE units. | 160 for 1st/2nd; 180 for 3rd+ |
| Gladiator Reaper | 1 Defensive Array, 1 Twin Heavy Onslaught Gatling Cannon, 1 Armoured Hull | Defensive Array A12 Rapid Fire 12. Twin cannon A12 S6 AP-1 D1, Twin-linked; Sustained Hits 2 and Devastating Wounds **against non-MONSTER/VEHICLE** only. **Reaping Tally**: +1 AP to its ranged attacks targeting non-MONSTER/VEHICLE units. | 165 for 1st/2nd; 185 for 3rd+ |
| Gladiator Valiant | 1 Defensive Array, 2 Multi-meltas, 1 Twin Las-talon, 1 Armoured Hull | Multi-melta A2 S10 AP-3 D3+2 Melta 3; Twin Las-talon A2 S10 AP-3 D3+3 Twin-linked. **Priority Target Acquisition** adds +1 Strength to this unit's ranged attacks against a target within 12 inches. | 165 for 1st/2nd; 185 for 3rd+ |

All three have M10, T10, Sv3+, W12, Ld6+, OC3. Apply Damaged 4/Deadly Demise D3 manually according to 11th-edition core rules.

## Implementation/safety
- Add three fixed 11e selection sets and exact source-scoped combat-profile overlays. No optional weapons are provided where the latest 11e datasheet does not offer any.
- The existing Gladiator copy-tier prices are retained because they match the current 11e source-scoped figures. No saved roster points are silently rewritten.
- Fixed-only import hydration is permitted when a Warhammer App paste provides *no explicit* equipment and has no unmatched/source-invalid selections. Imported old-edition options remain unresolved and are never quietly converted.
- The tactical reference records target-type and distance restrictions but does not automatically alter CP, wounds, scoring, map, or historical attack logs. Re-rolls, ranged weapon characteristics and damaged effects are confirmed on tabletop.
- This source-scoped review raises Space Marines reviewed loadout sets from 33 to 36 of the 87 cataloged non-Legends unit entries **when both PR #519 and the present PR are merged**.
- Latest official Codex/MFM full-text comparison, old-list compatibility review, iPad Safari editor and tactical live-play testing are still outstanding.

## Testing
Tests exercise fixed weapon inventory, no optional legacy choices, the Valiant's two Multi-meltas, corrected combat profiles, conditional abilities, existing ordinal prices, and safe fixed-only roster import. The complete existing GitHub Actions regression suite must pass. PR #519 is merged. Confirm the reconciled PR #520 is green on main; user has explicitly approved the merge.
