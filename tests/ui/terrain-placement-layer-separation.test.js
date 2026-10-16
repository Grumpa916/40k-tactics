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
  return [String(guide?.value ?? ""), Number(guide?.sourceAnchor?.[0]), Number(guide?.sourceAnchor?.[1])].join("|");
}

function expectCanonicalPlusMirrors(page, canonicalCount) {
  const layout = layoutForPage(page);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  const mirrored = complete.guides.filter((guide) => guide.mirrored);
  const official = complete.guides.filter((guide) => !guide.mirrored);

  assert.equal(canonical.guides.length, canonicalCount, `Page ${page} canonical guide count remains locked`);
  assert.equal(canonical.guides.some((guide) => guide.mirrored), false);
  assert.equal(official.length, canonicalCount);
  assert.equal(mirrored.length, canonicalCount);
  assert.equal(complete.guides.length, canonicalCount * 2);
  assert.deepEqual(official.map(sourceIdentity).sort(), canonical.guides.map(sourceIdentity).sort());

  const canonicalValues = canonical.guides.map((guide) => guide.value);
  mirrored.forEach((guide) => assert.ok(canonicalValues.includes(guide.value), `${guide.value} mirror copy reuses an approved canonical value`));
  assert.equal(new Set(complete.guides.map((guide) => guide.terrain)).size, 16, `Page ${page} mirror augmentation covers all 16 terrain objects`);
}

test("Page 18 canonical layer remains source-only and mirror augmentation is a separate second stage", () => {
  const layout = layoutForPage(18);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);
  assert.equal(canonical.guides.length, 17);
  assert.equal(canonical.guides.some((guide) => guide.mirrored), false);
  assert.ok(complete.guides.length > canonical.guides.length);
  assert.ok(complete.guides.some((guide) => guide.mirrored));
});

test("Page 19 keeps its 20-guide canonical source layer separate from the mirror augmentation", () => expectCanonicalPlusMirrors(19, 20));
test("Page 20 keeps its approved 19-guide canonical source layer separate from the mirror augmentation", () => expectCanonicalPlusMirrors(20, 19));
test("Page 21 keeps its approved 18-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(21, 18));
test("Page 22 keeps its approved 18-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(22, 18));
test("Page 23 keeps its approved 18-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(23, 18));
test("Page 24 keeps its approved 19-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(24, 19));
test("Page 25 keeps its approved 20-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(25, 20));
test("Page 26 keeps its approved 22-guide canonical source layer separate from mirror augmentation", () => expectCanonicalPlusMirrors(26, 22));

test("Page 27 cannot gain production measurements before its two confirmations", () => {
  const layout = layoutForPage(27);
  assert.equal(buildCanonicalTerrainPlacementOverlay(layout).guides.length, 0);
  assert.equal(buildCompleteTerrainPlacementOverlay(layout).guides.length, 0);
});
