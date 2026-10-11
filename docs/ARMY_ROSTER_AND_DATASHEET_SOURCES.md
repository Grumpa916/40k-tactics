# Army Roster Library and Datasheet Source Policy

## Reusable roster library

A saved roster is an independently named, reusable army list. It is not a battle save.

Each roster has a stable roster ID, name, faction, optional battle-size/points-limit and detachment metadata, units, notes, and created/updated timestamps. Users should be able to create, rename, duplicate, edit, and delete rosters, then select one for either player when setting up a battle.

When a roster is assigned to a battle, the battle receives an independent roster snapshot. Later changes to the reusable roster must not silently alter an existing battle's recorded roster. A battle save contains the snapshot plus the battle's units, actual and planned positions, objectives, score ledgers, and event history.

## Datasheet source policy

40k.app (https://www.40k.app/) is a useful **secondary reference and data-discovery source**, not a canonical authority for the application. It offers faction/unit references, datasheets, army lists, and rules pages. It may be used to locate candidate updates or compare unit data, but it must not silently overwrite the app's maintained data or become the sole source of truth.

For imported or manually reviewed datasheet facts, retain provenance where practical:
- unit/datasheet identifier and faction;
- source name and exact URL;
- retrieval or review date;
- version/edition or update context when known;
- verification state (unreviewed, cross-checked, accepted, superseded);
- reviewer notes for unresolved differences.

A source being newer does not by itself prove that every field is correct or applicable to the intended rules version. Where possible, cross-check important rules and points against Games Workshop's official Warhammer 40,000 app, official publications, and official FAQ/errata/balance updates. If authoritative sources are unavailable or differ, preserve the conflict for review rather than guessing.

Do not infer unit identity, wargear, points, or rules from array order, map coordinates, or similar-looking names. Never erase provenance when correcting data.

## Scope of this foundation

The roster data model is intentionally independent of any specific external datasheet provider. The initial library foundation does not implement scraping, automatic synchronization, or claim 40k.app data is authoritative. Datasheet ingestion and validation will be a separate, reviewable step.
