/**
 * Live manual mission scoring: checkpoint forms, score dialogs, and VP entry.
 * Set this to true to show those controls again. Scoring rules and saved history stay either way.
 */
export const MANUAL_SCORING_ENABLED = false;

let manualScoringOverride;
export function isManualScoringEnabled() {
  return manualScoringOverride ?? MANUAL_SCORING_ENABLED;
}

/** Tests only. Pass undefined to follow MANUAL_SCORING_ENABLED. */
export function setManualScoringEnabledForTests(value) {
  manualScoringOverride = value;
}
