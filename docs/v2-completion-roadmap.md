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
   - 14 photographed Primary card front-side scoring tiers recovered and cross-checked; remaining Primary card reverse sides and missing images still await source review.

5. **Combat and Tactical Advisor validation**
   - Validate expected-vs-actual damage, split fire, focus fire, range filtering, charge distance/rerolls, fight-back estimates, Fights First, engaged Vehicle/Monster shooting, Battle-shock/OC effects, and opponent-turn history.

6. **Persistence and recovery stress testing**
   - Test rule-reference links, app switching, Safari reloads, connection loss, saved battles, crash/reload recovery, and saved-army restoration at multiple game checkpoints.

7. **Game Review / endgame analysis**
   - Complete objective-control history, positioning history, losses, expected-vs-actual attacks, missed scoring opportunities, CP/resource use, and Tactical Advisor forecast review.

## Deferred verification reminder

- **Physical Secondary Mission card review — ON HOLD.** Retain [issue #502](https://github.com/Grumpa916/40k-tactics/issues/502) until the user has the Chapter Approved 2026–27 cards available. Code-level 18-card manual scoring audit completed in merged PR #501; printed-card/FAQ comparison must not block subsequent development.

## Current priority

Work through the roadmap in order unless a live-game blocker changes priority. Item 1, the full-game verification pass, is the active workstream.