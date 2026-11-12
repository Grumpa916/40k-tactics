# Tyranids primary-source rules certification — tranche 1
**Checked:** 11 November 2026  
**Repository:** Grumpa916/40k-tactics, 11th edition

## Result
This tranche performs a **field-level comparison** against a directly readable, first-party Games Workshop *11th-edition Tyranids Faction Pack v1.0*, legal from 20 June 2026. It fixes three discrepancies and tracks exactly which fields were compared.

**It does not certify the complete 57-datasheet Tyranid Codex or the current October 14 Faction Pack v1.3.** The GW October PDF referenced by the existing repository revision was not independently retrievable in this pass. The current October Munitorum Field Manual portal was listed on Warhammer Community but blocked direct access to its current Tyranid point table. Never treat a stale, cached MFM result or a mirrored v1.3 extract as current primary-source certification. No points were changed.

Primary official 11th-edition baseline PDF:
https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf

October index/source:
https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/
https://assets.warhammer-community.com/eng_14-10_wh40k_faction_pack_tyranids-an12izciwp-np2hnkcsje.pdf

Current MFM (listed as updated 14 October 2026):
https://mfm.warhammer-community.com/en/tyranids

## Verified fields and changes

| GW pack source | Datasheet | Compared fields | Result |
| --- | --- | --- | --- |
| p7 | The Red Terror | stat line, melee profiles, keywords, abilities | **Corrected:** removed `Mobile` from keywords; it is not on the GW datasheet. |
| p9 | Tyranid Prime with Lash Whip | stat line, 3 melee weapons, `Extra Attacks`, leader eligibility | No mismatch discovered in checked fields. |
| p11 | Raveners | stat line, 5-model unit, melee claws and talons, Vanguard Invader | No mismatch discovered in checked fields. |
| p13 | Harridan | stat line, 2 Dire bio-cannons, ranged/melee profiles and damaged condition | **Corrected:** missing Damaged: 1–10 wounds remaining rule, `-1 to Hit`. Two-cannon selection was already fixed in PR #621. |
| p15 | Hierophant | stat line, two Dire bio-cannons, other fixed weapons, damaged condition | No mismatch discovered in checked fields; two-cannon selection fixed in PR #621. |
| p26 | Barbed Hierodule (Legends) | equipment and damaged condition | **Corrected:** fixed bio-cannon quantity from 1 to **2**; affects recorded equipped wargear and forecast shot count. |

**Coverage metric:** 6 / 57 datasheets with explicitly logged June GW field comparisons; 0 / 57 fully re-certified against October current Codex/Faction Pack and current official October MFM. These are independent metrics from 56 / 57 structured loadout coverage and must not be conflated.

## Rules Update section — targeted reconciliation
The June GW Faction Pack *Rules Updates* (pp17 onward) also expressly describes:
- Shadow in the Warp and Synapse wording.
- Exocrine bio-plasmic cannon S9.
- Broodlord/Parasite of Mortrex Synapse/Shadow in the Warp.
- Neurolictor Synapse keyword.
- Norn Assimilator Harvester keyword.
- Tyrannofex Rupture Cannon damage D6+6.
- Deep Strike and reserves updates for Trygon, Raveners and related units.
- Harpy/Hive Crone aircraft profiles and spore-setup ranges.

The local repository already contains those specific update patterns where sampled, but this pass does **not** mark them fully verified against the newer October pack. Source-version reconciliation remains necessary, including all attached detachment rules, enhancement costs/effects, stratagem triggers and conditions.

## Explicit outstanding priorities
1. **Retrieve the current GW October Faction Pack v1.3** and compare every revision, updated datasheet, detachment, stratagem, and erratum against current `src/data` and `src/rules`. Earlier GW material is supporting baseline only.
2. **Current GW October MFM:** verify point tiers for all 57 entries, 10 detachments, unit size options, upgrade/add-on costs, leader attachment choices, source version and Legends eligibility. Do not substitute the search engine's older v1.0 index.
3. **Codex content:** the Faction Pack *supplements* Codex: Tyranids and cannot by itself certify the complete Codex. Official Codex/app evidence is required for each unlisted datasheet's weapons, abilities, compositions and selectable wargear.
4. **Hyperadapted Raveners:** their fixed physical equipment is in the official June Faction Pack (one Prime, four Raveners, exactly one Venom Bolt), but casualty-identity tracking still needs implementation. Do not double-count the weapon or auto-certify its live damage state.
5. **Combat engine:** confirming that a Damaged rule exists in source data does not mean that every incoming/outgoing forecast applies the penalty automatically; verify thresholds and whether hit modifiers are evaluated dynamically.
6. **Physical PDF inspection:** the web text could be read, but attempting a screenshot of the large June GW PDF failed because the public screenshot service rejected its size. The source comparison was textual, not full page-image verification.
7. **Battle persistence:** previous saved lists were not silently rewritten; when applying the correct two-cannon Barbed Hierodule equipment, an old explicitly saved one-cannon loadout may require review/resave.

## What the code does now
- New `tyranid-official-field-certification.js` tracks six GW June field comparisons and a separate current October source pending flag.
- Corrected `src/data/tyranid-datasheet-details.js` for Harridan's damaged effect and the Red Terror's keywords.
- Corrected the Barbed Hierodule's fixed bio-cannon count using an official-source override that flows to Army Builder and projected weapon quantity.
- Updated the global official source index and introduced regression tests preventing baseline checks from being mislabeled complete October certification.

**Acceptance:** full test/build CI should pass and user should approve PR before merge. No edits to event maps, mission rules, existing saved rosters or point costs.
