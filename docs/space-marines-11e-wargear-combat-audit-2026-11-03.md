# Space Marines 11e combat / selectable wargear audit — 2026-11-03

This is a **bounded first wave** of the October Codex-era Army Builder verification, not certification of every Space Marine datasheet. It addresses three frequently used squads with actual selectable equipment and corrects the combat math input profiles. Changes apply to *newly selected* catalog units and to manually revalidated saved rosters; old battle snapshots and saved armies are not silently rewritten.

## Official authority and independent comparisons

- **Official Games Workshop**, [11th edition Space Marines Faction Pack v1.0, June 2026](https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf): page 31 explicitly specifies the 3 mandatory Eradicator with Heavy Bolters weapons; page 33 documents Terminator Assault loadout replacements and Storm Shield wound effects. It is an official **earlier** source, not evidence that every profile remained unchanged in October.
- **Official Games Workshop**, [Big Space Marines News, August 2026](https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/): Tacticus T5, Terminator T6, Phobos M8 and the arrival of two Intercessor bolt rifle fire modes. The separate Intercessor loadout remains unimplemented until those two specific modes and all sergeant replacement rules are verified.
- **Current 11e third-party transcription comparison**, [Aggressors](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Aggressor-Squad), [Assault Terminators](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Terminator-Assault-Squad) and [full datasheet index](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html). These corroborate the **October-era** changed weapon values and choices, but the printed October Codex and GW app are still authoritative. Mark source status accordingly.
- **Official GW Munitorum Field Manual** [current published points](https://mfm.warhammer-community.com/en/space-marines). The existing October source index uses independently corroborated pricing, not a full current official page-level MFM comparison.

## Corrected units and rules

| Unit | Verified selectable wargear scope | Combat reference updates |
| --- | --- | --- |
| Aggressor Squad | Unit-wide 3/6-model loadout: either Flamestorm Gauntlets or Auto Boltstorm Gauntlets **with** Fragstorm Grenade Launchers; all retain Twin Power Fists | Corrected gauntlet and grenade S/AP/A; Flamestorm has *close-quarters* and *ranged/Blast 2* modes, updated Close-quarters Firestorm ability |
| Eradicator Squad with Heavy Bolters | Fixed **per model**: bolt pistol + heavy bolter + close-combat weapon; no invented replacement option | Retained checked heavy bolter (36-inch Heavy/Sustained Hits 1) and Overlapping Detonations reference |
| Terminator Assault Squad | Per-model choice of Twin Lightning Claws or Thunder Hammer **and** Storm Shield; mixed-model counts permitted | T6, 4+ invulnerable and Thunder Hammer Damage 3; individual shield +1 W **must be tracked manually** because current app only has unit-level wound state. Shield costs +5 points per model; 3rd+ copy uses its distinct reviewed price tier |

**Pricing correction:** The 5 VP (!) wording is never used: the surcharge is **5 army points per Storm Shield**. The category is still **Army Builder points**, unrelated to manual Victory Points. The conditional pricing resolver now applies the selected shield quantity to the correct base copy tier. Saved roster review checks the full total rather than incorrectly comparing shield-inclusive prices to base options only.

## Verification safeguards

- The declarative rule sets feed the existing multi-faction wargear editor, loadout validator, import matching, battle weapon-profile mapping and damage calculation without a parallel Space Marine-only pipeline.
- Distinct *ranged weapon modes* are recorded as the profiles belonging to **one selection**, not as two simultaneously equipped weapons; attacks must still select the appropriate legal mode on the tabletop.
- Aggressor mixed boltstorm/flamestorm configurations are rejected because the current datasheet describes a unit-wide replacement.
- No new automatic unit-level +1 W for partially shielded Assault Terminator units: show the explicit manual warning.
- Remaining Space Marines (including Intercessors, Melta Eradicators, Captain/Calgar weapons, Victrix, Wardens and vehicles) continue to display **unreviewed wargear**. Existing saved lists require conscious revalidation, not a silent profile replacement.

## Next waves

1. **Intercessors and Sergeants:** both revised bolt rifle shooting modes, special pistol/power-weapon options, constraints and assigned model quantities.
2. **Melta Eradicators, Terminator Squad, Bladeguard, Hellblasters:** unit-size, specialist-weapon limits, alternate attack modes, and precise per-model weapon/equipment mapping.
3. **Calgar, Victrix Honour Guard, Wardens of Ultramar, other named Ultramarines:** full current October Codex datasheet and Leader eligibility comparison; identity fixes in PR #508 already merged.
4. Complete October GW MFM source comparison for all points (including shield upgrades) and run an end-to-end iPad live-game acceptance test.

At no point should presence of a projected old BSData weapon profile be treated as confirmation that an imported unit carries that weapon.
