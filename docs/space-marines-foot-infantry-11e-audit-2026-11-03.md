# Space Marines remaining foot infantry — 11th edition source-scoped audit
Review date: November 3, 2026 (US Pacific). This branch is based on the reviewed Jump Pack PR #516. It is a current 11e datasheet transcription cross-check, **not direct certification** of each October printed Codex page or the GW live Munitorum Field Manual.

## Current 11e evidence
- [Assault Intercessors](https://www.40k.app/995/factions/space-marines/units/assault-intercessor-squad)
- [Heavy Intercessors](https://www.40k.app/995/factions/space-marines/units/heavy-intercessor-squad)
- [Infernus Squad](https://www.40k.app/995/factions/space-marines/units/infernus-squad)
- [Desolation Squad](https://www.40k.app/995/factions/space-marines/units/desolation-squad)
- [Company Heroes](https://www.40k.app/995/factions/space-marines/units/company-heroes)
- Cross-check [11e Space Marines datasheet index](https://wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html). The [GW downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) and [GW live MFM](https://mfm.warhammer-community.com/en/space-marines) remain definitive.

## Implemented
| Unit | Legal equipment and model count | 11e profiles and price handling |
|---|---|---|
| Assault Intercessor Squad | 5/10. All ordinary models fixed Heavy Bolt Pistol, Chainsword. Only Sergeant can replace pistol with Hand Flamer/Plasma, or Chainsword with Power Fist, Power Weapon, Thunder Hammer. | T5 S5 weapons; charge-dependent Targeted Intercession manual; 85/170 retained. |
| Heavy Intercessor Squad | 5/10. Every model has Bolt Pistol/Ceramite Fists; Sergeant retains Heavy Bolt Rifle, ordinary models may swap 1 Heavy Bolter per 5. | M5 T6 W3, Heavy Bolt Rifle and Heavy Bolter 11e profiles; objective-control defensive reminder; 115/230 retained. |
| Infernus Squad | 5/10. All equipment fixed, no option picker; ready import may auto-populate when no source loadout was supplied. | Pyreblaster Blast 1/Torrent/three attacks, Driven from Cover manual reminder; first/second 95/190, third+ 105/200. |
| Desolation Squad | Exactly 5. All have Bolt Pistol, Castellan Launcher and Ceramite Fists. Sergeant may select Superfrag/Superkrak/Vengor; other four Superfrag/Superkrak only. | Rocket profiles updated; Targeter Optics manually evaluated. Base 140 first/second, 150 third+, +5 with **one** Vengor. |
| Company Heroes | Exactly 4 distinct roles, no selectable wargear; fixed quantities: 4 Master-crafted Bolt Pistols, 2 Bolt Rifles, 1 Heavy Bolter, 3 Combat Knives, 1 Champion Power Weapon. | M6 T5 W4 OC2, model-role and Ancient/Champion keyword reminders, Command Squad and Raise the Banner manually applied. 125 first/second; 145 third+. |

## Safeguards
No saved roster, active game, manually agreed VP/CP, objective positions, approved Event Companion terrain or V1 files are overwritten. Equipment selections with unresolvable import source remain player-confirmed. Source-corrected 11e profiles are in a scoped overlay rather than changing the generated historical catalog. Recheck deployment/action, per-model allocation and shooting on iPad Safari. Do not restore 10e profiles (for example old D6 Pyreblaster or model-uniform Company Heroes).

**Outstanding:** Direct complete official October Codex and current GW MFM comparison, plus iPad live tests. This PR depends on #516 and should be retargeted to main after #516 merges; do not merge out of order.
