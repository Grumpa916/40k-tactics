import { EVENT_COMPANION_MAP_CATALOG } from "../src/data/event-companion-map-catalog.js";
import {
  getEventCompanionPlacementCandidate,
  listEventCompanionPlacementCandidatePages
} from "../src/data/event-companion-placement-candidates.js";
import {
  eventCompanionTerrainPlacementReviewLabel,
  getEventCompanionTerrainPlacementReviewStatus
} from "../src/data/event-companion-placement-review-status.js";
import { getEventCompanionTerrainPlacementPolicy } from "../src/rules/event-companion-terrain-placement-policy.js";
import { buildCandidateTerrainPlacementOverlay } from "../src/ui/terrain-placement-guide-model.js";
import { terrainGuideViolatesMeasuredTerrain } from "../src/ui/terrain-placement-path-safety.js";

function layoutForPage(page) {
  return EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
}

function geometryPoints(shape) {
  return (shape?.points ?? []).map((point) => [Number(point.x), Number(point.y)]);
}

const rows = [];
let failed = false;

for (const page of listEventCompanionPlacementCandidatePages()) {
  const layout = layoutForPage(page);
  const candidate = getEventCompanionPlacementCandidate(page);
  const review = getEventCompanionTerrainPlacementReviewStatus(page);
  const policy = getEventCompanionTerrainPlacementPolicy(page);
  const overlay = layout ? buildCandidateTerrainPlacementOverlay(layout) : null;

  let reproducibleCorners = 0;
  let pathSafe = 0;
  const issues = [];

  if (!layout) issues.push("missing-layout");
  if (!candidate) issues.push("missing-candidate");
  if (!overlay) issues.push("missing-overlay");

  for (const guide of overlay?.guides ?? []) {
    const polygon = geometryPoints(layout?.terrainGeometry?.[guide.terrain]);
    if (polygon.some((vertex) => vertex[0] === guide.anchor[0] && vertex[1] === guide.anchor[1])) {
      reproducibleCorners += 1;
    } else {
      issues.push(`${guide.value}:not-on-vertex`);
    }

    if (!terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, polygon)) {
      pathSafe += 1;
    } else {
      issues.push(`${guide.terrain}:${guide.value}:path`);
    }
  }

  const guideCount = overlay?.guides?.length ?? 0;
  if (guideCount !== Number(candidate?.sourceAudit?.terrainGuideCount ?? guideCount)) {
    issues.push("guide-count-mismatch");
  }
  if (reproducibleCorners !== guideCount) issues.push("corner-check-failed");
  if (pathSafe !== guideCount) issues.push("path-check-failed");

  if (issues.length) failed = true;

  rows.push({
    page,
    state: eventCompanionTerrainPlacementReviewLabel(page),
    printed: candidate?.sourceAudit?.printedDimensionCount ?? "-",
    retained: candidate?.sourceAudit?.terrainGuideCount ?? "-",
    excluded: candidate?.sourceAudit?.excludedDeploymentDimensions?.length ?? 0,
    ambiguous: candidate?.sourceAudit?.ambiguousCount ?? "-",
    transform: policy.sourceTransform,
    corners: `${reproducibleCorners}/${guideCount}`,
    paths: `${pathSafe}/${guideCount}`,
    issues: issues.length ? issues.join(",") : "none"
  });
}

console.table(rows);
console.log(`Prepared candidates: ${rows.length}`);
console.log("Production approval is controlled separately by event-companion-placement-review-status.js.");

if (failed) process.exitCode = 1;
