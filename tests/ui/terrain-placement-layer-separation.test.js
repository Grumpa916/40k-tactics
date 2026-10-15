import test from "node:test";
import assert from "node:assert/strict";

import { EVENT_COMPANION_MAP_CATALOG } from "../../src/data/event-companion-map-catalog.js";
import {
  buildCanonicalTerrainPlacementOverlay,
  buildCompleteTerrainPlacementOverlay
} from "../../src/ui/terrain-placement-guide-model.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

function sourceIdentity(guide) {
  return [
    String(guide?.value ?? ""),
    Number(guide?.sourceAnchor?.[0]),
    Number(guide?.sourceAnchor?.[1])
  ].join("|");
}

function expectCanonicalPlusMirrors(page, canonicalCount) {
  const layout = layoutForPage(page);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const mirrored = complete.guides.filter((guide) => guide.mirrored);
  const official = complete.guides.filter((guide) => !guide.mirrored);

  assert.equal(canonical.guides.length, canonicalCount, `Page ${page} canonical guide count remains locked`);
  assert.equal(canonical.guides.some((guide) => guide.mirrored), false, "canonical layer remains mirror-free");
  assert.equal(official.length, canonicalCount, "complete output preserves every canonical guide unchanged");
  assert.equal(mirrored.length, canonicalCount, "each canonical guide is reused once on its clear 180-degree counterpart");
  assert.equal(complete.guides.length, canonicalCount * 2, "complete output is canonical plus mirror augmentation");

  assert.deepEqual(
    official.map(sourceIdentity).sort(),
    canonical.guides.map(sourceIdentity).sort(),
    "enabling mirroring does not alter the approved canonical source layer"
  );

  const canonicalValues = canonical.guides.map((guide) => guide.value);
  mirrored.forEach((guide) => {
    assert.ok(canonicalValues.includes(guide.value), `${guide.value} mirror copy reuses an approved canonical value`);
  });

  assert.equal(
    new Set(complete.guides.map((guide) => guide.terrain)).size,
    16,
    `Page ${page} mirror augmentation provides at least one guide for all 16 terrain objects`
  );
}

test("Page 18 canonical layer remains source-only and mirror augmentation is a separate second stage", () => {
  const layout = layoutForPage(18);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(canonical.guides.length, 17, "canonical Page 18 keeps only the approved source/correction guides");
  assert.equal(canonical.guides.some((guide) => guide.mirrored), false, "canonical source layer never contains mirror copies");

  assert.ok(complete.guides.length > canonical.guides.length, "complete Page 18 adds the approved mirror usability layer");
  assert.ok(complete.guides.some((guide) => guide.mirrored), "mirror copies are identifiable as augmentation");

  const canonicalValues = canonical.guides.map((guide) => guide.value);
  for (const guide of complete.guides.filter((item) => item.mirrored)) {
    assert.ok(canonicalValues.includes(guide.value), `${guide.value} mirror copy reuses an existing canonical value`);
  }
});

test("Page 19 keeps its 20-guide canonical source layer separate from the mirror augmentation", () => {
  expectCanonicalPlusMirrors(19, 20);
});

test("Page 20 keeps its approved 19-guide canonical source layer separate from the mirror augmentation", () => {
  expectCanonicalPlusMirrors(20, 19);
});

test("Page 21 keeps its approved 18-guide canonical source layer separate from mirror augmentation", () => {
  expectCanonicalPlusMirrors(21, 18);
});

test("a later unverified page cannot gain measurements before its canonical source pass", () => {
  const layout = layoutForPage(22);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(canonical.guides.length, 0);
  assert.equal(complete.guides.length, 0);
});
