import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_27_CANDIDATE_SOURCE_GUIDES, getEventCompanionPlacementCandidate } from "../../src/data/event-companion-placement-candidates.js";
import { getEventCompanionTerrainMirrorPolicy } from "../../src/rules/event-companion-terrain-mirror-policy.js";
import {
  buildCandidateTerrainPlacementOverlay,
  buildCanonicalTerrainPlacementOverlay,
  buildCompleteTerrainPlacementOverlay
} from "../../src/ui/terrain-placement-guide-model.js";
import { terrainGuideViolatesMeasuredTerrain } from "../../src/ui/terrain-placement-path-safety.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

function sourceIdentity(guide) {
  return [String(guide?.value ?? ""), Number(guide?.sourceAnchor?.[0]), Number(guide?.sourceAnchor?.[1])].join("|");
}

function findBySource(overlay, value, sourceAnchor) {
  return overlay.guides.find((guide) => guide.value === value && guide.sourceAnchor?.[0] === sourceAnchor[0] && guide.sourceAnchor?.[1] === sourceAnchor[1]);
}

test("Page 27 source audit retains 20 terrain dimensions and excludes the internal deployment dimension", () => {
  const candidate = getEventCompanionPlacementCandidate(27);
  assert.equal(PAGE_27_CANDIDATE_SOURCE_GUIDES.length, 20);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 21);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 20);
  assert.deepEqual(candidate.sourceAudit.excludedDeploymentDimensions, ['9"|internal|30.01|15.71|23.56|22.04']);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
  assert.deepEqual(candidate.sourceAudit.resolvedAmbiguousSourceDimensions, ['5"|top|26.9|40.08']);
  assert.deepEqual(candidate.sourceAudit.sourcePathExceptions, ['20"|40.04|11']);
});

test("Page 27 candidate uses flipX source alignment and reproducible V2 terrain corners", () => {
  const layout = layoutForPage(27);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);
  assert.ok(layout);
  assert.equal(overlay.guides.length, 20);
  assert.equal(overlay.guides.some((guide) => guide.mirrored), false);

  for (const guide of overlay.guides) {
    const vertices = (layout.terrainGeometry?.[guide.terrain]?.points ?? []).map((point) => [Number(point.x), Number(point.y)]);
    assert.ok(vertices.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]), `${guide.value} attaches to a reproducible ${guide.terrain} corner`);
  }

  const twentyFive = findBySource(overlay, '25"', [24.96, 40.07]);
  assert.deepEqual({ terrain: twentyFive?.terrain, anchor: twentyFive?.anchor, edge: twentyFive?.edge }, { terrain: "T12", anchor: [35.1, 40.1], edge: "right" });

  const resolvedFive = findBySource(overlay, '5"', [26.9, 40.08]);
  assert.deepEqual({ terrain: resolvedFive?.terrain, anchor: resolvedFive?.anchor, edge: resolvedFive?.edge }, { terrain: "T12", anchor: [33.1, 40.1], edge: "top" });

  const seventeen = findBySource(overlay, '17"', [36.04, 27.12]);
  assert.deepEqual({ terrain: seventeen?.terrain, anchor: seventeen?.anchor, edge: seventeen?.edge }, { terrain: "T6", anchor: [24, 27.1], edge: "top" });

  const twenty = findBySource(overlay, '20"', [40.04, 11]);
  assert.deepEqual({ terrain: twenty?.terrain, anchor: twenty?.anchor, edge: twenty?.edge }, { terrain: "T8", anchor: [20, 10.9], edge: "left" });

  const twentyTwo = findBySource(overlay, '22"', [54.14, 22.03]);
  assert.deepEqual({ terrain: twentyTwo?.terrain, anchor: twentyTwo?.anchor, edge: twentyTwo?.edge }, { terrain: "T2", anchor: [5.8, 22.1], edge: "top" });
});

test("Page 27 preserves only the official 20-inch own-footprint path as an audited exception", () => {
  const layout = layoutForPage(27);
  const candidate = getEventCompanionPlacementCandidate(27);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);
  const exceptions = new Set(candidate.sourceAudit.sourcePathExceptions);

  for (const guide of overlay.guides) {
    const polygon = (layout.terrainGeometry?.[guide.terrain]?.points ?? []).map((point) => [Number(point.x), Number(point.y)]);
    const violates = terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, polygon);
    if (exceptions.has(sourceIdentity(guide))) assert.equal(violates, true, `${sourceIdentity(guide)} remains the official source-path exception`);
    else assert.equal(violates, false, `${guide.terrain} ${guide.value} ${guide.edge} leaves the measured terrain cleanly`);
  }
});

test("Page 27 confirmation-2 preview adds only declared mirrors while production remains blocked", () => {
  const layout = layoutForPage(27);
  const candidate = buildCandidateTerrainPlacementOverlay(layout);
  const mirrorPreview = buildCandidateTerrainPlacementOverlay(layout, { includeMirrors: true });
  const mirrorPolicy = getEventCompanionTerrainMirrorPolicy(27);
  const mirrored = mirrorPreview.guides.filter((guide) => guide.mirrored);

  assert.equal(candidate.guides.length, 20);
  assert.equal(mirrorPolicy.enabled, true);
  assert.equal(mirrorPolicy.transform, "rotate180");
  assert.equal(mirrored.length, 20);
  assert.equal(mirrorPreview.guides.length, 40);
  assert.equal(buildCanonicalTerrainPlacementOverlay(layout).guides.length, 0);
  assert.equal(buildCompleteTerrainPlacementOverlay(layout).guides.length, 0);
});
