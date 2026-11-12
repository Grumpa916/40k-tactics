# Space Marines — official Codex certification and Combat Doctrine / Stratagem implementation
**Audit date:** 11 November 2026 · **11th edition** · proposed branch `feat/space-marines-doctrines-stratagems-20261111`

## Verification grading
**Genuine primary Games Workshop source (checked):**
*Games Workshop Space Marines Printed Product Updates v1.1*, published 14 October 2026 (one page).
https://assets.warhammer-community.com/eng_14-10_wh40k_printed_product_updates_space_marines_updates-91hillwcff-wzs8qnozam.pdf

This official page directly supports **five** errata comparisons, not the entire 87-unit paid Codex:
1. **Captain Titus** — Righteous Fury Fight-phase +1 melee Strength/heal wording; remove incorrect once-per-battle limitation.
2. **Iron Father Feirros** — Lone Operative applies **only to his model** while within 3 inches of a friendly Adeptus Astartes Vehicle (not to all attached units).
3. **Kayvaan Shrike** — add CHARACTER and EPIC HERO keywords.
4. **Librarian in Terminator Armour** — add CHARACTER keyword.
5. **Techmarine** — Lone Operative applies to **this model**, not all attached units, within 3 inches of a friendly Adeptus Astartes Vehicle.

The GW official September 2026 previews confirm the **three Combat Doctrines** and that Gladius / Brethren can use one additional doctrine under their conditions:
- https://www.warhammer-community.com/en-gb/articles/ifgezlgu/space-marines-rules-first-look/
- https://www.warhammer-community.com/en-gb/articles/zcobdkzh/your-first-look-at-15-new-space-marine-detachments/

The **full October Codex is a paid publication and was not fully accessible to compare page by page**. Current GW MFM rows, full datasheet profiles, 52 Stratagem printed descriptions, complete supplementary chapters and October Codex errata other than the above remain **not certified**.

## Secondary 11th-edition reference comparisons (not first-party certification)
- https://wahapedia.ru/wh40k11ed/factions/space-marines/
- https://tactical40k.com/codex/space-marines

The current 16-detachment reference includes **52 Stratagem entries**: Gladius (six), Deathwatch Support (four), and 14 other detachments (three each). Each record includes name, summarized purpose, CP, turn, phase, eligible unit category and source review flag. The app does **not** assert every printed trigger, line of sight, model-by-model interaction, target eligibility or range. **User must confirm the actual printed timing and target on the table before recording use.**

**Why source confidence matters:** secondary references can lag behind official updates. Do not silently transfer point or combat changes from old editions. No MFM unit points are changed here.

## Changes in this PR
- Add `SPACE_MARINES_STRATAGEM_CATALOG` as a detachment-linked, 52-entry indexed reference. Current labels remain secondary-reviewed, not official certified.
- Offer phase-relevant Stratagem cards in the iPad live phase and Rules dialog. For a selected eligible unit, present a large confirmation control before using; record CP spend through existing ledger and a named `space_marines.stratagem_used` battle-history event. Enforce actual CP, once-per-phase Stratagem use, once-per-unit-per-phase, selected detachment and modeled turn/phase.
- Combat Doctrines: Assault permits a unit to charge after advancing; Devastator gives ranged weapons Assault; Tactical permits shoot/charge after Falling Back. At Command, Army player selects and records one per phase and normally each one once per battle, subject to Gladius and Brethren exceptions. Captain with verified `Strategic Acumen` can select a unit-specific doctrine independently; `Adaptive Strategy` Stratagem spends CP and records its unit's choice. Guilliman has all three as recorded by his reviewed reference.
- Doctrine decisions are historical events `space_marines.doctrine_selected`; active doctrinal status displayed by selected unit. The active state ends at the **next own Command phase**; enemy turn between own turns keeps effect. No dice or CP automatically granted for a doctrine choice. Devastator weapon `assault` flag is applied only if recorded as active.
- Direct-GW v1.1 errata updates described above, and explicit provenance audit constant.

## Deliberately unautomated
- Additional Phobos/Gravis detachment modifiers and per-weapon full Stratagem effects whose precise triggers/conditions are not independently compared against Codex.
- Strike profiles from an unknown or currently unavailable full Codex.
- Automatically rolling CP, fighting, healing, wound allocation, FNP or deciding target legality.
- Treating a model-only Lone Operative / Invulnerable Save bonus as protection for the entire attached bodyguard.
- Automatically selecting a Combat Doctrine each turn or spending a Stratagem when the user only opens a reference card.

## Remaining official certification
1. Obtain a permitted full current October Codex text or official Warhammer 40,000 app export for direct 87-datasheet comparison (units, stats, weapons, rules, leader attachments).
2. Reconcile all 16 detachment full rules and 52 Stratagem exact text, CP, targets, timing and special exclusions against the full official publication and FAQs.
3. Directly inspect the latest GW live October Munitorum points for all 87 units, sizes, upgrades and factions.
4. Perform iPad live full phase tests, especially charge after Advance, weapon Assault after Advance, tactical Fall Back, current doctrine status, CP and source labels.
5. Retain source-warning status for all unverified rows; never claim 87/87 current official certification from independent wargear coverage.
