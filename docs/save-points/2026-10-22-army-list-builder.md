# Army list builder

Implemented a separate Army Lists library, grouped by faction with known points subtotal and detachment. New-list flow includes name, faction, points presets/custom limit, and detachment. Existing roster schema and cloud store remain compatible.

Editor uses roster/browser columns on landscape tablets and a stacked layout below 750px. Search covers names, keywords and ability names. Category, points sort, and fits-budget filtering use existing catalog data. One-tap additions persist complete available profiles. Detail view includes editable count/points/notes, stat strip, ranged/melee profiles, expandable abilities, provenance and existing reviewed attachment controls.

Duplicate and JSON import remap IDs and attachments. Export uses existing schema version 1. Import currently accepts pasted 40K Tactics JSON only. Battle preparation continues to assign independent roster snapshots. No changes to gameplay maps or combat rules.

Missing costs remain unknown. Loadouts/enhancements use notes; no new validation for equipment or multiple detachments was introduced. Catalog/rules coverage varies. Source data and existing detachment metadata were preserved, not reverified in this UI change.

Validation: 240 tests pass; production build passes. Focused tests cover independent import IDs/attachments, filters, catalog persistence and failed saves. Visual browser test was attempted but Chromium download was unavailable; physical iPad QA remains required.
