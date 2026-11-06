# Event Companion map orientation — corrected reference audit (2026-11-06)

## Why the previous audit was wrong

The earlier PR #556 inferred **30 horizontal mirrors** from which side the red deployment occupied after a clockwise landscape conversion. That inference was invalid: it compared only deployment colors, not the official PDF's terrain and objective landmarks. PR #557 preserved that error while separately mirroring page 23 vertically. The latest screenshot reference for pages 21–23 resolves the ambiguity.

## Authoritative comparison method

Games Workshop *Warhammer 40,000 Event Companion* v1.2, printed pages **9–53** (45 layouts), was inspected as a **90° counterclockwise** conversion from the original portrait image to a 60″ × 44″ landscape map. A separate pixel-color inspection of all 45 PDF deployment diagrams established approximate red and blue deployment centroids. These independent reference centroids are in `tests/rules/event-companion-landscape-orientation.test.js`, with a 2.7″ allowance for small masks/terrain occlusion. This is a check of **orientation**, not a source of new terrain corner measurements.

The source terrain/catalog coordinates already have correct horizontal handedness. They have **reversed vertical handedness** relative to this PDF/reference presentation. The correct map-wide transform for all pages 9–53 is:

- **x′ = x**
- **y′ = 44 − y**

This replaces the incorrect 30-page X mirror and one-page Y mirror with a **consistent Y mirror across all 45 pages**. Pages 21 and 22 are not horizontally reflected.

### Verified landmarks from the supplied comparison screenshots

| Page | Defender Home (x,y) | Attacker Home (x,y) | Orientation |
|---|---|---|---|
| 21 · Layout A | (8.1, 11.1) | (51.6, 33.0) | Red lower-left, blue upper-right |
| 22 · Layout B | (10.5, 12.7) | (49.3, 32.1) | Red left, blue right |
| 23 · Layout C | (22.2, 6.3) | (37.9, 37.9) | Red bottom, blue top |

All original objective IDs, 16 terrain polygons per page and printed terrain placement dimensions are retained. Planning, deployment, terrain setup and live maps use the same resolved positions. The Tactical Advisor's territory mapping also resolves the corrected geometry.

Both neutral **30″ vertical** and **22″ horizontal** halfway guide lines remain present in planning, deployment, and live views, distinct from the current gold territory divider.

## Validation and acceptance

- Automated tests inspect the actual rendered objective-marker styles and SVG terrain/zone elements for pages 21–23, rather than relying only on coordinate values.
- Tests compare all 45 red/blue deployment centroids with the official PDF, test terrain and objective geometry, and check original printed placement labels, anchor associations, and halfway guides.
- Actual **Safari iPad visual comparison after GitHub Pages deployment** is still required.
- Old saved game positions are *not* silently transformed. Recheck placements and objective control for saved sessions created before this fix; the map is explicitly non-authoritative.
- This audit does **not** authorize adding terrain artwork or redrawing source footprints; the V2 map intentionally uses the existing minimalist polygons.
