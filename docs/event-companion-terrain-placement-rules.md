# Event Companion terrain-placement rules

These rules govern the V2 Battlefield Setup terrain-placement overlay.

## Purpose

The terrain map exists to transfer the placement information from the official Warhammer 40,000 Event Companion into a readable in-app setup aid so a player can reproduce the battlefield terrain on the physical table.

The app is not a replacement source for the Event Companion and is not intended to derive mathematically exact terrain placement from V2 geometry.

## Source authority

The official Event Companion is definitive for:

- terrain-placement measurement values;
- which terrain point a measurement belongs to;
- which battlefield edge that measurement references;
- the direction and general path of the measurement line.

When the app and an interpretation of the V2 geometry disagree, source fidelity to the Event Companion takes priority.

## Measurement values

- Never calculate a missing terrain-placement distance from V2 geometry.
- Never interpolate, round, approximate, or infer a replacement value.
- Never move an unrelated printed value merely to fill an unlabeled terrain object.
- Deployment-zone-only dimensions are not terrain-placement measurements and remain excluded from this overlay.
- The app-only mirror layer may copy an existing approved value unchanged to its explicit counterpart. This is reuse of approved source information, not a derived distance.
- Ambiguous source material must be flagged for review rather than guessed.

## Measurement anchors and lines

For the terrain object a guide is measuring, normal validation expects:

- the guide begins at the intended reproducible source point, normally a terrain corner;
- the guide leaves that terrain footprint immediately;
- the guide does not enter the interior of the terrain object it measures;
- the guide does not run along or follow the boundary of the terrain object it measures.

These restrictions apply to the **measured terrain object only**.

A source-defined measurement line may cross another, unrelated terrain object if that is how the Event Companion presents the measurement. The app must not reroute a source line merely to avoid unrelated terrain or to improve its appearance.

If the Event Companion itself visibly draws a source line through or along the measured footprint, source authority wins. Preserve that exact direction/general path as a specifically audited source exception rather than reversing or rerouting the line.

## Coordinate and arrow transforms

Source coordinates and display coordinates are separate concerns.

1. Event Companion source placement is aligned to V2 battlefield coordinates using the page's declared transform policy.
2. The battlefield map is then transformed into the approved display orientation.

Whenever a source transform moves an anchor, its battlefield-edge direction is transformed in the same operation. A point must never be rotated or mirrored without its arrow direction rotating or mirroring with it.

For a 180-degree transform:

- `(x, y)` becomes `(60 - x, 44 - y)`;
- `left` and `right` exchange;
- `top` and `bottom` exchange;
- the printed measurement value does not change.

Page-specific differences are expressed as data/policy. Do not add a new renderer code path for each page.

## Candidate / approved data separation

New terrain pages must not become production data simply because their source transcription has been prepared.

The workflow has four practical states:

1. **UNPREPARED** — no candidate has been generated yet.
2. **CANDIDATE · confirmation 1/2 pending** — canonical source transcription has been prepared for visual review, but production rendering remains blocked.
3. **CANDIDATE · confirmation 2/2 pending** — canonical placement has been explicitly confirmed; the mirror augmentation is now the review target, but production rendering remains blocked.
4. **APPROVED** — both required confirmations are complete and the page may be promoted to the production overlay.

Candidate source data lives separately from approved source data. Production overlay builders must fail closed for any page whose review status is not `APPROVED`, even if candidate data or transform policy already exists.

Pages 12–23 are approved and locked. Page 23 canonical and mirror measurements were visually confirmed on iPad/Safari. Page 24 is the first page using the new candidate workflow.

## Batch candidate preparation

The remaining Event Companion pages should be prepared in batches rather than rediscovered manually one page at a time.

The preparation process may automate:

- reading printed measurement values and vector measurement lines from the official PDF;
- identifying likely source anchors and referenced battlefield edges;
- testing the supported source-coordinate transforms;
- snapping transformed anchors to existing V2 terrain vertices;
- validating measured-terrain path safety;
- identifying deployment-zone-only dimensions for exclusion;
- generating candidate data, audit metadata, preview output, and regression coverage.

Automation must never infer a missing printed terrain distance from V2 geometry. Any uncertain association, transform, exclusion, or endpoint must be marked for review instead of being silently accepted.

Each candidate should retain audit metadata including, where available:

- total printed dimension count reviewed;
- terrain-placement guide count retained;
- deployment-only dimensions excluded;
- ambiguous-item count;
- declared source transform;
- candidate mirror coverage once prepared.

## App-only mirror augmentation

The canonical Event Companion transcription and mirror augmentation remain separate verification layers even though both may be prepared in the same batch.

For each page:

1. prepare the canonical candidate;
2. complete confirmation 1 for source values, anchors, edge directions, exclusions, and readability;
3. only then review the app-only mirror layer as confirmation 2;
4. mirror only to explicit, unambiguous 180-degree terrain counterparts;
5. reuse the confirmed source value unchanged;
6. transform the confirmed anchor and edge together;
7. never calculate a new distance for a counterpart;
8. never alter the confirmed canonical guides when mirroring is enabled;
9. promote the page to `APPROVED` only after confirmation 2 passes.

If neither member of a terrain pair has a confirmed canonical measurement, mirroring does not create one. If a counterpart is ambiguous, leave it unlabeled and flag it for review.

## Presentation

Presentation may be improved without altering source information. Approved readability aids include:

- larger/heavier guide lines;
- clear anchor markers;
- boxed distance callouts with direction arrows;
- tap a terrain footprint to focus its measurements;
- Show All / Hide All controls;
- full-screen setup view;
- explicit `CANDIDATE` / `APPROVED` status in the verification preview.

Readability changes must not change measurement values, source associations, edge direction, or the general source line path.

## Disposition pairing and map selection

Force Disposition lookup is directional:

- the player's disposition is the matrix row;
- the opponent's disposition is the matrix column;
- the opponent's Primary Mission is resolved with the order reversed.

After both Primary Missions are known, their mission pair is order-independent for selection of the Event Companion A/B/C battlefield block.

The selected A/B/C entry must resolve to verified geometry whose source page matches the indexed Event Companion page. A mismatch fails closed rather than displaying a different map.

Regression coverage must verify:

- all 25 directed Force Disposition matrix cells;
- all 15 Primary Mission map blocks;
- all 45 A/B/C source-page mappings;
- the actual setup-state objective synchronization for representative pairings;
- approved terrain pages remain unchanged while later pages are developed;
- candidate pages cannot appear in production overlays before approval;
- candidate and approved data layers remain distinct.

## Two-step confirmation workflow

After candidate maps are prepared, human review is deliberately short and explicit.

### Confirmation 1 — canonical

Verify:

- every retained printed terrain-placement value;
- each measurement's terrain corner/source point;
- battlefield-edge direction;
- deployment-only exclusions;
- obvious missing or duplicate guides;
- readability on the target iPad/Safari layout.

A pass moves the page to `CANONICAL_APPROVED`, but it is still not production-approved.

### Confirmation 2 — mirror

Verify:

- counterpart terrain selection;
- unchanged copied value;
- rotated/mirrored anchor and arrow direction;
- terrain coverage and readability;
- canonical layer remains unchanged.

A pass moves the page to `APPROVED`. Only then may candidate data be promoted into the production source layer.


## Delegated batch review, 15 October 2026

The user explicitly authorized processing all remaining maps without step-by-step
review, with corrections after their final review. This replaces individual human
confirmation pauses for Pages 28–53. Canonical source auditing and mirror auditing
remain separate checks. Review status records assistant review, not iPad approval.

All Pages 28–53 now have separate candidate transcriptions, production source
copies, source/exclusion audits, explicit reciprocal terrain counterparts, and
regression coverage. Pages 12–27 retain their established guide data and behavior.
Page 24's existing 16-inch source-path exception is now documented in audit
metadata without changing its overlay.

Seven source anchors lie on illustrated footprint edges away from the simplified
V2 vertices (Pages 28, 36, 37, 41, 43, 46, 47). `preserveSourcePoint` keeps their
source location and edge direction together; mirrors rotate that exact point.
They must not be snapped to an unrelated corner. Page 39's shared-corner pipeline
association is explicit via `sourceTerrain`. Page 53's reciprocal geometry differs
by up to about 1.12 inches in the simplified polygons; its approved labels remain
unchanged and the existing counterpart-corner alignment remains in use.

Pages 32 and 34 contain ambiguous PDF text/line associations. Their audit records
retain the raw extraction, corrected visible label-to-line associations, and
unassociated extraction artifacts separately from deployment exclusions. No
unassociated label is assigned to a new terrain guide by guessing.

All 26 complete overlays cover all 16 terrain objects. Some pages already measure
both members of a counterpart pair; mirror augmentation therefore adds fewer
than one copy per canonical guide on those pages. Canonical guides stay unchanged.

Validation: 729 Node tests pass. Source pages and generated focused overlay renders
were visually inspected. A live Safari/iPad review is still the user's final
acceptance step; no new device review is claimed. This batch does not merge PR
#282 or complete the separate setup-flow integration work.
## Visual render pass, 15 October 2026

The exact SVG guide markup produced by `terrain-placement-preview.js` was
exported for Pages 12–53 and rendered at a 560-pixel board width. The complete
42-page set and focused source exceptions were inspected. This uncovered five
same-footprint callout collisions on Pages 15 (T12), 23 (T4/T9), and 35 (T5/T9).

A shared presentation-only helper now separates boxes that would be visible
together in focused mode. It leaves printed values, canonical guide data,
measurement endpoints, and source line paths unchanged. It does not try to make
the deliberately dense Show all layer collision-free between different objects.

Validation after the change:

- 768 Node tests pass, including a layout regression for every Page 15–53.
- The exact generated SVG has no clipped callout boxes or overlapping boxes
  belonging to the same terrain piece across Pages 12–53.
- 2,145 assertions exercised the actual focus event handlers with a mock DOM:
  default hiding, Show all/Hide all, each footprint, Enter/Space activation,
  focus status, callout visibility, and persistent anchor markers.
- Corrected focused views were rendered and visually inspected.

Browser testing was attempted but is incomplete: the browser environment blocked
both the local preview and the committed public preview, and the local runtime
could not download its browser binary. These results are rendered SVG and mock
DOM checks, not a successful live browser or Safari/iPad touch test. Setup-flow
integration and live-device acceptance remain outstanding. PR #282 stays draft.
