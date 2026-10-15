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

function sourceIdentity(guide) {
  return [String(guide?.value ?? ""), Number(guide?.sourceAnchor?.[0]), Number(guide?.sourceAnchor?.[1])].join("|");
}

test("Page 24 is fully approved and Page 25 starts confirmation 1", () => {
  const page24 = getEventCompanionTerrainPlacementReviewStatus(24);
  const page25 = getEventCompanionTerrainPlacementReviewStatus(25);
  const page26 = getEventCompanionTerrainPlacementReviewStatus(26);

  assert.equal(page24.state, TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED);
  assert.equal(page24.canonicalConfirmed, true);
  assert.equal(page24.mirrorConfirmed, true);
  assert.equal(isEventCompanionTerrainPlacementApproved(24), true);

  assert.equal(page25.state, TERRAIN_PLACEMENT_REVIEW_STATE.CANDIDATE);
  assert.equal(page25.canonicalConfirmed, false);
  assert.equal(page25.mirrorRequired, true);
  assert.equal(page25.mirrorConfirmed, false);
  assert.equal(isEventCompanionTerrainPlacementApproved(25), false);

  assert.equal(page26.state, "unprepared");
  assert.equal(isEventCompanionTerrainPlacementApproved(26), false);
});

test("Page 24 approved source is promoted unchanged and renders with its approved mirrors", () => {
  const layout = layoutForPage(24);
  const candidate = buildCandidateTerrainPlacementOverlay(layout);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(candidate.guides.length, 19);
  assert.equal(canonical.guides.length, 19);
  assert.equal(complete.guides.length, 38);
  assert.equal(complete.guides.filter((guide) => guide.mirrored).length, 19);
  assert.deepEqual(
    canonical.guides.map(sourceIdentity).sort(),
    candidate.guides.map(sourceIdentity).sort(),
    "Page 24 production canonical layer is the same source transcription that passed confirmation 1"
  );
});

test("Page 25 candidate source data is isolated from production while confirmation 1 is pending", () => {
  const layout = layoutForPage(25);
  const candidate = getEventCompanionPlacementCandidate(25);
  const candidateOverlay = buildCandidateTerrainPlacementOverlay(layout);
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 25 layout exists");
  assert.ok(candidate, "Page 25 candidate data exists");
  assert.equal(candidate.guides.length, 20);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 26);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 20);
  assert.equal(candidate.sourceAudit.excludedDeploymentDimensions.length, 6);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
  assert.equal(candidate.sourceAudit.sourcePathExceptions.length, 2);

  assert.equal(candidateOverlay.guides.length, 20, "verification preview renders only the candidate canonical guides");
  assert.equal(candidateOverlay.guides.some((guide) => guide.mirrored), false, "confirmation 1 remains mirror-free");
  assert.equal(productionCanonical.guides.length, 0, "Page 25 is not production canonical data yet");
  assert.equal(productionComplete.guides.length, 0, "Page 25 candidate cannot leak into the production complete overlay");
});

test("Page 25 candidate alignment snaps every retained source point to an existing V2 terrain vertex", () => {
  const layout = layoutForPage(25);
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

test("approved Page 24 remains available while the candidate gate blocks Page 25 and later pages", () => {
  const page24 = buildCompleteTerrainPlacementOverlay(layoutForPage(24));
  const page25 = buildCompleteTerrainPlacementOverlay(layoutForPage(25));
  const page26 = buildCompleteTerrainPlacementOverlay(layoutForPage(26));

  assert.equal(page24.guides.length, 38, "Page 24 retains 19 canonical plus 19 approved mirrors");
  assert.equal(page25.guides.length, 0);
  assert.equal(page26.guides.length, 0);
});
