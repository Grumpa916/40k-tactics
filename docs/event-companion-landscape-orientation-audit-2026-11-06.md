# Event Companion landscape orientation audit — 2026-11-06

## Scope and official reference

Checked the **orientation** of all 45 terrain/battlefield layouts on pages **9–53** of the official Games Workshop Warhammer 40,000 Event Companion v1.2 PDF (`eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf`). This is not a new vector terrain extraction or independent certification of every printed terrain dimension.

The source PDF presents 44″ × 60″ portrait tables; our planning/deployment/live map presents a 60″ × 44″ landscape table. The intended consistent visual comparison is a **90° clockwise** rotation of the source page. The verified historical V1 catalog was drawn into V2 with mixed clockwise/counter-clockwise handedness. The mismatch was reported from live play on pages 21 and 22, followed by the user's iPad screenshot after PR #555.

## Results

**30 layouts require a left-to-right reflection of their existing digital landscape geometry:**

9, 11, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 27, 28, 30, 32, 34, 35, 36, 37, 39, 41, 43, 44, 46, 47, 48, 49, 52, 53.

**15 already have the matching landscape handedness and are unchanged:**

10, 12, 15, 19, 23, 26, 29, 31, 33, 38, 40, 42, 45, 50, 51.

The affected layouts are exactly the ones whose stored defender (red) deployment is on the **left** after the original landscape conversion; the red-top layouts already match the official clockwise conversion. This page-scoped distinction is checked against the catalog's geometry in automated tests.

## Implementation and preservation

- The archived 45-layout source catalog is **not edited**. The resolver mirrors only audited pages, with a cached, non-mutating geometry view.
- Reflect every x coordinate using `x' = 60 - x` for polygons/points and `x' = 60 - x - width` for rectangles. Retain y, dimensions and terrain/objective names and IDs.
- Both pre-game map and interactive play maps use the **same resolved** geometry. This also corrects map-based Tactical Advisor contexts and attacker/defender territories.
- Build printed terrain-placement guide geometry against the **original** source frame. Reflect its output x coordinates, reverse left/right edge directions and preserve every printed source dimension and terrain association. The official source remains authoritative.
- Page 22's six-objective naming fix from PR #555 remains in place; the horizontal reflection changes the left-to-right numbering of the two central markers without making a duplicate.
- Existing saves keep their recorded units and positions unchanged by this patch. When resuming a game created before this orientation correction, **visually recheck and adjust map placements and objectives** before relying on position-dependent Advisor recommendations. Do not assume previously placed models automatically migrated.

## Verification

Automated tests audit all 45 pages, the 30/15 orientation division, the immutable source catalog, pages 21/22 six objective markers and 16 terrain footprints, zone/territory reflection, and preservation of printed terrain placement values and anchor-to-terrain associations. Movement/territory fixtures were updated by reflecting their position inputs; their gameplay expectations remain unchanged. **An actual iPad screenshot comparison after deployment remains required** before marking the reported live-event visual issue closed.
