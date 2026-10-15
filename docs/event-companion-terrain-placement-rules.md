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
- An explicitly approved exact symmetry/counterpart rule may copy an existing approved value unchanged to its clear counterpart. This is reuse of source information, not a derived distance.

## Measurement anchors and lines

For the terrain object a guide is measuring:

- the guide begins at the intended reproducible source point, normally a terrain corner;
- the guide leaves that terrain footprint immediately;
- the guide must not enter the interior of the terrain object it measures;
- the guide must not run along or follow the boundary of the terrain object it measures.

These restrictions apply to the **measured terrain object only**.

A source-defined measurement line may cross another, unrelated terrain object if that is how the Event Companion presents the measurement. The app must not reroute a source line merely to avoid unrelated terrain or to improve its appearance.

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

## Counterpart reuse

Counterpart reuse is allowed only when explicitly established for a layout and the counterpart is unambiguous.

When enabled:

- use the same approved source value;
- place it on the declared counterpart terrain object;
- transform anchor and edge together;
- use the same visual treatment as the source measurement;
- do not create a calculated or secondary measurement layer;
- leave ambiguous objects unlabeled.

Page 18 currently uses an approved 180-degree counterpart policy.

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
4. apply an already-approved counterpart policy only when it clearly applies;
5. validate that each guide leaves its measured terrain correctly;
6. visually verify readability and arrow direction on the target iPad/Safari layout;
7. lock the accepted page with regression tests before moving on.
