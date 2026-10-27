# Endgame context history

Objective-control confirmations retain previous control, round, turn and phase. Existing VP award confirmations save the contemporaneous objective state and its last confirmation time. Successful phase transitions save the outgoing battlefield state. Snapshots contain only unit identities, ownership, deployment status, explicit wounds/model counts/Battle-shock, approximate positions, and objective control. Unknown values are preserved; snapshots are detached from future state changes.

Live map corrections append one before/after position event per completed drop. They remain separate from movement declarations and do not consume movement or declare a charge. Existing turn-start snapshots and movement records remain available. Phase checkpoints and position records are shown in the review without determining movement legality or exact objective occupancy.

Attack events retain the already-computed forecast mean, aggregate target wound pool, destruction probability, target identity and contextual abilities, including range uncertainty, rerolls and applied rules. The distribution is computed once, and its full outcome array is not copied into history. Precision allocation remains explicit and separate from the forecast target. Incomplete profiles still permit manual actual damage; the forecast is null when unavailable.

The endgame review includes effective manual casualty records as well as combat destruction. New casualties have stable IDs, and undo refers to that ID, avoiding dependence on history indices after movement undo. Older undos use their available reference or most recent matching casualty. Round loss lists deduplicate unit identities. Model removals are not extra combat kills; manual entries have no inferred attacker.

Resource utilization uses existing CP gain/spend/adjustment records, Ka'tah expenditure/readiness restoration and recorded faction decisions. It reports recorded totals, current balance and reasons. Corrections are separate from spending. It does not infer stratagem identity, actual reroll use, unrecorded ability use or return on CP. It does not spend resources.

All detail sections start collapsed. No new player prompts, inputs or network calls are added during play. Capture occurs at successful actions and phase/scoring confirmations, never on pointer movement or render. Legacy records remain readable and no missing historical context is reconstructed from the final army. The shell is unchanged.

Checks cover objective timing and previous state, detached snapshots, phase transitions, map drops, actual attack forecast capture, casualty undo references, resource categories, escaping, legacy records and the existing charge drag workflow.
