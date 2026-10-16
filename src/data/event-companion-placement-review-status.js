// Review lifecycle for Event Companion terrain-placement overlays.
//
// Production rendering is allowed only for APPROVED pages. New pages are first
// prepared as CANDIDATE data, then require two explicit confirmations:
//   1. canonical source transcription / placement confirmation
//   2. mirror augmentation confirmation (when a mirror pass is required)
// Only after both confirmations does a page become APPROVED.

export const TERRAIN_PLACEMENT_REVIEW_STATE = Object.freeze({
  CANDIDATE: "candidate",
  CANONICAL_APPROVED: "canonical-approved",
  APPROVED: "approved"
});

function approved({ mirrorRequired = true } = {}) {
  return Object.freeze({
    state: TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED,
    canonicalConfirmed: true,
    mirrorRequired,
    mirrorConfirmed: mirrorRequired ? true : null
  });
}

function candidate({ mirrorRequired = true } = {}) {
  return Object.freeze({
    state: TERRAIN_PLACEMENT_REVIEW_STATE.CANDIDATE,
    canonicalConfirmed: false,
    mirrorRequired,
    mirrorConfirmed: mirrorRequired ? false : null
  });
}

function canonicalApproved({ mirrorRequired = true } = {}) {
  return Object.freeze({
    state: TERRAIN_PLACEMENT_REVIEW_STATE.CANONICAL_APPROVED,
    canonicalConfirmed: true,
    mirrorRequired,
    mirrorConfirmed: mirrorRequired ? false : null
  });
}

const PAGE_REVIEW_STATUS = Object.freeze({
  12: approved({ mirrorRequired: false }),
  13: approved({ mirrorRequired: false }),
  14: approved({ mirrorRequired: false }),
  15: approved({ mirrorRequired: false }),
  16: approved({ mirrorRequired: false }),
  17: approved({ mirrorRequired: false }),
  18: approved(),
  19: approved(),
  20: approved(),
  21: approved(),
  22: approved(),
  23: approved(),
  24: approved(),
  25: approved(),
  // Page 26 canonical and mirror measurements were visually confirmed on
  // iPad/Safari. It is now fully approved for production rendering.
  26: approved(),
  // Page 27 canonical and app-only mirror measurements were visually confirmed
  // on iPad/Safari. It is now fully approved for production rendering.
  27: approved(),
  // Batch canonical and mirror reviews delegated by the user, 2026-10-15.
  ...Object.fromEntries(Array.from({ length: 26 }, (_, index) => [28 + index, Object.freeze({ ...approved(), reviewedBy: "assistant", reviewMethod: "delegated-source-and-mirror-audit" })]))
});

const UNPREPARED_STATUS = Object.freeze({
  state: "unprepared",
  canonicalConfirmed: false,
  mirrorRequired: true,
  mirrorConfirmed: false
});

export function getEventCompanionTerrainPlacementReviewStatus(page) {
  return PAGE_REVIEW_STATUS[Number(page)] ?? UNPREPARED_STATUS;
}

export function isEventCompanionTerrainPlacementApproved(page) {
  return getEventCompanionTerrainPlacementReviewStatus(page).state === TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED;
}

export function eventCompanionTerrainPlacementReviewLabel(page) {
  const status = getEventCompanionTerrainPlacementReviewStatus(page);
  if (status.state === TERRAIN_PLACEMENT_REVIEW_STATE.APPROVED) return "APPROVED";
  if (status.state === TERRAIN_PLACEMENT_REVIEW_STATE.CANONICAL_APPROVED) return "CANDIDATE · confirmation 2/2 pending";
  if (status.state === TERRAIN_PLACEMENT_REVIEW_STATE.CANDIDATE) return "CANDIDATE · confirmation 1/2 pending";
  return "UNPREPARED";
}

