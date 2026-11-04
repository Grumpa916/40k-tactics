# Space Marines 11e — support characters, standard bearers and Lieutenant audit

Review date: November 4, 2026. Scope: **exactly ten current, non-Legends catalog entries**, after the previously source-reviewed 61. This change is **stacked after PR #525**, which depends on PR #524 (now merged). Do not merge this PR without completing upstream merges, reconciling with current main and rerunning CI.

## Source status
Cross-checked against contemporaneous 11th-edition independent Space Marines datasheet transcriptions, **not** a direct full-text certificate of the current October Games Workshop Codex, live official Munitorum Field Manual or supplements.

- [Ancient](https://wahapedia.ru/wh40k11ed/factions/space-marines/Ancient)
- [Ancient in Terminator Armour](https://wahapedia.ru/wh40k11ed/factions/space-marines/Ancient-In-Terminator-Armour)
- [Apothecary](https://wahapedia.ru/wh40k11ed/factions/space-marines/Apothecary)
- [Apothecary Biologis](https://wahapedia.ru/wh40k11ed/factions/space-marines/Apothecary-Biologis)
- [Bladeguard Ancient](https://wahapedia.ru/wh40k11ed/factions/space-marines/Bladeguard-Ancient)
- [Chaplain on Bike](https://wahapedia.ru/wh40k11ed/factions/space-marines/Chaplain-On-Bike)
- [Chaplain with Jump Pack](https://wahapedia.ru/wh40k11ed/factions/space-marines/Chaplain-With-Jump-Pack)
- [Judiciar](https://wahapedia.ru/wh40k11ed/factions/space-marines/Judiciar)
- [Librarian in Terminator Armour](https://wahapedia.ru/wh40k11ed/factions/space-marines/Librarian-In-Terminator-Armour)
- [Lieutenant](https://wahapedia.ru/wh40k11ed/factions/space-marines/Lieutenant)
- Future official certification authority: [GW downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) and [live Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines).

## Ten reviewed 11e datasheets

| Unit | Reviewed current 11e equipment and ability | 1-model points |
| --- | --- | --- |
| Ancient | Fixed Bolt Pistol and Ceramite Fists; Bolt Rifle has Focused Fire/Saturation alternate modes, or replace rifle with Power Weapon. End-of-Movement Raise the Banner; Honour of the Company +1 OC **to this unit only**. | 40 |
| Ancient in Terminator Armour | Fixed Storm Bolter and Master-crafted Power Weapon; M5 T6 Sv2+ W5 4++; objective-proximity -1 to wound only when enemy S > this unit T. End-of-Movement Raise the Banner. | 75 |
| Apothecary | Fixed Absolvor Bolt Pistol, Servo-armature and Reductor Pistol **melee Extra Attacks**. Own Command Narthecium heals D3+1 wounds; no automatic destroyed-model revival. Support, with approved extra attachment handling. | 45 |
| Apothecary Biologis | Fixed Absolvor Bolt Pistol and Servo-armature. Vivispectral Analysis Targeting gives Lethal Hits only against **non-VEHICLE** targets. Gravis infantry Support. | 60 |
| Bladeguard Ancient | Fixed Heavy Bolt Pistol and Relics of Battle. OC3, 4++; end-of-Movement Raise the Banner, +1 melee A while within an objective's range. Only Bladeguard support. | 70 |
| Chaplain on Bike | Fixed Absolvor Bolt Pistol, Crozius Arcanum and Twin Bolt Rifle; M12 T6 OC2 4++. Melee Lance; shooting Devastating Wounds against **one visible selected enemy** in own Shooting phase. | 75 |
| Chaplain with Jump Pack | Fixed Absolvor Bolt Pistol and Crozius Arcanum; M12 T5 W4 4++ Deep Strike. Melee Lance; re-roll melee wound rolls **only while at or below half strength**. | 75 |
| Judiciar | Fixed Absolvor Bolt Pistol and Executioner Relic Blade with Precision and Devastating Wounds. Fights First. **4+ invulnerable against melee attacks only**, not ranged. | 50 |
| Librarian in Terminator Armour | Fixed Force Weapon, Storm Bolter, one Smite with two shooting modes. T6 Sv2+ W5 4++. Might of Heroes in Fight grants +2 melee Strength; Thunderous Force in own Shooting gives +6-inch weapon Range; psychic roll of 1 battleshocks. Psychic Hood FNP 4+ **versus psychic attacks only**. Reject older Faction Pack Combi-weapon option. | 80 |
| Lieutenant | **26 reviewed complete linked packages**: two starting pistols × four main bolter alternatives × three melee choices = 24, plus Neo-volkite + Master-crafted Power Weapon with or without Storm Shield. Plasma Standard/Supercharge are alternate attack modes; two equipped Master-crafted Power Weapons remain possible. Storm Shield grants 4++ **only with Neo-volkite package**. Tactical Precision Lethal Hits against non-MONSTER/VEHICLE, Demi-company Commander can share chosen Captain Strategic Acumen doctrine once/turn. | 50 |

## Implementation and safety decisions

- Fixed-only source-matched imports for Ancient in Terminator Armour, Apothecary, Biologis, Bladeguard Ancient, Chaplain on Bike, Jump Chaplain, Judiciar and Terminator Librarian; **not** for selectable Ancient or Lieutenant. Unmatched/saved invalid gear remains unresolved and untouched.
- 11e Lieutenant complete packages are single-choice slots to prevent impossible independent weapon combinations. **Storm Shield is noncombat gear** and not an extra attack. Combi/Smite/Bolt Rifle alternatives are attack modes of one selected weapon.
- Support attachment and Leader pairing rules are **notes**, not newly automated live-play scoring. Do not auto-change manual VP, CP, wounds, objective control, battleshock, map positions or force a phase. Banner triggers are end of Movement, regardless of automation.
- Nine entries retain their original import points, while **Chaplain with Jump Pack is corrected from the stale 90-point import to the current independently transcribed 75-point 11e price**. Previously saved roster point totals are not silently rewritten; the app flags the mismatch for review.
- Confirmed 11e Terminator Librarian carries **Storm Bolter** and no older Faction Pack Combi-weapon swap; a current-datasheet correction, not an automatic Warhammer App import conversion.
- Regression tests cover all ten, 26 Lieutenant loadouts, alternate-mode weapon counts, battle-ready fixed imports, melee-only 4++, conditional Lethal Hits, psychic roll timing and revised total coverage.
- The review adds 10 to the prior 61 source-checked units: **71/87** if upstream #525 and this PR merge. Official Codex/MFM direct checks, model attachment UI, multiple bodyguards, user iPad live play and older roster migrations remain future work.

This PR is not merged automatically; the full GitHub Actions suite must pass and the user must explicitly approve its merge.

## November 4 PR reconciliation and regression fix

PR #525 has merged; #527 is reconstructed on the current `main` (including PR #526 map label changes). The previous CI run found exactly one failure (1171/1172 passed): a literal `\\n` fragment accidentally commented out the Drop Pod copy-tier price entry when a Chaplain with Jump Pack 75-point entry was added. The price-table source has been repaired so Drop Pod fourth copy returns 70 points while the first three remain 60. The existing tier-specific test remains authoritative; the full suite must pass on the reconciled branch before merge.
