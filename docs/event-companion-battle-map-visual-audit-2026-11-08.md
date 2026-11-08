# Event Companion battlefield map verification — November 8, 2026

## Scope and approved constraints

This is a **verification-only** continuation of the already approved V2 battlefield map design. No scenery-detail/terrain-piece overlay was added; that enhancement is explicitly on hold. No deployed map terrain, objective coordinates, map rotation, labels, game logic, or Tactical Advisor scoring inputs were changed.

Ground truth for direct images: user-owned **official Games Workshop Warhammer Event Companion v1.2 PDF**, 93 pages, including printed **pages 21, 22 and 23**, which have the highest history of mirroring, divider, and label regressions.

The newer **v1.3 October 2026** official publication has a verified URL, and an independent reader reports **“Layouts updated: None”**. The full official v1.3 PDF was **not** directly retrieved for a page-by-page comparison due to download/retrieval restrictions. Therefore current maps are verified against v1.2, not falsely promoted as visually certified v1.3:
- GW v1.3: https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf
- Independent change-log report: https://40-carrot.app/guides/40k-terrain-layouts/

## Independent work actually completed

1. Loaded the 45-layout V2 catalog and inspected **all 45** geometry records. Each contains **16 terrain polygons**. Checked all 720 terrain polygons for off-board coordinates, degenerate area, and self-intersecting non-adjacent segments. **No structural defects found.** Checked objective coordinates for off-board and duplicate points, and verified pages 9–53 are accounted for without gaps.
2. Rendered the **actual official v1.2 PDF images** for printed pages **21, 22 and 23** from the user's uploaded 93-page reference. These maps correspond to **Take and Hold / Inescapable Dominion versus Priority Assets / Secure Asset**, Layouts A, B, C.
3. Independently projected **all 18 stored objective source coordinates** onto the printed maps, transforming the 60×44 landscape coordinate system to the portrait PDF board:
   `pdfXNorm = (44 - sourceY) / 44`, `pdfYNorm = sourceX / 60`. The crosses aligned with the actual printed icons for **all six** objectives on **each** of pages 21–23: Defender Home, Attacker Home, Central 1, Central 2, Expansion 1, Expansion 2.
4. Inspected existing test protections:
   - `tests/rules/event-companion-landscape-orientation.test.js`: all 45 PDF-aligned deployment centroids and Y mirror (not X).
   - `tests/ui/event-companion-visible-halfway-orientation.test.js`: actual planning/deployment/live rendering, including pages 21–23.
   - `tests/rules/territory-midline-deployment-geometry.test.js`: a single diagonal/vertical/horizontal boundary as appropriate, with p21 diagonal, p22 vertical and p23 horizontal.
   - `tests/rules/objective-display-labels.test.js`: distinct and perspective-correct mH/oH/mE/oE/C1/C2 roles on every layout; specifically protects the formerly mismatched p22 Central/Expansion names.
5. Added an independent regression file `tests/rules/event-companion-physical-map-integrity-20261108.test.js` that locks the polygon validity and all 18 directly viewed objective landmarks.

## Findings and decisions

- **Geometry check:** 45/45 map records present; 16 terrain footprints each; **no** structural defects detected.
- **High-risk PDF visual check:** pages 21, 22, 23: **18/18 objective centers aligned** with the official v1.2 printed symbols under the correct PDF-to-app orientation.
- **Deployment/territory check:** independent existing tests validate 45 maps in each of the three view modes, with specific p21 diagonal, p22 vertical and p23 horizontal divider checks.
- **Objective labels:** existing tests check unique correct labels for both players, including the p22 dual-center / swapped source identifier exception.
- **No map geometry correction recommended** from this audit; preserve previously approved geometry and interaction behavior.
- **Limitations:** visual manual overlay was performed for **three** historical trouble layouts, **not** 45 direct PDF image-by-image comparisons. All 45 have structural checks and previously collected reference-centroid tests. Actual live Safari zoom/drag and visual marker stacking still require the user's iPad verification. No v1.3 direct page comparison, no claim of perfect terrain-detail reconstruction.

## Release gate

This PR must pass existing GitHub Actions CI, in addition to the new checks. Do not merge without user approval. If a future actual PDF/iPad comparison exposes a specific mismatch, log its exact page and coordinate/label and apply the **smallest focused repair** on a separate PR. Never overhaul all layouts based on a single outlier.
