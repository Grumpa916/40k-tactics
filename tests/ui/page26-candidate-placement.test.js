import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_26_CANDIDATE_SOURCE_GUIDES, getEventCompanionPlacementCandidate } from "../../src/data/event-companion-placement-candidates.js";
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
  return overlay.guides.find((guide) => (
    guide.value === value
    && guide.sourceAnchor?.[0] === sourceAnchor[0]
    && guide.sourceAnchor?.[1] === sourceAnchor[1]
  ));
}

test("Page 26 source audit retains 22 terrain dimensions and excludes six deployment-only dimensions", () => {
  const candidate = getEventCompanionPlacementCandidate(26);

  assert.equal(PAGE_26_CANDIDATE_SOURCE_GUIDES.length, 22);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 28);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 22);
  assert.equal(candidate.sourceAudit.excludedDeploymentDimensions.length, 6);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
  assert.deepEqual(candidate.sourceAudit.resolvedAmbiguousSourceDimensions, [
    '26"|top|33.02|26.05',
    '26"|top|39.99|26.09'
  ]);
});

test("Page 26 candidate uses flipX source alignment and snaps every retained guide to an existing V2 terrain corner", () => {
  const layout = layoutForPage(26);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);

  assert.ok(layout);
  assert.equal(overlay.guides.length, 22);
  assert.equal(overlay.guides.some((guide) => guide.mirrored), false);

  for (const guide of overlay.guides) {
    const vertices = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    assert.ok(
      vertices.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
      `${guide.value} is attached to a reproducible ${guide.terrain} corner`
    );
  }

  const seventeen = findBySource(overlay, '17"', [17.02, 32.05]);
  assert.deepEqual(
    { terrain: seventeen?.terrain, anchor: seventeen?.anchor, edge: seventeen?.edge },
    { terrain: "T3", anchor: [43.1, 32], edge: "right" }
  );

  const upperTwentySix = findBySource(overlay, '26"', [33.02, 26.05]);
  assert.deepEqual(
    { terrain: upperTwentySix?.terrain, anchor: upperTwentySix?.anchor, edge: upperTwentySix?.edge },
    { terrain: "T6", anchor: [27, 26], edge: "top" }
  );

  const lowerTwentySix = findBySource(overlay, '26"', [39.99, 26.09]);
  assert.deepEqual(
    { terrain: lowerTwentySix?.terrain, anchor: lowerTwentySix?.anchor, edge: lowerTwentySix?.edge },
    { terrain: "T6", anchor: [19.9, 26], edge: "top" }
  );

  const twelve = findBySource(overlay, '12"', [55.94, 11.97]);
  assert.deepEqual(
    { terrain: twelve?.terrain, anchor: twelve?.anchor, edge: twelve?.edge },
    { terrain: "T16", anchor: [3.9, 12], edge: "bottom" }
  );
});

test("Page 26 preserves the two source-audited own-footprint path exceptions", () => {
  const layout = layoutForPage(26);
  const candidate = getEventCompanionPlacementCandidate(26);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);
  const exceptions = new Set(candidate.sourceAudit.sourcePathExceptions);

  assert.deepEqual([...exceptions].sort(), [
    '21"|21.01|38.97',
    '13"|33.97|30.94'
  ].sort());

  for (const guide of overlay.guides) {
    const polygon = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    const violates = terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, polygon);
    if (exceptions.has(sourceIdentity(guide))) {
      assert.equal(violates, true, `${sourceIdentity(guide)} remains the source-authoritative path exception`);
    } else {
      assert.equal(violates, false, `${guide.terrain} ${guide.value} ${guide.edge} leaves the measured terrain cleanly`);
    }
  }
});

test("Page 26 canonical approval enables a 22-guide mirror candidate without promoting production", () => {
  const layout = layoutForPage(26);
  const canonicalCandidate = buildCandidateTerrainPlacementOverlay(layout);
  const mirrorCandidate = buildCandidateTerrainPlacementOverlay(layout, { includeMirrors: true });
  const mirrored = mirrorCandidate.guides.filter((guide) => guide.mirrored);
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);
  const mirrorPolicy = getEventCompanionTerrainMirrorPolicy(26);

  assert.equal(canonicalCandidate.guides.length, 22);
  assert.equal(mirrorPolicy.enabled, true);
  assert.equal(mirrorPolicy.transform, "rotate180");
  assert.equal(mirrored.length, 22);
  assert.equal(mirrorCandidate.guides.length, 44);
  assert.equal(productionCanonical.guides.length, 0);
  assert.equal(productionComplete.guides.length, 0);

  const coveredTerrain = new Set(mirrorCandidate.guides.map((guide) => guide.terrain));
  for (let index = 1; index <= 16; index += 1) {
    assert.ok(coveredTerrain.has(`T${index}`), `T${index} receives at least one canonical or mirrored Page 26 guide`);
  }

  for (const copy of mirrored) {
    const source = canonicalCandidate.guides.find((guide) => (
      guide.terrain === copy.mirroredFromTerrain
      && guide.value === copy.value
      && guide.anchor[0] === copy.mirroredFromAnchor?.[0]
      && guide.anchor[1] === copy.mirroredFromAnchor?.[1]
    ));
    assert.ok(source, `${copy.terrain} ${copy.value} maps back to an approved canonical Page 26 guide`);
    assert.equal(copy.value, source.value, "mirror augmentation preserves the approved distance value unchanged");
  }
});
