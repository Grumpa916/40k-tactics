# Deeper endgame review

The read-only review adds round-level combat totals, charge decisions and follow-through, mission action outcomes and linked attack evidence. It works during play and after completion. No additional player input is required.

## Evidence and coaching

- Round summaries show both players' recorded VP, entered damage, matched actual/expected damage, confirmed combat losses, charge outcomes and mission actions. Missing records remain unknown. Effective scoring excludes undone awards and adjustments.
- Charge attempts list measured distance, saved forecast, result and subsequent same-turn Fight attacks into the declared targets. Attached sources and Precision recipients remain distinguishable. Declines are excluded. An absent follow-up does not establish that the unit failed to fight.
- New charge events save a versioned probability snapshot from the existing Advisor model. Multiple targets use the farthest measured distance. Available modeled re-rolls assume use after a failure; neither actual re-roll use nor CP expenditure is inferred. No probabilities are reconstructed for older saves using the final roster.
- Coaching highlights saved charge chances below 50%, entered damage beyond remaining target wounds, and explicitly failed mission actions. Links open the supporting evidence. These are planning prompts, not grades of decision quality. Unknown ownership is excluded from side-specific attack-allocation advice.
- Existing score-gap, damage-outcome and confirmed-action lessons remain. Duplicate generic charge advice is suppressed when the saved-probability lesson is available. Up to six supported lessons are shown.
- Tables preserve stable duplicate unit labels from the complete roster. Round detail, action outcomes and attack evidence start collapsed to keep the tablet review manageable.

## Limits

No final-map replay, inferred missed VP, dice-luck verdict, or claim that an alternative target was legal. Entered damage may exceed the recorded wound pool; this does not model individual wound allocation. Actions are linked to mission references, while VP remain in the separate ledger. Current model availability does not establish what rules or re-rolls a player actually used.

## Architecture and checks

`endgame-evidence.js` owns evidence and coaching, `endgame-evidence-view.js` owns the new tables, and `charge-review-snapshot.js` captures charge forecasts. The shell and the live charge UI are unchanged.

Tests cover snapshot persistence and re-roll availability, multiple targets, legacy/malformed records, formation and Precision attribution, exact round/turn follow-through, missing comparisons, score undo, ownership, action confirmation, escaping, duplicate labels and evidence links. Existing completion and clock behavior remain covered by the original tests.
