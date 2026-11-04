# Space Marines Dreadnoughts — 11th edition source-scoped audit
Reviewed November 3, 2026 US Pacific. Scope: Ballistus Dreadnought, Brutalis Dreadnought, Redemptor Dreadnought. This is an **independent current 11e datasheet transcription cross-check**, not direct page-by-page certification against the October Games Workshop Codex nor the latest official Munitorum Field Manual.

## Evidence
- [Ballistus Dreadnought 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Ballistus-Dreadnought)
- [Brutalis Dreadnought 11e in the current datasheet index](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html) (Brutalis Dreadnought section; consistent with [Praetorium October 2026 profile](https://praetorium.gg/factions/space-marines/rules/space-marines-points-2026-10-13/datasheets/brutalis-dreadnought)). **Do not use** the unversioned `40k.app/factions/...` Brutalis page: it is stale 10th edition and has a contradictory -1 Damage/Charge/weapon profile.
- [Redemptor Dreadnought 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Redemptor-Dreadnought), cross-checked with [versioned Warhammer App transcription](https://www.40k.app/995/factions/space-marines/units/redemptor-dreadnought).
- Official authority: [GW Warhammer 40,000 downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) and [live MFM Space Marines](https://mfm.warhammer-community.com/en/space-marines). Direct latest official cross-check remains open.

## Delivered
| Datasheet | Legal wargear | Combat profiles and specific rule notes | Existing 11e points |
|---|---|---|---|
| Ballistus | All four fixed: Ballistus Lascannon; one Ballistus Missile Launcher (Frag/Krak separate profiles); Storm Bolters; Armoured Feet. No 11e selectable options. | M8 T10 Sv2 W12 OC4; Ballistus Strike grants Sustained Hits 1 to ranged attacks only at targets within 24 inches. Damaged 4 and Deadly Demise D3 stay manual. Fixed-only import can safely populate this unit if no source-selected weapons were present. | 150 points for 1st/2nd, 170 for 3rd+ |
| Brutalis | Twin Icarus Ironhail Heavy Stubber fixed. Two **independent** choices: (Bolt Rifles **and** Brutalis Fists) OR Brutalis Talons; Twin Heavy Bolter OR Twin Multi-melta. Talons replace BOTH rifles and fists as one choice. | M10 T10 Sv2 W12 OC4; Brutalis Talons are one eight-attack Cleave 2 profile, not old strike/sweep; Melta 3 profile uses S10 AP-3 D3+2. Brutalis Charge is now a special -1 CP Crushing Impact use, **not** automatic mortal wounds on every charge. Damage handling manual. | 160 for 1st/2nd, 180 for 3rd+ |
| Redemptor | Redemptor Fist fixed. Three independent swaps: Fragstorm Grenade Launchers/Storm Bolters; Heavy Flamer/Onslaught Gatling Cannon; Heavy Onslaught Gatling Cannon/Macro Plasma Incinerator. Optional one Icarus Rocket Pod. Plasma Standard/Supercharge are one equipped gun's two firing modes. | M8 T10 Sv2 W12 OC4; Duty Eternal now applies -1 wound roll **only when attack Strength > Toughness**, not the old 10th-edition universal damage reduction. | 170 for 1st/2nd, 190 for 3rd+; +10 per equipped Macro Plasma Incinerator |

## Safety and import semantics
- Non-optional Dreadnought weapons are selected exactly once. Fixed Ballistus equipment auto-populates only for truly empty imports and never overwrites an explicitly imported, invalid or unmatched loadout.
- Brutalis stores the linked Bolt Rifles + Fists as a single Army Builder picker item that expands into two actual weapon attack profiles. Older exports with separate equipment lines may need manual confirmation; do not silently rewrite source input.
- Redemptor plasma upgrade pricing is calculated on top of the relevant copy-order tier, not silently applied to already-saved armies. Optional Icarus must be specifically selected to appear in attack history or calculations.
- Unit abilities and phase-sensitive Stratagem costs require a player decision. No automatic wounds, VP/CP, maps, mission scoring or saved army snapshots are changed.
- Full direct current GW Codex/MFM certification, import variants, iPad Safari editor and live shooting/fight testing remain outstanding. Continue other vehicles in a separate scoped PR.

## Verification
The PR includes focused regression tests for every valid option, illegal simultaneous equipment, alternate weapon firing profiles, fixed-only Warhammer App import, current combat stats and all three Dreadnought copy-order points tiers, plus the Redemptor +10 plasma surcharge.
