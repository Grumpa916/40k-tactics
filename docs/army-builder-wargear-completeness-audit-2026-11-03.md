# Army Builder and wargear completeness audit — 2026-11-03

## Scope and evidence

This is the **first non-destructive validation pass**, not a declaration that every current Codex and MFM profile has been fully verified. The app's Army Builder draws from a mixed catalog of imported Warhammer App entries, reviewed Custodes/Tyranids selectable loadouts, and reference-projected Space Marines datasheets. Official source comparison must precede changes to user-selected equipment, points, or abilities.

Official points and rules update index: https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/

## Confirmed source facts and gaps

| Faction | Current evidence | Remaining verification |
|---|---|---|
| Adeptus Custodes | 2026-10-23 Codex-based local catalog, October 14 MFM source reference, reviewed subset of selected wargear and Leader/Bodyguard options | Compare all model-count/conditional point prices, every weapon and loadout, Legends eligibility, abilities, attached leaders and detachments with current official Codex/MFM |
| Tyranids | October 2026 faction pack revision, reviewed selectable wargear subset, catalog and large Warhammer App import regression fixture | Complete missing loadout choice coverage; cross-check each profile, unit size, points, Leader links and enhancements against current official source |
| Space Marines | Warhammer App export supplied unit names, **only one points option at default size for each listed entry**, supplemented by community-reference combat profiles and a few reviewed datasheets | **Highest source gap:** official October MFM unit-size/ordinal costs, selectable weapon rules, current Codex profiles, detachment stratagems, Leader compatibility; no reviewed selectable wargear set |

**Do not treat the presence of a weapon profile as proof that the imported unit's actual wargear was selected correctly.** Do not silently substitute a weapon profile or update saved points.

## Changes implemented

- `auditArmyCatalogCompleteness(faction)` reports number of catalog units, profiles, weapons, point options, reviewed selectable wargear and pending source checks, with a list of units missing core combat data.
- `assessSavedUnitCost` validates saved cost against the correct known model-count, **copy order and wargear-dependent price**, not merely any listed option. For example, the local Telemon catalog distinguishes the first copy from the second and later copies. Ambiguous choices remain **unverified**, not invented.
- Roster revalidation records missing/incorrect points as issues; source-coverage warnings are informative and never rewrite saved roster equipment, points, or names.
- Regression tests exercise first/second copy prices, ambiguous Shield-Captain equipment-dependent prices, missing points and Space Marines' official comparison status.

## Previously supplied Primary Mission photos

Original Library uploads dated October 10, 2026:
- `IMG_0178.jpeg`: Meatgrinder, Search and Scour, Immovable Object, Unstoppable Force, Delaying Action, Outmanoeuvre, Consecrate and Punishment (card faces).
- `IMG_0179.jpeg`: Sabotage, Extract Relic, Vital Link, Destroyer's Wrath, Gather Intel and Vanguard Operation (card faces; some additional card backs).
- `IMG_0182.jpeg` / `IMG_0183.jpeg`: closeups of Sabotage/Punishment and Extract Relic/Vital Link.
- `IMG_0180.jpeg`, `IMG_0181.jpeg`, `IMG_0188.jpeg`, `IMG_0189.jpeg`, `IMG_0190.jpeg`, `IMG_0191.jpeg`: legible Action-side photos, including Triangulate, Decoy, Surveil the Foe, Sensor Sweep, Booby Trap, Secure Asset, Sabotage, Maintain Control, Extract Intelligence and Vanguard Operation. Use these for subsequent precise Action-timing/rules cross-checks rather than re-requesting uploads.

Fourteen photographed **front-side VP tier sequences** have been compared to `PRIMARY_MISSION_MATRIX` in an explicit regression test. This is stronger evidence than the previous community-only references for those tiers, but **not certification of all reverse-side Action rules, all 25 printed mission cards or errata**. The source records remain conservatively labeled.

## Games Workshop Event Companion

The user's previously uploaded `eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf` is an **authentic official GW Warhammer Event Companion, version 1.2**. Its pages 1 and 2 directly establish the mission sequence, battle dimensions, Fixed/Tactical procedures, scoring limits and battle-end procedure; pages 8 and 9 establish the layout legend and sample terrain setup. The official GW publication has authoritative status, as requested; this does not imply that all 93 pages or every code path have been rechecked in this pass. Previously user-approved terrain geometry is preserved.

## Follow-up audit phases

1. Fetch authoritative current MFM and Space Marines Codex data by specific unit/cost profile; reconcile existing source-derived options without defaulting to obsolete export prices. Expand selectable Space Marines wargear reference and legal attachment set in a focused PR.
2. Finish Custodes and Tyranids per-datasheet checks, prioritizing units in saved 2,000-point armies and invalid/unresolved wargear. Add explicit QA fixtures for selected ranged and melee loadouts.
3. Reconcile all 25 photographed/printed Primary mission cards, including unseen reverse sides and errata, in a separate mission-data review. Physical Secondary cards remain on hold under [issue #502](https://github.com/Grumpa916/40k-tactics/issues/502).
4. Run the full five-round iPad Safari verification when available.

This pass intentionally does not change the user's current saved armies, mission score decisions, map geometry, or game rules.
