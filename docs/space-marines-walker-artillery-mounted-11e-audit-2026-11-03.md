# 11e Space Marines continuation — Invictor, Firestrike and Invader
Reviewed November 3, 2026 (US Pacific). This is the second **stacked** vehicle/audit batch; its source branch was based on PR #518, now merged, and this reconciled version is based on `main`. Review scope is source-scoped 11th-edition datasheet transcription, **not a direct certificate** of the full October Games Workshop Codex or GW live Munitorum Field Manual.

## Sources
- [Invictor Tactical Warsuit, 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Invictor-Tactical-Warsuit).
- [Firestrike Servo-turrets, versioned 11e 40k.app transcription](https://www.40k.app/995/factions/space-marines/units/firestrike-servo-turrets). Do **not** use the unversioned 10e Firestrike page with older 3-inch Move and 75/150 point prices.
- [Invader ATVs, 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Invader-ATVs).
- Current Games Workshop authority: [40k downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) and [live Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines). Official current pages need direct comparison.

## Implemented
| Unit | 11e equipment | Stats, abilities and prices |
|---|---|---|
| Invictor Tactical Warsuit | 1 model. Four fixed weapons: Fragstorm Grenade Launcher, Heavy Bolter, Ironhail Heavy Stubbers, Invictor Fist. Incendium Cannon OR Twin Ironhail Autocannon. | M10 T9 Sv3+ W12 OC4, Scouts 8 inches, Forward Assault Warsuit once-first-round mark and reroll wound 1s; 135 for 1st/2nd, 150 for 3rd+. |
| Firestrike Servo-turrets | 1–2 models. Every model keeps Hovering Bulk; independently picks Twin Firestrike Las-talon OR Twin Firestrike Autocannon. | M5 T6 Sv2+ W6 OC2, las-talon D3+3, autocannon A4 with Rapid Fire 2; current Sentinel Protocols once/phase for Overwatch snap shooting unmodified 4+; 80 per model, 160 for two. |
| Invader ATVs | 1–2 models. Every model retains Bolt Pistol, Twin Bolt Rifle and Armoured Impact; each independently picks Onslaught Gatling Cannon OR Multi-melta, +5 pts for each equipped Multi-melta. | M10 T6 Sv3+ W8 OC2; Twin Bolt Rifle BS2+, Multi-melta S10 AP-3 D3+2, Melta 3. Aggressive Reconnaissance conditional +1 wound on isolated enemy. First/second: 65/130 for 1/2; third+: 75/140 for 1/2; add 5 per Multi-melta. |

## Safeguards and next steps
- Reviewed selections and their profiles are independent of unit reference data. The cost resolver first identifies model size and ordinal copy tier and then adds exactly 5 points per selected Multi-melta.
- Firestrike Overwatch, Invictor Forward Assault mark and ATV isolated-target condition require manual phase/target confirmation; no unsupported automatic CP, wound or game-state changes.
- Existing saved rosters, battle phase tracking, manually agreed scoring, user maps, deployments and V1 untouched. Model choices and new version stamp only affect the new source-reviewed version once merged.
- PR #518 has merged; PR #519 was reconstructed against `main` with only its own delta. The reconciled PR must pass CI and still requires explicit user merge approval.
- Full current official October Codex/MFM checks, iPad Safari editor and battle verification remain pending. Continue heavy tanks and transports separately.
