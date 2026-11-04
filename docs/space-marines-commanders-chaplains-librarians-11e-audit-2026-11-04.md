# Space Marines 11e — ten Commanders, Chaplains and Librarians audit

**Review date:** November 4, 2026. **Scope:** exactly six Captains, two Chaplains and two Librarians from the 87-entry current non-Legends Space Marines catalog. Parent PR #524 has merged; this review has been reconciled onto the latest `main`.

## Sources and verification level

Current 11th-edition **independent datasheet transcriptions**, not a direct certification against Games Workshop's full October Codex or the latest official MFM:

- [Captain](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain)
- [Captain in Gravis Armour](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain-In-Gravis-Armour)
- [Captain in Phobos Armour](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain-In-Phobos-Armour)
- [Captain in Terminator Armour](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain-In-Terminator-Armour)
- [Captain on Bike — current 11e datasheets index](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html); do **not** use the direct page's search-engine 10th-edition hit
- [Captain with Jump Pack](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain-With-Jump-Pack)
- [Chaplain](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Chaplain)
- [Chaplain in Terminator Armour](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Chaplain-In-Terminator-Armour)
- [Librarian](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Librarian)
- [Librarian in Phobos Armour](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Librarian-In-Phobos-Armour)
- For direct future authoritative verification: [Games Workshop Warhammer 40,000 downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/), [live Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines).

## Verified 11e selection and combat differences

| Unit | Current weapon legality, movement and ability reminders | Current source-scoped base pts |
| --- | --- | --- |
| **Captain** | 7 legal **complete linked loadouts**: Bolter + Heavy Bolt Pistol + Power Weapon/Fist; Neo-volkite or Plasma Pistol + Power Weapon/Fist; or Heavy Bolt Pistol + **Relic Shield** + Power Weapon. Shield+Fist explicitly illegal. Shield adds +1 W; Finest Hour once/game +3 melee attacks and Devastating Wounds. Unit doctrine in Command. | 90 |
| **Captain in Gravis Armour** | Four packages: Master-crafted Heavy Bolt Rifle + Master-crafted Power Weapon; OR Boltstorm Gauntlet (both ranged/melee) + Extra Attacks Relic Blade/Chainsword/Fist. S6/T6/W6; Refuse to Yield **-1 Damage**, not universal wound reduction. | 90 |
| **Captain in Phobos Armour** | Fixed Bolt Pistol, Instigator Bolt Carbine (Precision) and Combat Knife (Precision/Sustained Hits). M8/T4; Scouts 6; Tactical Fluidity once/round allows D6 post-shoot move if unengaged OR 6-inch fall-back after opponent Fight if engaged. | 75 |
| **Captain in Terminator Armour** | Independent Storm Bolter/Combi-weapon and Relic Weapon/Relic Fist choices; Combi-weapon has Infernus, Purgatus and Damnatus **alternate firing modes**, not three guns. 4++ and charge re-roll; Deep Strike. | 90 |
| **Captain on Bike** | Twin Bolt Rifle fixed, Heavy Bolt Pistol/Plasma Pistol and Master-crafted Power Weapon/Thunder Hammer independent. OC2 and M12/T6. Into the Fray grants **Cleave 1 only after charging**. | 110 |
| **Captain with Jump Pack** | Eleven complete legal packages: three pistols × three melee choices, plus two shield packages where the shield replaces **both pistol and original melee weapon** (Chainsword+Shield or Thunder Hammer+Shield). M12, +1 advance and charge, Deep Strike; shield adds +1 W to character. | 90 |
| **Chaplain** | Fixed Absolvor Bolt Pistol and Crozius Arcanum (Cleave 1). Litany of Hate grants Lance. Spiritual Leader **once/round**, start any phase, clears battleshock on friendly Astartes within 6 inches. | 60 |
| **Chaplain in Terminator Armour** | Fixed Crozius Arcanum; Storm Bolter OR Relic Shield (which is **not** a weapon). Shield +1 W, Deep Strike, 4++, FNP 4+ **vs mortal wounds only**. | 75 |
| **Librarian** | Fixed Bolt Pistol, Force Weapon, one Smite with Witchfire/Focused modes. Veil of Time optionally modifies Advance; Force Dome optionally grants **4++ temporarily**. Psychic roll 1 battleshocks; psyker level 1 supports **one level-1 psychic ability per battle round**. Psychic Hood FNP 4+ against Psychic attacks. | 75 |
| **Librarian in Phobos Armour** | Same fixed attacks/Smite modes, M8/T4, Scouts 6/Stealth. Shrouding when targeted gives temporary -1 enemy hit; Soul Sight in Shooting makes a selected enemy Ignores Cover target; psychic roll 1 battleshocks, level 1 budget; Psychic Hood FNP vs Psychic only. | 75 |

## Modeling design and safety

- **Linked loadouts are ONE picker slot for ONE legal equipment package.** This avoids illegal cross-slot pairings that would otherwise require complex correlated slot constraints. A package expands into actual attack profile names in the resolved equipped-weapons list; shield is a non-combat component and never a phantom attack.
- Other leaders use independent one-model slots. Every current 11e weapon profile includes WS/BS, Strength, AP, Damage and relevant effects, with Plasma/Combi/Smite alternate firing modes represented by one selected gun.
- Character-specific +1 W shields, temporary invulnerable saves, CP/doctrines, psychic roll failures and battleshock, reroll charge uses, model attachments and conditional target rules are **manual prompts only**. They do not overwrite authoritative game state or the movement/score map.
- Four absolutely fixed-only loadouts (Phobos Captain, Chaplain, Librarian, Phobos Librarian) may hydrate safe empty Warhammer App text imports, but never replace explicit, unmatched or source-invalid choices. Composite Captain import lists require deliberate manual review and save.
- Points match the 11e current references, so no source-scoped numeric cost change is required.
- When parent PR #524 and this PR merge, reviewed current Space Marines wargear rises **51 → 61 of 87**, leaving 26 (support characters, other Chaplains/Librarians, Lieutenants and Epic Heroes) for further review. Unreviewed remains accurately flagged, not marked certified.
- Known remaining work: full direct official October GW Codex/MFM page-by-page certification; attachment UI validation; conditional ability integration in tactical advisor; iPad live-play verification; saved roster compatibility with grouped Captain weapon packages.

**PR #524 has merged; PR #525 was reconciled to `main`, and its user-approved merge requires a fresh successful CI run.** Never update V1 or unreviewed saved roster state in this audit.

## CI reconciliation check

PR #525 was rebased by reconstruction onto `main` after PR #524 squash-merged. Its application logic is unchanged from the already-tested source-reviewed implementation. Re-run all GitHub Actions on the reconciled branch before merging; a prior November 4 Actions incident caused its initial reconciled run to remain queued.
