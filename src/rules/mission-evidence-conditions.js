// Stable identifiers for machine-evaluable evidence. Text remains presentation.
const LEGACY_CONDITIONS = Object.freeze({
  'Control at least one non-home objective.': { type: 'control-non-home', minimum: 1 },
  'Control a non-home objective.': { type: 'control-non-home', minimum: 1 },
  'Per controlled non-home objective.': { type: 'count-non-home' },
  'Per controlled objective other than your home objective.': { type: 'count-non-home' },
  'Per objective controlled.': { type: 'count-objectives' },
  'Control more objectives than your opponent.': { type: 'control-more' },
  'Control two or more objectives.': { type: 'control-objectives', minimum: 2 },
  'Control three or more objectives.': { type: 'control-objectives', minimum: 3 },
  'Control four or more objectives.': { type: 'control-objectives', minimum: 4 },
  'Control at least one central objective.': { type: 'control-central', minimum: 1 },
  'You control your home objective.': { type: 'control-home', minimum: 1 },
  'Control your home objective.': { type: 'control-home', minimum: 1 },
  'Destroy at least one enemy unit this turn.': { type: 'destroy-enemy', minimum: 1 },
  'Per enemy unit destroyed this turn.': { type: 'count-destroyed' },
  'Control a non-home objective you did not control at the start of the turn.': { type: 'new-non-home-control', minimum: 1 },
  'Control at least one non-home objective you did not control at the start of the turn.': { type: 'new-non-home-control', minimum: 1 },
  'Destroy more enemy units this turn than friendly units lost last turn.': { type: 'kill-more-than-last-losses' },
  "Control the opponent's home objective.": { type: 'control-opponent-home', minimum: 1 },
  'Control the enemy home objective.': { type: 'control-opponent-home', minimum: 1 },
  'At least one condemned enemy unit left the battlefield this turn.': { type: 'condemned-left', minimum: 1 },
  'One or two objectives have been consecrated.': { type: 'consecrated-count', minimum: 1, maximum: 2 },
  'Three or more objectives have been consecrated.': { type: 'consecrated-count', minimum: 3 },
  'The enemy home objective has been consecrated.': { type: 'consecrated-opponent-home', minimum: 1 }
});
export function getMissionEvidenceCondition(summary) {
  return LEGACY_CONDITIONS[summary] ?? null;
}
