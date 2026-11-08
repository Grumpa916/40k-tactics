# Primary Mission physical scoring-face audit — 8 November 2026, final three

## Source evidence and coverage

The user supplied a legible photograph of the final three Chapter Approved 2026–27 Primary Mission **scoring faces**:

- `IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg`: Surveil the Foe, Locate and Deny, Triangulation.

The photograph is a conversation attachment, not copied into GitHub. The visible scoring amounts, conditions, phase/round boundaries, operation-marker rules and end-of-battle windows were individually compared to the current Primary mission catalog.

Combined with the prior original October card photographs and November 8 batches, **all 25 of 25 Primary printed scoring faces have been directly photographed and checked**. All 11 separate mission-Action faces were previously photographed and checked, including recent clearer photographs of Triangulate and Surveil the Foe Actions in PR #566.

## Final three direct comparisons

| Mission | Printed Primary scoring conditions and timing | Result |
|---|---|---|
| Surveil the Foe | At any round end of own turn, **4 VP** if at least one enemy unit was surveilled this turn, unless all such units are within range of objectives which have operation markers within range; from battle round 2 own Command (R5 own end-turn substitute), **4 VP** for holding at least one non-home objective and **4 VP** for holding more objectives than opponent; from round 2 at own end turn, **5 VP** when no opponent operation markers remain. Moving a friendly unit within range of an objective with opponent markers removes **all** those operation markers immediately when the move ends. | Printed scoring matches all 4/4/4/5 VP values and windows. The catalog setup reminder is expanded to state the full move-ended operation-marker removal rule. |
| Locate and Deny | At battle start, select five terrain areas not in own deployment zone and place one operation marker in each; if fewer than five exist, place one in each available non-deployment terrain area. Any own end turn, **4 VP** for one or more enemies destroyed after starting turn in range of objectives, and **4 VP** if exactly one friendly marker remains with a friendly unit in that terrain area and no enemy in it; from round 2 own Command (R5 own end-turn substitute), **4 VP** for holding one non-home objective; at end of battle, the same final-marker condition earns **5 VP**. | Printed scoring matches all 4/4/4/5 VP values and windows. Catalog setup reminder clarifies the fewer-than-five eligible terrain areas fallback. |
| Triangulation | From round 2 own Command (R5 own end-turn substitute), **4 VP** for holding a non-home objective; from round 2 own end turn, **3 VP** if one objective triangulated, **6 VP** if two, or **10 VP** if three or more (exclusive tiers); at end of battle, **10 VP** for holding four or more objectives. | Printed scoring exactly matches 4/3/6/10/10 VP tiers and timing; no code scoring change. |

The previous 2026-11-04 Event Companion FAQ references remain intact. This audit does not assert that post-November 8 FAQs/errata have been independently rechecked.

## Implementation and provenance safeguards

- Add a precise photo reference to all three Primary scoring-face records, bringing `PRIMARY_PHOTOGRAPHED_SCORING_FACES` from 22 entries to **25**. Action-face count remains **11**.
- Guard the printed VP tiers, timing strings, and marker conditions in regression tests; retain no false or missing references.
- Only the **reference** descriptions for Locate and Deny setup and Surveil marker removal need clarification. **No VP scoring algorithms, scoring cap, phase gating, battle saves, Action automation or tactical state tracking change.**
- Preserve `rulesVerified:false` and `officialCardVerified:false` on individual Primary records pending distinct comprehensive current-official FAQ/errata/full-card certification. The direct visual comparison is complete, but an image alone should not be mislabeled as a completed independent current-official release audit.
- Complete final physical scoring-photo verification only after PR #566 is CI green and merged into `main`.

## Related evidence

- 2026-11-04 baseline: `docs/primary-missions-source-audit-2026-11-04.md` (14 scoring / 11 Action)
- 2026-11-08 batch 1: `docs/primary-physical-scoring-batch1-2026-11-08.md` (20 scoring)
- 2026-11-08 batch 2: `docs/primary-physical-scoring-batch2-2026-11-08.md` (22 scoring)
- This final batch: **25 scoring / 11 Action**.
