# Tyranid wargear audit — 2026-10-22

This audit is generated against the 52-entry, 7,025-point Warhammer App v2.8.1 / data v995 regression fixture.

## Status model

- `rules-reviewed-valid` — imported equipment matches a reviewed Tyranid loadout rule and passes legality checks.
- `rules-invalid` — imported equipment matches reviewed rules but violates a loadout constraint.
- `source-invalid` — the Warhammer App export itself reports the unit's wargear as invalid; this remains authoritative even when local validation also finds an issue.
- `profile-matched` — equipment maps to combat profiles but this datasheet has no reviewed option rule because its weapon loadout is fixed in the current catalog.
- `unverified` — one or more imported equipment selections do not map to a known combat profile or reviewed selection.

`source-invalid` and `rules-invalid` loadouts are deliberately excluded from Shooting, Fight and Tactical Advisor weapon choices.

## Reviewed option-bearing Tyranid datasheets

The current rules layer covers every Tyranid datasheet in the local catalog that exposes weapon-option metadata:

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

## Import mapping improvements

A Warhammer App equipment selection can now map to more than one attack profile. This is required for profiles such as:

- Massive scything talons → strike and sweep
- Old One Eye's claws and talons → strike and sweep
- Warp Blast → witchfire and focused witchfire
- Psychic Tendril → neuroparasite, neuroblast and neurolance

The original export text and selection names remain preserved for review.

## Regression fixture findings

The large test roster intentionally contains source errors. Termagants and Carnifexes remain `source-invalid` and also fail the reviewed local rules for the expected reasons. Their invalid configurations are never repaired or guessed automatically.

Known valid examples in the same fixture include the reviewed Hive Tyrant, Tervigon, Tyrannofex, Hive Guard, Tyrant Guard and Tyranid Warriors with Ranged Bio-weapons loadouts.

## Next slice

The manual Army Builder should render wargear selectors from this same rule data so manually built lists and Warhammer App imports converge on one `equippedWargear` / `equippedWeapons` representation. Do not create a separate manual-only legality system.
