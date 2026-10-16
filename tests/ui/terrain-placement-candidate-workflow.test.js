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

test("Pages 24-26 are fully approved and Page 27 awaits mirror confirmation", () => {
  for (const page of [24, 25, 26]) {
    const status = getEventCompanionTerrainPlacementReviewStatus(page);
    assert.equal(status.state, TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED);
    assert.equal(status.canonicalConfirmed, true);
    assert.equal(status.mirrorConfirmed, true);
    assert.equal(isEventCompanionTerrainPlacementApproved(page), true);
  }

  const page27 = getEventCompanionTerrainPlacementReviewStatus(27);
  const page28 = getEventCompanionTerrainPlacementReviewStatus(28);
  assert.equal(page27.state, TERRAIN_PLACEMENT_REVIEW_STATE.CANONICAL_APPROVED);
  assert.equal(page27.canonicalConfirmed, true);
  assert.equal(page27.mirrorRequired, true);
  assert.equal(page27.mirrorConfirmed, false);
  assert.equal(isEventCompanionTerrainPlacementApproved(27), false);
  assert.equal(page28.state, "unprepared");
});

test("Page 26 approved source is promoted unchanged and renders with its approved mirrors", () => {
  const layout = layoutForPage(26);
  const candidate = buildCandidateTerrainPlacementOverlay(layout);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(candidate.guides.length, 22);
  assert.equal(canonical.guides.length, 22);
  assert.equal(complete.guides.length, 44);
  assert.equal(complete.guides.filter((guide) => guide.mirrored).length, 22);
  assert.deepEqual(canonical.guides.map(sourceIdentity).sort(), candidate.guides.map(sourceIdentity).sort());
});

test("Page 27 confirmation-2 preview contains canonical guides plus mirrors and remains isolated from production", () => {
  const layout = layoutForPage(27);
  const candidate = getEventCompanionPlacementCandidate(27);
  const canonicalCandidate = buildCandidateTerrainPlacementOverlay(layout);
  const mirrorCandidate = buildCandidateTerrainPlacementOverlay(layout, { includeMirrors: true });
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);

  assert.ok(layout);
  assert.ok(candidate);
  assert.equal(candidate.guides.length, 20);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 21);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 20);
  assert.equal(candidate.sourceAudit.excludedDeploymentDimensions.length, 1);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
  assert.equal(candidate.sourceAudit.resolvedAmbiguousSourceDimensions.length, 1);
  assert.equal(candidate.sourceAudit.sourcePathExceptions.length, 1);

  assert.equal(canonicalCandidate.guides.length, 20);
  assert.equal(canonicalCandidate.guides.some((guide) => guide.mirrored), false);
  assert.equal(mirrorCandidate.guides.length, 40);
  assert.equal(mirrorCandidate.guides.filter((guide) => guide.mirrored).length, 20);
  assert.equal(productionCanonical.guides.length, 0);
  assert.equal(productionComplete.guides.length, 0);
});

test("approved Pages 24-26 remain available while the production gate blocks Page 27 and later pages", () => {
  assert.equal(buildCompleteTerrainPlacementOverlay(layoutForPage(24)).guides.length, 38);
  assert.equal(buildCompleteTerrainPlacementOverlay(layoutForPage(25)).guides.length, 40);
  assert.equal(buildCompleteTerrainPlacementOverlay(layoutForPage(26)).guides.length, 44);
  assert.equal(buildCompleteTerrainPlacementOverlay(layoutForPage(27)).guides.length, 0);
  assert.equal(buildCompleteTerrainPlacementOverlay(layoutForPage(28)).guides.length, 0);
});
