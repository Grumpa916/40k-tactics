// Stable identifiers for machine-evaluable evidence. Text remains presentation.
const LEGACY_CONDITIONS = Object.freeze({
  'Control at least one non-home objective.': { type: 'control-non-home', minimum: 1 },
  'Control a non-home objective.': { type: 'control-non-home', minimum: 1 },
  'Per controlled non-home objective.': { type: 'count-non-home' },
  'Per objective controlled.': { type: 'count-objectives' },
  'Control more objectives than your opponent.': { type: 'control-more' },
  'Control two or more objectives.': { type: 'control-objectives', minimum: 2 },
  'Control three or more objectives.': { type: 'control-objectives', minimum: 3 },
  'Control four or more objectives.': { type: 'control-objectives', minimum: 4 },
  'Control at least one central objective.': { type: 'control-central', minimum: 1 },
  'Destroy at least one enemy unit this turn.': { type: 'destroy-enemy', minimum: 1 },
  'Per enemy unit destroyed this turn.': { type: 'count-destroyed' }
});
export function getMissionEvidenceCondition(summary) {
  return LEGACY_CONDITIONS[summary] ?? null;
}
