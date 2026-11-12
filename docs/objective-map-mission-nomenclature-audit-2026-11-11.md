# Map / mission objective nomenclature audit (2026-11-11)

## One source of truth

Event Companion terrain/objective **IDs and coordinates are authoritative** and are never renumbered when displayed. The landscape-oriented geometry may make a source \`Central 2\` actually be the on-screen \`My Expansion\`. Therefore **never display raw \`objective.name\` or \`layoutObjective\` as a mission selection label**.

| Role | Top-down map | Standard map marker | Mission picker and saved display |
|---|---|---|---|
| Friendly home | My Home | mH | My Home (mH) |
| Opponent home | Opponent Home | oH | Opponent Home (oH) |
| Centre 1 | Center 1 | C1 | Center 1 (C1) |
| Centre 2 | Center 2 | C2 | Center 2 (C2) |
| Friendly expansion | My Expansion | mE | My Expansion (mE) |
| Opponent expansion | Opponent Expansion | oE | Opponent Expansion (oE) |

Both map styles use \`renderBattlefieldMap\` and preserve identical \`data-map-objective-id\`, positions and \`data-layout-objective\`. The map-style toggle changes presentation only: the standard view abbreviates the complete geometry/perspective label using \`mapObjectiveMarkerLabel\`; the top-down view shows the complete label.

The shared helpers in \`src/rules/objective-display-labels.js\` are:

- \`objectiveMapDisplayName(state,id,perspectivePlayerId)\` — full map label.
- \`mapObjectiveMarkerLabel(fullName)\` — compact standard-map marker.
- \`objectivePickerLabel(state,id,perspectivePlayerId)\` — both labels, used wherever an objective can be chosen or a stored choice reviewed.

## Mission UI surfaces audited

- **Secondary choices**: A Tempting Target (opponent-designated target); Burden of Trust (assigned guarded objectives). Command selectors, locked choices, persistent mission summary, Movement intelligence, turn checkpoint evidence, and recent battle-event descriptions use the same full+compact labels.
- **Secondary intelligence**: Forward Position checks *actual expansion geometry* rather than an unrotated \`Expansion 1/2\` source string. The Tempting Target bonus continues to apply only to the stored stable objective ID. Cleanse and Secure No Man's Land use eligible non-home objective IDs.
- **Other secondary types**: Beacon stores a unit ID and uses its unit name, not an objective. Plunder and Locate and Deny operation markers use source **terrain IDs T1, T2, ...**; they are distinct from objective labels.
- **Primary Action selectors**: Smoke and Mirrors, Triangulation, Gather Intel, Secure Asset, Vital Link, Extract Relic, Sabotage, Locate and Deny and the legacy Cleanse Action selector all use the same objective name helper. Consecrate's recorded objective choices also use it.
- **Scoring / history**: Tempting Target and Burden of Trust scoring evidence and recent objective-linked battle events use the current map perspective for display.

No record migration and no scoring formula change are required. Source objective IDs are still stored and compared exactly; previously saved selections remain locked under the physical card rules. An existing wrong ID is **not silently changed** when a label is corrected.

## Automated verification

\`tests/ui/objective-nomenclature-all-views-and-missions.test.js\` exercises all **5 × 5 × 3 = 75** supported disposition/layout combinations across both viewing perspectives, verifies unique geometry-derived map labels, unchanged IDs, and full/compact pairing. It also checks saved Tempting Target and Burden of Trust choices, evidence, Forward Position ranking, and Action picker reuse. The original screenshots' Purge the Foe vs Reconnaissance layout A case is additionally covered in \`tests/ui/tempting-target-map-choice-labels.test.js\`.

**Remaining after deployment:** Visual confirmation on iPad Safari in Standard and Top-down modes with a **fresh** Tempting Target selection of Center 2 (C2), then verify Movement recommendations and manual checkpoint display. Do not rewrite the already locked historic selection from the previous test.
