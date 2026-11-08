# Event Companion v1.3 layout reconciliation and five-round reminder audit
**Date:** 2026-11-08

## Scope and critical verification limit

The current Games Workshop **Warhammer Event Companion v1.3** (October 2026) has been identified at the official download URL:
https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf

This review **attempted to retrieve the official v1.3 PDF**, but direct web retrieval reported the file too large (10,660,838 bytes), and alternative runtime download attempts failed. The user's Library contains **v1.2**, which is the existing vector-extracted source of the battlefield-map geometry. Consequently, **no page-by-page v1.3 image or vector diff was completed**. The app must not relabel its terrain data as a v1.3 extraction.

Independent documentation published 2 November 2026 reports that the **v1.3 PDF change log** says `Layouts updated: None`, and that the only reported October v1.3 update was a base-size guide entry:
https://40-carrot.app/guides/40k-terrain-layouts/
https://40-carrot.app/guides/40k-deployment-zones/

This corroborates, but does not formally certify through direct PDF inspection, preservation of the existing **45 v1.2 layouts** (15 Primary pairing combinations × three A/B/C layouts, pages 9–53). Do not change terrain polygon geometry, objective placement, measurement guides, attacker/defender orientations, or map territory boundaries without new direct official image evidence.

## Existing automated map protections (preserved)

- `tests/rules/event-companion-landscape-orientation.test.js`: official v1.2 geometry landmarks and all terrain measurement/mirror points across pages 9–53.
- `tests/ui/event-companion-visible-halfway-orientation.test.js`: actual HTML orientation and territory midline in **planning, deployment, and live** maps for all 45 layouts; pages 21–23 contain specific regression landmarks.
- `tests/rules/territory-midline-deployment-geometry.test.js`: diagonal midlines through centre, including pages 21 and 23, and shared territory classification.
- The visual map is an approximate field reference, not a referee for measured tabletop coordinates.

## New five-round manual scoring reminder verification

`tests/application/five-round-mission-reminder-matrix-20261108.test.js` runs a synthetic game-state matrix across:
- Five Force Dispositions per player (25 ordered combinations)
- Battle rounds 1–5
- Both players as active player
- Command → Movement and Fight → End of Turn transitions
- 250 ordered per-player turn cases, with independent Command/end-turn checkpoint assertions
- Final-round end-of-turn substitution for Command-scoring windows; only the active player's Primary is eligible on their own end-of-turn.

Tests inspect generated reminder groups and user-visible manual-scoring dialog presence. They do **not** judge objectives or automatically award victory points.

## Acceptance still requiring an actual iPad

This automated suite runs in GitHub Actions, **not Safari on the user's iPad**. Actual iPad acceptance still requires: load `https://grumpa916.github.io/40k-tactics/battle.html?verification=full-game`, select a tested map and verify pages 21, 22 and 23 against the physical Event Companion; test scoring prompts in Command and End Turn for both sides in round 5; verify cancel/reopen/manual VP corrections, persistent saved game and phase navigation in Safari landscape. Do not claim iPad verification was completed.

## Status

- v1.3 **publication reference identified**: yes.
- v1.3 reported changes to maps: **none** (independent report, not independently inspected PDF).
- Direct v1.3 official PDF visual comparison: **pending**.
- Existing v1.2 45-map automated regression: **retained**.
- Five-round scoring reminder automated pass: **subject to GitHub Actions CI**.
- Live iPad end-to-end verification: **pending**.

No change in gameplay rules, manual scoring, VP caps, live unit controls, terrain polygons, or saved battle formats.
