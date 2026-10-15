import { getPlacementCandidateObservations as get24to33 } from "./event-companion-placement-candidate-observations-24-33.js";
import { getPlacementCandidateObservations as get34to43 } from "./event-companion-placement-candidate-observations-34-43.js";
import { getPlacementCandidateObservations as get44to53 } from "./event-companion-placement-candidate-observations-44-53.js";

export function getEventCompanionPlacementObservations(page) {
  const numeric = Number(page);
  if (numeric >= 24 && numeric <= 33) return get24to33(numeric);
  if (numeric >= 34 && numeric <= 43) return get34to43(numeric);
  if (numeric >= 44 && numeric <= 53) return get44to53(numeric);
  return Object.freeze([]);
}

export function listEventCompanionPlacementObservationPages() {
  return Array.from({ length: 30 }, (_, index) => index + 24);
}
