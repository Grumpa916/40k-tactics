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

test("Pages 24-25 are fully approved and Page 26 awaits mirror confirmation", () => {
  for (const page of [24, 25]) {
    const status = getEventCompanionTerrainPlacementReviewStatus(page);
    assert.equal(status.state, TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED);
    assert.equal(status.canonicalConfirmed, true);
    assert.equal(status.mirrorConfirmed, true);
    assert.equal(isEventCompanionTerrainPlacementApproved(page), true);
  }

  const page26 = getEventCompanionTerrainPlacementReviewStatus(26);
  const page27 = getEventCompanionTerrainPlacementReviewStatus(27);
  assert.equal(page26.state, TERRAIN_PLACEMENT_REVIEW_STATE.CANONICAL_APPROVED);
  assert.equal(page26.canonicalConfirmed, true);
  assert.equal(page26.mirrorRequired, true);
  assert.equal(page26.mirrorConfirmed, false);
  assert.equal(isEventCompanionTerrainPlacementApproved(26), false);
  assert.equal(page27.state, "unprepared");
});

test("Page 25 approved source is promoted unchanged and renders with its approved mirrors", () => {
  const layout = layoutForPage(25);
  const candidate = buildCandidateTerrainPlacementOverlay(layout);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(candidate.guides.length, 20);
  assert.equal(canonical.guides.length, 20);
  assert.equal(complete.guides.length, 40);
  assert.equal(complete.guides.filter((guide) => guide.mirrored).length, 20);
  assert.deepEqual(
    canonical.guides.map(sourceIdentity).sort(),
    candidate.guides.map(sourceIdentity).sort(),
    "Page 25 production canonical layer is the same source transcription that passed confirmation 1"
  );
});

test("Page 26 confirmation-2 preview adds mirrors but remains isolated from production", () => {
  const layout = layoutForPage(26);
  const candidate = getEventCompanionPlacementCandidate(26);
  const canonicalCandidate = buildCandidateTerrainPlacementOverlay(layout);
  const mirrorCandidate = buildCandidateTerrainPlacementOverlay(layout, { includeMirrors: true });
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);

  assert.ok(layout, "Page 26 layout exists");
  assert.ok(candidate, "Page 26 candidate data exists");
  assert.equal(candidate.guides.length, 22);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 28);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 22);
  assert.equal(candidate.sourceAudit.excludedDeploymentDimensions.length, 6);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
  assert.equal(candidate.sourceAudit.resolvedAmbiguousSourceDimensions.length, 2);
  assert.equal(candidate.sourceAudit.sourcePathExceptions.length, 2);

  assert.equal(canonicalCandidate.guides.length, 22);
  assert.equal(canonicalCandidate.guides.some((guide) => guide.mirrored), false);
  assert.equal(mirrorCandidate.guides.length, 44);
  assert.equal(mirrorCandidate.guides.filter((guide) => guide.mirrored).length, 22);
  assert.equal(productionCanonical.guides.length, 0, "Page 26 is not production canonical data until mirror confirmation passes");
  assert.equal(productionComplete.guides.length, 0, "Page 26 candidate cannot leak into the production complete overlay");
});

test("approved Pages 24-25 remain available while the candidate gate blocks Page 26 and later pages", () => {
  const page24 = buildCompleteTerrainPlacementOverlay(layoutForPage(24));
  const page25 = buildCompleteTerrainPlacementOverlay(layoutForPage(25));
  const page26 = buildCompleteTerrainPlacementOverlay(layoutForPage(26));
  const page27 = buildCompleteTerrainPlacementOverlay(layoutForPage(27));

  assert.equal(page24.guides.length, 38, "Page 24 retains 19 canonical plus 19 approved mirrors");
  assert.equal(page25.guides.length, 40, "Page 25 retains 20 canonical plus 20 approved mirrors");
  assert.equal(page26.guides.length, 0);
  assert.equal(page27.guides.length, 0);
});
