import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { getEventCompanionPlacementCandidate } from "../../src/data/event-companion-placement-candidates.js";
import {
  TERRAIN_PLACEMENT_REVIEW_STATE,
  getEventCompanionTerrainPlacementReviewStatus,
  isEventCompanionTerrainPlacementApproved
} from "../../src/data/event-companion-placement-review-status.js";
import {
  buildCandidateTerrainPlacementOverlay,
  buildCanonicalTerrainPlacementOverlay,
  buildCompleteTerrainPlacementOverlay
} from "../../src/ui/terrain-placement-guide-model.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

test("Page 23 is locked approved and Page 24 starts the two-confirmation candidate workflow", () => {
  const page23 = getEventCompanionTerrainPlacementReviewStatus(23);
  const page24 = getEventCompanionTerrainPlacementReviewStatus(24);
  const page25 = getEventCompanionTerrainPlacementReviewStatus(25);

  assert.equal(page23.state, TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED);
  assert.equal(page23.canonicalConfirmed, true);
  assert.equal(page23.mirrorConfirmed, true);
  assert.equal(isEventCompanionTerrainPlacementApproved(23), true);

  assert.equal(page24.state, TERRAIN_PLACEMENT_REVIEW_STATE.CANDIDATE);
  assert.equal(page24.canonicalConfirmed, false);
  assert.equal(page24.mirrorRequired, true);
  assert.equal(page24.mirrorConfirmed, false);
  assert.equal(isEventCompanionTerrainPlacementApproved(24), false);

  assert.equal(page25.state, "unprepared");
  assert.equal(isEventCompanionTerrainPlacementApproved(25), false);
});

test("Page 24 candidate source data is isolated from all production overlay builders", () => {
  const layout = layoutForPage(24);
  const candidate = getEventCompanionPlacementCandidate(24);
  const candidateOverlay = buildCandidateTerrainPlacementOverlay(layout);
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 24 layout exists");
  assert.ok(candidate, "Page 24 candidate data exists");
  assert.equal(candidate.guides.length, 19);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 21);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 19);
  assert.deepEqual(candidate.sourceAudit.excludedDeploymentDimensions, ['7"', '9"']);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);

  assert.equal(candidateOverlay.guides.length, 19, "verification preview can render candidate guides");
  assert.equal(candidateOverlay.guides.some((guide) => guide.mirrored), false, "confirmation 1 is canonical-only");

  assert.equal(productionCanonical.guides.length, 0, "candidate data is not canonical production data");
  assert.equal(productionComplete.guides.length, 0, "candidate data cannot leak into the production complete overlay");
});

test("Page 24 candidate alignment snaps source points only to existing V2 terrain vertices", () => {
  const layout = layoutForPage(24);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);

  for (const guide of overlay.guides) {
    const vertices = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    assert.ok(
      vertices.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
      `${guide.value} candidate snaps to a reproducible ${guide.terrain} corner`
    );
  }
});

test("approved Page 23 remains available while the candidate gate blocks later pages", () => {
  const page23 = buildCompleteTerrainPlacementOverlay(layoutForPage(23));
  const page24 = buildCompleteTerrainPlacementOverlay(layoutForPage(24));
  const page25 = buildCompleteTerrainPlacementOverlay(layoutForPage(25));

  assert.equal(page23.guides.length, 36, "Page 23 retains 18 canonical plus 18 approved mirrors");
  assert.equal(page24.guides.length, 0);
  assert.equal(page25.guides.length, 0);
});
