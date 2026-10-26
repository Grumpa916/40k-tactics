# Adeptus Custodes Tactical Advisor — Phase One

Implemented against the current October 2026 Adeptus Custodes rules-data revision.

## Modeled rules

1. Per-unit Martial Ka'tah readiness and manual expenditure tracking.
2. Phase-aware Ka'tah recommendations without silently spending readiness.
3. Rendax Lethal Hits expected-damage comparison against Monster/Vehicle targets.
4. Guardians of the Throne Martial Mastery comparison between Sustained Hits 1 and Lethal Hits.
5. Dread Host Charge re-roll probability in measured and approximate Charge advice.
6. Emissaries Imperatus Fights First in the authoritative Fight candidate order.
7. Conservai, Solar Watch favoured Calistus and Aquilan Shield favoured Salvus opportunities in mission, movement and shooting advice.

## Automation boundary

- Martial Ka'tah use remains player-confirmed and is stored as typed history.
- Optional Ka'tah damage improvements are compared and recommended but are never silently applied as spent resources.
- Approximate map distance remains advisory and preserves the existing uncertainty band.
- Rules requiring exact geometry or unsupported roll re-roll semantics remain reference/advisory until a dedicated implementation exists.

## Verification

GitHub Actions run `40271864206` completed successfully:

- `npm run verify` passed.
- 455 tests passed, 0 failed.
- Static Cloudflare Pages bundle built successfully.
