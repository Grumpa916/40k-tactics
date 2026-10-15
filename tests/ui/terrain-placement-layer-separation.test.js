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

test("Page 19 canonical source pass remains mirror-free until separately approved", () => {
  const layout = layoutForPage(19);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(canonical.guides.length, 20, "Page 19 has its 20 official terrain-placement measurements");
  assert.equal(complete.guides.length, 20, "mirror augmentation is still disabled for Page 19");
  assert.equal(canonical.guides.some((guide) => guide.mirrored), false);
  assert.equal(complete.guides.some((guide) => guide.mirrored), false);
  assert.deepEqual(
    complete.guides.map(sourceIdentity).sort(),
    canonical.guides.map(sourceIdentity).sort(),
    "complete output equals the canonical source layer until the mirror pass is explicitly enabled"
  );
});

test("a later unverified page cannot gain mirror measurements before its canonical source pass", () => {
  const layout = layoutForPage(20);
  const canonical = buildCanonicalTerrainPlacementOverlay(layout);
  const complete = buildCompleteTerrainPlacementOverlay(layout);

  assert.equal(canonical.guides.length, 0);
  assert.equal(complete.guides.length, 0);
});
