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
   - **v1.3 terrain and five-round reminder follow-up (2026-11-08):** an independent v1.3 reading reports `Layouts updated: None`, supporting retention of all 45 v1.2 maps without a geometry rewrite. Direct v1.3 PDF visual comparison remains **pending** due to download-size/access limitations. Added synthetic five-round manual Primary checkpoint regression across all 25 disposition pairs and both players; **live iPad Safari acceptance is still pending**. See [dated layout/reminder audit](event-companion-v13-layout-and-reminders-2026-11-08.md).
   - **GW mission FAQ/errata cross-check added 2026-11-08:** the GW Event Companion now has a published **v1.3** (October), whose displayed Chapter Approved FAQ list was compared against previously inspected v1.2 and existing mission references. World Championships November 2026 clarifications are **event-only**, not general app rules; see [dated FAQ review](gw-mission-faq-errata-audit-2026-11-08.md). **Still pending:** direct full v1.3 PDF inspection including layout changes, comprehensive latest Core/Faction FAQ and errata review, full current official source certification, and October Space Marines faction/points. The 25/25 Primary scoring faces, 11 Action faces, and 18/18 Secondary physical cards are documented.
   - Preserve accepted terrain maps and manual scoring until a documented official rules discrepancy requires a focused correction.

4. **Army Builder and combat-data completeness audit**
   - **First coverage and conditional-pricing audit in progress:** see [2026-11-03 findings](army-builder-wargear-completeness-audit-2026-11-03.md). Preserve saved points and equipment; detect known invalid unit-copy pricing and report unresolved source coverage.
   - Follow-on: **Space Marines official MFM/Codex vs exported points and missing wargear**, then Custodes and Tyranids datasheet/points/wargear/Leader reconciliation. Include enhancements, invulnerable saves/FNP, and detachment data.
   - Primary source pass 2026-11-04: all 25 pairings/VP sets independently corroborated and 14 physical scoring faces reviewed; November 8 batches added eleven further scoring photographs, completing direct scoring-face coverage at **25/25**. All 11 printed mission-Action faces were previously inspected; official Event Companion v1.2 FAQ clarifications added. All 25 scoring faces and 11 Action faces have now been directly photographed; current official FAQ/errata revalidation and full-card certification remain separate. See [November 8 final batch](primary-physical-scoring-final-2026-11-08.md), [batch 1](primary-physical-scoring-batch1-2026-11-08.md), [batch 2](primary-physical-scoring-batch2-2026-11-08.md), and [November 4 baseline](primary-missions-source-audit-2026-11-04.md).

5. **Combat and Tactical Advisor validation**
   - Validate expected-vs-actual damage, split fire, focus fire, range filtering, charge distance/rerolls, fight-back estimates, Fights First, engaged Vehicle/Monster shooting, Battle-shock/OC effects, and opponent-turn history.

6. **Persistence and recovery stress testing**
   - Test rule-reference links, app switching, Safari reloads, connection loss, saved battles, crash/reload recovery, and saved-army restoration at multiple game checkpoints.

7. **Game Review / endgame analysis**
   - Complete objective-control history, positioning history, losses, expected-vs-actual attacks, missed scoring opportunities, CP/resource use, and Tactical Advisor forecast review.

## Physical Secondary card verification (2026-11-08)

- **All 18 Chapter Approved 2026–27 Secondary Mission printed rule/scoring faces directly checked against user photos.** Batch 1 (#560) corrected Fixed Bring It Down; Batch 2 (#562) corrected Fixed A Grievous Blow; Batch 3 (#563, merged) records six matching cards (see `secondary-physical-card-audit-batch3-2026-11-08.md`). [Issue #502](https://github.com/Grumpa916/40k-tactics/issues/502) is closed as completed. A new official FAQ/errata check remains separate; manual VP confirmation remains authoritative.

## Session log — 2026-11-22/23 (post-battle vs Jared1221)

Live-game feedback from the November 22 match (Custodes vs Space Marines, Inescapable Dominion vs Secure Asset, 27–47). All items below are scoped for 40k-tactics (not ono40k). GitLab references removed from repo text.

### Done

- **Opponent list import (PR #678, merged 2026-11-23):** unmatched unit headers become labeled manual entries instead of being dropped; Deathwatch allies stay faction-tagged and do not merge with Space Marine datasheets; content-signature dedupe (hash includes faction tag, model count, wargear); one-pass catalog validation at import with explicit refresh button; 1,628 tests passing. Net +836/−83 lines across 18 files.
- **GitLab CI file and October leftover patch/zip files:** removed in six commits on main. GitLab mentions scrubbed from three docs.
- **Custodes stat-card audit:** all 36 units match Wahapedia 11th-edition stats; card layout issues identified (placeholder strength field, missing invulnerable save) for the build.

### Scoped, not started (build order recommended by Forge)

1. Reserves + embarked placement regression — cause is commit `7624dd5`; fix is a fallback "confirm at the table" profile for transports outside the Space Marine list.
2. Fight phase recheck — seven mismatches: pick order (app allowed double-picks), no Consolidate step, Pile In uses 10th-edition movement, Heroic Intervention and Counteroffensive absent, Overrun only triggers on chargers. Planned order: pick order, Pile In, Consolidate, stratagems, small fixes. **In PR:** alternating pick order, Fights First first, non-active player starts. Pile In, Consolidate, Heroic Intervention, and Counteroffensive remain.
3. Magna Imperator + Trajann aura — new "unit selected to attack" event separate from Trajann's 6-inch re-roll-ones aura; fixes missing opponent-turn reminder and makes re-rolls hit damage math. Open question: does Anathema Psykana carry the Adeptus Custodes keyword? **In PR:** Magna Imperator applies when a keyword-eligible unit is selected to attack; the Captain-General re-roll applies only within 6″.
4. Embarked Impulsor fire points — Firing Deck 7, Assault-only after Advancing; open question: who takes the Hazardous roll.
5. Map labels — attached characters (`TE2+MC` style) and upgrade-bearing Dreadnoughts (Telemann vs Contemptor Gladius). **In PR:** formation markers list each attached character, and dreadnought markers use datasheet designators plus saved Moritoi upgrade tags.
6. Layout C objective labels — nearest-home-objective labeling disagrees with territory rules on 16 of 75 layouts. **In PR:** unambiguous expansions follow the territory line, including Take and Hold vs Priority Assets Layout C.
7. Overwatch — 1 CP step at end of opponent's Movement phase; records usage only since CP moves to Warmind.
8. Full-screen map UI — part 1: layout, thin icon rails, saved panel state; part 2: remove scoring screens after Warmind role is settled. Confirmed 2026-11-23: Command Points move to Warmind as a read-only rail value, folded into part 1. Not built in the scoring-flag change.
9. Stat card build — fixed stat row, per-faction chips, filtered map key, long-press/info-icon trigger.
10. Compact datasheet form for manual units — Toughness, Save, Wounds, short weapon row (range, attacks, skill, strength, AP, damage); base size and keywords next.

### Blocked or awaiting input

- **Warmind battle-report importer:** scoped ~600–850 lines. Needs the four full-report screenshots plus iPad Live Text pastes to verify struck-through undone lines and the 40-vs-27–47 score discrepancy. Text-paste first; Tesseract.js screenshot OCR optional.
- **Manual secondary scoring:** confirmed 2026-11-23. Live score entry is hidden behind `MANUAL_SCORING_ENABLED` (`src/config/feature-flags.js`, default false). Scoring rules and saved history stay. Endgame review no longer expects local scoring; scores come from Warmind. Old saved entries remain readable.
- **Deathwatch allies:** no Deathwatch datasheets or points in the catalog or its source pipeline. Imported `Faction: Deathwatch` units under ALLIED UNITS, and unmatched Deathwatch-tagged units, are allied units and cannot be the Warlord. Points cap and detachment cost are not in a repo source, so they are not enforced. A matched Space Marine chapter tag outside ALLIED UNITS stays a Space Marine unit.

### Owner decisions — 2026-11-23 (placement and Firing Deck)

- **Reserves and embarked:** a unit that is both embarked and in reserves, or that fails both placement checks, shows `Confirm that unit [Unit Name] is embarked in vehicle [Vehicle Name] and in reserves.`
- **Firing Deck Hazardous:** the embarked unit that fires takes the Hazardous test and the resulting damage. The transport does not. Impulsor uses the existing reviewed Firing Deck 7 note.
- **Warmind endpoint:** left untouched. No API client, stub, or guessed response shape.

### Open questions

- Anathema Psykana keyword (item 3). Decided 2026-11-23: Anathema Psykana units do not have the ADEPTUS CUSTODES keyword. Magna Imperator and other keyword-gated Custodes rules use the unit's datasheet keywords. Their own rules and legality in a Custodes army stay.
- Hazardous roll owner for Firing Deck weapons (item 4).
- Exact error text for the "both fail" reserves/embarked case (item 1).
- Game review screen still shows CP and End game confirmation — needs Warmind value once CP moves.

## Current priority

Work through the roadmap in order unless a live-game blocker changes priority. Item 1, the full-game verification pass, is the active workstream. Post-battle fixes from 2026-11-22 are queued behind it per the session log above.
