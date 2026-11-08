# V2 Completion Roadmap

This roadmap captures the seven remaining workstreams agreed after the primary-strategy work reached broad mission coverage.

1. **Full iPad end-to-end game verification**
   - Run a scripted five-round game from army selection through final review.
   - Exercise setup, deployment/reserves, every phase, opponent-turn recording, scoring, Battle-shock, actions, secondary discard/redraw, VP/CP corrections, persistence, and game review.
   - Treat this as acceptance testing; fix blockers/regressions before adding new major systems.

2. **Finish the Secondary Mission intelligence layer**
   - Audit all 18 Chapter Approved 2026–27 secondary cards for scoring windows, alternative scoring tiers, action handling, map/objective evidence, Tactical Advisor guidance, opponent-turn timing, and regression coverage.

3. **Official rules-data verification**
   - **Publication/source-index pass completed 2026-11-03:** versions and catalog provenance are explicitly tracked; see [audit](official-rules-source-audit-2026-11-03.md).
   - **Still pending, not falsely certified:** current official PDF content comparison, 25 Primary card texts, deferred 18 physical Secondary cards (issue #502), and October Space Marines faction/points data.
   - Preserve accepted terrain maps and manual scoring until a documented official rules discrepancy requires a focused correction.

4. **Army Builder and combat-data completeness audit**
   - **First coverage and conditional-pricing audit in progress:** see [2026-11-03 findings](army-builder-wargear-completeness-audit-2026-11-03.md). Preserve saved points and equipment; detect known invalid unit-copy pricing and report unresolved source coverage.
   - Follow-on: **Space Marines official MFM/Codex vs exported points and missing wargear**, then Custodes and Tyranids datasheet/points/wargear/Leader reconciliation. Include enhancements, invulnerable saves/FNP, and detachment data.
   - Primary source pass 2026-11-04: all 25 mission pairings and VP sets independently corroborated; 14 physical scoring faces and all 11 printed mission-Action faces inspected, official Event Companion v1.2 FAQ clarifications added. Eleven scoring faces remain absent from user photos, so complete official-card certification is still pending; see [dated audit](primary-missions-source-audit-2026-11-04.md).

5. **Combat and Tactical Advisor validation**
   - Validate expected-vs-actual damage, split fire, focus fire, range filtering, charge distance/rerolls, fight-back estimates, Fights First, engaged Vehicle/Monster shooting, Battle-shock/OC effects, and opponent-turn history.

6. **Persistence and recovery stress testing**
   - Test rule-reference links, app switching, Safari reloads, connection loss, saved battles, crash/reload recovery, and saved-army restoration at multiple game checkpoints.

7. **Game Review / endgame analysis**
   - Complete objective-control history, positioning history, losses, expected-vs-actual attacks, missed scoring opportunities, CP/resource use, and Tactical Advisor forecast review.

## Physical Secondary card verification (2026-11-08)

- **All 18 Chapter Approved 2026–27 Secondary Mission printed rule/scoring faces directly checked against user photos.** Batch 1 (#560) corrected Fixed Bring It Down; Batch 2 (#562) corrected Fixed A Grievous Blow; Batch 3 records six matching cards (see `secondary-physical-card-audit-batch3-2026-11-08.md`). [Issue #502](https://github.com/Grumpa916/40k-tactics/issues/502) tracks closure after the final audit PR merges. A new official FAQ/errata check remains separate; manual VP confirmation remains authoritative.

## Current priority

Work through the roadmap in order unless a live-game blocker changes priority. Item 1, the full-game verification pass, is the active workstream.