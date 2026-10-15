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

## Measurement anchors and lines

For the terrain object a guide is measuring, normal validation expects:

- the guide begins at the intended reproducible source point, normally a terrain corner;
- the guide leaves that terrain footprint immediately;
- the guide does not enter the interior of the terrain object it measures;
- the guide does not run along or follow the boundary of the terrain object it measures.

These restrictions apply to the **measured terrain object only**.

A source-defined measurement line may cross another, unrelated terrain object if that is how the Event Companion presents the measurement. The app must not reroute a source line merely to avoid unrelated terrain or to improve its appearance.

If the Event Companion itself visibly draws a source line through or along the measured footprint, source authority wins. Preserve that exact direction/general path as a specifically audited source exception rather than reversing or rerouting the line. Page 20's approved T8 `20"` guide is the first locked example of this case.

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

Page-specific differences are expressed as data/policy. Do not add a new renderer code path such as `PAGE_19_*` for each page.

## App-only mirror augmentation

The canonical Event Companion transcription and the mirror augmentation are separate layers.

For each page:

1. transcribe, validate, visually approve, and lock the canonical Event Companion source layer first;
2. only then enable the app-only mirror augmentation for that page;
3. mirror only to explicit, unambiguous 180-degree terrain counterparts;
4. reuse the approved source value unchanged;
5. transform the approved anchor and edge together;
6. never calculate a new distance for a counterpart;
7. never alter the locked canonical guides when mirroring is enabled;
8. visually verify the augmented page before moving to the next canonical page.

If neither member of a terrain pair has an approved canonical measurement, mirroring does not create one. If a counterpart is ambiguous, leave it unlabeled.

Pages 18 and 19 have approved mirror layers. Page 20's canonical layer is approved and locked; its mirror layer is the current verification target.

## Presentation

Presentation may be improved without altering source information. Approved readability aids include:

- larger/heavier guide lines;
- clear anchor markers;
- boxed distance callouts with direction arrows;
- tap a terrain footprint to focus its measurements;
- Show All / Hide All controls;
- full-screen setup view.

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
- approved terrain pages remain unchanged while later pages are developed.

## Verification workflow

For each new Event Companion map:

1. identify the correct disposition/mission/layout source page;
2. transcribe only the official terrain-placement information;
3. declare any required source-coordinate transform as policy;
4. validate the canonical source layer against the Event Companion;
5. visually verify canonical readability, source association, and arrow direction on the target iPad/Safari layout;
6. lock the accepted canonical page with regression tests;
7. enable the explicit app-only mirror counterpart policy for that page;
8. verify copied values, transformed arrows/anchors, terrain coverage, and individual-piece readability;
9. visually approve and lock the augmented page;
10. move to the next Event Companion page.
