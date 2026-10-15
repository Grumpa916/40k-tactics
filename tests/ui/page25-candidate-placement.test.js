import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import { PAGE_25_CANDIDATE_SOURCE_GUIDES, getEventCompanionPlacementCandidate } from "../../src/data/event-companion-placement-candidates.js";
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

test("Page 25 source audit retains 20 terrain dimensions and excludes six deployment-zone dimensions", () => {
  const candidate = getEventCompanionPlacementCandidate(25);

  assert.equal(PAGE_25_CANDIDATE_SOURCE_GUIDES.length, 20);
  assert.equal(candidate.sourceAudit.printedDimensionCount, 26);
  assert.equal(candidate.sourceAudit.terrainGuideCount, 20);
  assert.equal(candidate.sourceAudit.excludedDeploymentDimensions.length, 6);
  assert.deepEqual(candidate.sourceAudit.excludedDeploymentDimensions, [
    '12"|left|12.03|42.97',
    '20"|left|19.93|1.06',
    '26"|left|25.97|45.07',
    '26"|right|34.05|-1',
    '20"|right|40.05|42.97',
    '12"|right|48.07|1.06'
  ]);
  assert.equal(candidate.sourceAudit.ambiguousCount, 0);
});

test("Page 25 candidate uses the audited flipX source frame and snaps to reproducible terrain corners", () => {
  const layout = layoutForPage(25);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);

  assert.ok(layout);
  assert.equal(overlay.guides.length, 20);
  assert.equal(overlay.guides.some((guide) => guide.mirrored), false);

  for (const guide of overlay.guides) {
    const polygon = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    assert.ok(
      polygon.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1]),
      `${guide.value} is attached to a reproducible ${guide.terrain} corner`
    );
  }

  const upperTwentySix = findBySource(overlay, '26"', [25.97, 37.92]);
  assert.deepEqual(
    { terrain: upperTwentySix?.terrain, anchor: upperTwentySix?.anchor, edge: upperTwentySix?.edge },
    { terrain: "T3", anchor: [34.1, 38], edge: "right" }
  );

  const six = findBySource(overlay, '6"', [32.97, 38.03]);
  assert.deepEqual(
    { terrain: six?.terrain, anchor: six?.anchor, edge: six?.edge },
    { terrain: "T3", anchor: [27, 38], edge: "top" }
  );

  const eight = findBySource(overlay, '8"', [52.00, 26.08]);
  assert.deepEqual(
    { terrain: eight?.terrain, anchor: eight?.anchor, edge: eight?.edge },
    { terrain: "T8", anchor: [7.9, 26.2], edge: "left" }
  );
});

test("Page 25 preserves the two official 10-inch source paths as audited exceptions", () => {
  const layout = layoutForPage(25);
  const candidate = getEventCompanionPlacementCandidate(25);
  const overlay = buildCandidateTerrainPlacementOverlay(layout);
  const exceptions = new Set(candidate.sourceAudit.sourcePathExceptions);

  assert.deepEqual([...exceptions].sort(), ['10"|50.02|22.95', '10"|50.03|13.04'].sort());

  for (const guide of overlay.guides) {
    const polygon = (layout.terrainGeometry?.[guide.terrain]?.points ?? [])
      .map((point) => [Number(point.x), Number(point.y)]);
    const violates = terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, polygon);
    if (exceptions.has(sourceIdentity(guide))) {
      assert.equal(violates, true, `${sourceIdentity(guide)} remains the source-authoritative boundary-overlap exception`);
    } else {
      assert.equal(violates, false, `${guide.terrain} ${guide.value} ${guide.edge} leaves the measured terrain cleanly`);
    }
  }

  const firstTen = findBySource(overlay, '10"', [50.03, 13.04]);
  assert.deepEqual(
    { terrain: firstTen?.terrain, anchor: firstTen?.anchor, edge: firstTen?.edge },
    { terrain: "T4", anchor: [10, 13], edge: "left" }
  );

  const secondTen = findBySource(overlay, '10"', [50.02, 22.95]);
  assert.deepEqual(
    { terrain: secondTen?.terrain, anchor: secondTen?.anchor, edge: secondTen?.edge },
    { terrain: "T5", anchor: [10, 23], edge: "left" }
  );
});

test("Page 25 approved production keeps the 20-guide canonical layer and 20-guide mirror augmentation", () => {
  const layout = layoutForPage(25);
  const canonicalCandidate = buildCandidateTerrainPlacementOverlay(layout);
  const mirrorCandidate = buildCandidateTerrainPlacementOverlay(layout, { includeMirrors: true });
  const mirrored = mirrorCandidate.guides.filter((guide) => guide.mirrored);
  const productionCanonical = buildCanonicalTerrainPlacementOverlay(layout);
  const productionComplete = buildCompleteTerrainPlacementOverlay(layout);
  const mirrorPolicy = getEventCompanionTerrainMirrorPolicy(25);

  assert.equal(canonicalCandidate.guides.length, 20);
  assert.equal(mirrorPolicy.enabled, true);
  assert.equal(mirrorPolicy.transform, "rotate180");
  assert.equal(mirrored.length, 20);
  assert.equal(mirrorCandidate.guides.length, 40);
  assert.equal(productionCanonical.guides.length, 20);
  assert.equal(productionComplete.guides.length, 40);

  assert.deepEqual(
    productionCanonical.guides.map(sourceIdentity).sort(),
    canonicalCandidate.guides.map(sourceIdentity).sort(),
    "Page 25 production canonical data is the exact source transcription that passed confirmation 1"
  );

  const coveredTerrain = new Set(productionComplete.guides.map((guide) => guide.terrain));
  for (let index = 1; index <= 16; index += 1) {
    assert.ok(coveredTerrain.has(`T${index}`), `T${index} receives at least one canonical or mirrored Page 25 guide`);
  }

  for (const copy of mirrored) {
    const source = canonicalCandidate.guides.find((guide) => (
      guide.terrain === copy.mirroredFromTerrain
      && guide.value === copy.value
      && guide.anchor[0] === copy.mirroredFromAnchor?.[0]
      && guide.anchor[1] === copy.mirroredFromAnchor?.[1]
    ));
    assert.ok(source, `${copy.terrain} ${copy.value} maps back to an approved canonical Page 25 guide`);
    assert.equal(copy.value, source.value, "mirror augmentation preserves the approved distance value unchanged");
  }

  const mirroredUpperTwentySix = mirrored.find((guide) => (
    guide.value === '26"'
    && guide.mirroredFromTerrain === "T3"
    && guide.mirroredFromAnchor?.[0] === 34.1
    && guide.mirroredFromAnchor?.[1] === 38
  ));
  assert.deepEqual(
    { terrain: mirroredUpperTwentySix?.terrain, anchor: mirroredUpperTwentySix?.anchor, edge: mirroredUpperTwentySix?.edge },
    { terrain: "T1", anchor: [26, 6], edge: "left" }
  );
});
