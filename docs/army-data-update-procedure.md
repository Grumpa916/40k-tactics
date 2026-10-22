# Army data update procedure

This project treats army data as versioned rules data, not static content.

## Source authority

Use sources in this order:

1. Games Workshop / Warhammer Community Warhammer 40,000 Downloads page.
2. Current Munitorum Field Manual for points, unit-size costs, Leader attachments, Detachment Points and Force Dispositions.
3. Current faction pack for faction FAQs, errata, additional datasheets, detachments and rules updates.
4. Current Balance Dataslate and Rules Commentary for game-wide changes that alter a faction or weapon interaction.
5. Current Warhammer 40,000 App for the integrated current datasheet/loadout presentation.
6. 40k.app only as a secondary Warhammer-App-derived reference when current Codex datasheet/loadout text is not available in a public official download. Any such record must retain its source URL and review date.

Community list-building sites are not authoritative for rules or points.

## Update cycle

Run this procedure whenever Games Workshop publishes a balance update, Munitorum Field Manual update, faction-pack update, Codex errata/FAQ update, or new edition data affecting supported armies.

1. Record the official document/app version and publication/update date.
2. Identify changed factions, datasheets, points values, Leader/Bodyguard links, detachments, wargear options, weapon profiles and rules text.
3. Update only the affected catalog/rules records. Preserve source URLs and update `reviewedAt` metadata.
4. Re-run wargear legality validation against the large regression roster and other real Warhammer App export fixtures.
5. Re-run combat-profile tests so selected equipment still produces the expected Shooting/Fight weapon options and Tactical Advisor inputs.
6. Re-run the full project verification suite and build.
7. Merge only with green CI, then verify `main` CI and Pages deployment.
8. Perform targeted iPad verification for any changed Army Builder or live-play UI.

## Saved roster behavior

- Never silently replace a user's selected wargear because a source update changed the datasheet.
- Preserve the saved selection and source metadata.
- Revalidate the saved selection against the new reviewed rules.
- If the selection is no longer legal or a profile cannot be matched, mark it unresolved/review-required and prevent it from feeding authoritative combat advice until reviewed.
- Point changes may update the catalog/reference cost, but a saved roster should surface the discrepancy for review rather than silently altering the user's list during a battle.

## Manual verification required from the user

The user should not need to verify every unit or every data field.

Manual checks are limited to:

- units explicitly flagged `source-invalid`, `rules-invalid`, `unverified`, or `manual-selection-required`;
- units whose datasheet/wargear changed in a new Games Workshop release;
- a small spot-check of the user's actual current army after a major rules update;
- iPad visual confirmation when Army Builder or live-play controls change.

For a normal unchanged unit with reviewed source metadata and passing regression tests, no separate manual re-entry or line-by-line verification is required.

## Recommended spot-check after a rules update

For one changed unit, compare:

- unit/model count and points;
- selected wargear and legal quantities;
- ranged/melee weapon profile names;
- key characteristics used by combat math;
- any changed ability that affects hit, wound, save, attacks or damage;
- Leader/Bodyguard eligibility when applicable.

This is an acceptance check, not a second data-entry process.
