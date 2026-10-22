# Tyranid roster and wargear audit — 2026-10-22

This audit uses the 52-entry, 7,025-point Warhammer App v2.8.1 / data v995 regression fixture plus direct checks for Tyranid catalog entries not present in that roster.

## Current completion status

- The Tyranid catalog contains 57 entries.
- All 57 entries have source-reviewed datasheet characteristics, weapon arrays, ability arrays and points options.
- The 52-entry App fixture represents 51 unique Tyranid datasheets (it contains two Tyrannofex entries).
- Every fixture unit maps to a local datasheet.
- Every fixture unit's imported model count and points match a current catalog points option.
- The fixture now produces zero `unverified` loadouts.
- The only invalid loadouts remain the deliberately invalid Termagant and Carnifex configurations already reported by the Warhammer App.
- The six catalog entries outside the large fixture are regression-checked separately: Deathleaper, Malanthrope, Barbed Hierodule, Dimachaeron, Scythed Hierodule and Sky-slasher Swarms.

## Status model

- `rules-reviewed-valid` — imported equipment matches a reviewed Tyranid loadout rule and passes legality checks.
- `rules-invalid` — imported equipment matches reviewed rules but violates a loadout constraint.
- `source-invalid` — the Warhammer App export itself reports the unit's wargear as invalid; this remains authoritative even when local validation also finds an issue.
- `profile-matched` — equipment maps to combat profiles but this datasheet has no reviewed selectable-option rule because its weapon loadout is fixed in the current catalog.
- `unverified` — one or more imported equipment selections do not map to a known combat profile or reviewed selection.

`source-invalid`, `rules-invalid`, `manual-selection-required` and `unverified` loadouts are deliberately excluded from Shooting, Fight and Tactical Advisor weapon choices.

## Reviewed option-bearing Tyranid datasheets

The structured rules layer currently covers the Tyranid datasheets in the local catalog with reviewed selectable weapon/equipment choices:

- Hive Tyrant
- Winged Hive Tyrant
- Tervigon
- Tyrannofex
- Termagants
- Carnifexes
- Hive Guard
- Tyrant Guard
- Tyranid Warriors with Ranged Bio-weapons
- Ripper Swarms
- Sky-slasher Swarms (Legends)

Sky-slasher Swarms are intentionally different from Ripper Swarms: claws and teeth are fixed, while any number of Sky-slasher models may individually take Spinemaws. Ripper Swarms retain their all-models-or-none Spinemaws rule.

## Import mapping improvements

The App importer now handles mixed model-group units structurally instead of assuming one model label matches the unit name. This fixes model counts for examples including:

- Carnifexes: 2 models
- Neurogaunts: 1 Nodebeast + 10 Neurogaunts = 11 models
- Zoanthropes: 1 Neurothrope + 2 Zoanthropes = 3 models
- Hyperadapted Raveners: 1 Ravener Prime + 4 Raveners = 5 models
- both three-model Tyranid Warrior units

A Warhammer App equipment selection can map to more than one attack profile where required:

- Massive scything talons → strike and sweep
- Old One Eye's claws and talons → strike and sweep
- Warp Blast → witchfire and focused witchfire
- Psychic Tendril → neuroparasite, neuroblast and neurolance

The matcher also tolerates an unambiguous singular/plural source-name difference while retaining the canonical profile name. This covers the Warhammer App export `Genestealers claws and talons` mapping to the canonical `Genestealer claws and talons` profile without a unit-specific hard-coded alias.

The original export text and source selection names remain preserved for review.

## Regression fixture findings

The large test roster intentionally contains source errors. Termagants and Carnifexes remain `source-invalid` and also fail the reviewed local rules for the expected reasons. Their invalid configurations are never repaired or guessed automatically.

Known valid examples in the same fixture include Hive Tyrant, Tervigon, Tyrannofex, Hive Guard, Tyrant Guard, ranged Warriors and the fixed-loadout units whose exported equipment maps directly to their combat profiles.

## Manual Army Builder

The manual Army Builder already renders its selectable Tyranid wargear from the same rule data as the importer. It does not maintain a second legality system.

Selectable loadouts must be saved before combat advice becomes authoritative. The Sky-slasher rule now follows the same path, including an individual 0–3 Spinemaws quantity for a three-model unit.

## Separate combat-integration item

The roster-data audit also exposed a distinct combat-engine issue that is **not missing Tyranid roster data**: when a manually added fixed-loadout multi-model unit has no explicit `equippedWeapons`, the legacy combat fallback currently treats a datasheet weapon profile as one copy rather than automatically deriving how many models carry it.

Warhammer App imports are not affected because their exported equipment quantities populate `equippedWeapons` explicitly. Selectable manual wargear units are also explicit after saving.

This should be addressed in the combat/Tactical Advisor integration layer with model-aware default weapon quantities, including mixed-model units and unusual multi-copy weapons. It must not be solved by blindly multiplying every datasheet profile by unit model count, because units such as Hyperadapted Raveners and multi-copy monster weapons require more specific ownership data.

This item is intentionally tracked separately from Tyranid catalog completeness so the roster audit can remain truthful: the Tyranid data is present, while default-loadout combat aggregation still needs a model-aware consumer.
