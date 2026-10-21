# Mission actions and scoring checkpoints

- Shooting Action choices come from the active player's active secondary instances, including retained Tactical cards. The production demo's unrelated sample Cleanse action has been removed.
- The player checks physical-card action eligibility and selects/accepts the review timing. This is required because several catalog entries remain explicitly unverified, and an active secondary does not by itself establish that it uses a Shooting Action. Custom standalone-demo actions remain unlinked.
- Recording an attempt uses the existing Shooting activation command and adds the exact secondary instance, mission name/definition, optional objective and review checkpoint to its history event. It consumes the unit's Shooting choice, awards no VP and does not complete/discard the card.
- Linked attempts appear at the saved review checkpoint. The player confirms completed or not completed, creating an immutable review event. The mission score remains a separate, player-confirmed ledger operation. No map-based action legality or completion is inferred.
- At end of Command, the active player's due windows are reviewed. At entry into end-of-turn, both the active player's end-of-turn windows and the other player's end-of-opponent-turn windows are shown before changing player/round. There is no duplicate late opponent-turn popup after advancing the turn.
- Independent Fixed/Tactical modes, minimum rounds and owned Primary definitions are respected by the checkpoint evaluator. Unknown Primary timing/conditions remain physical-card references; existing configured definitions are used when supplied.
- Popup rows update after confirming actions. The phase bar's Scoring check button reopens the checkpoint during Movement/end-of-turn. Pending attempts and review outcomes survive save/resume; reopening a checkpoint does not award points or repeat confirmations.
- Review scoring buttons select the relevant player/checkpoint in the existing Command review screen. Award forms keep the existing manual confirmation, ledger caps and Tactical/Fixed lifecycle behavior.
- Checkpoint transition selection, dialog rendering, action state and picker behavior live in focused modules. The shell coordinates them and is smaller than before this change.

Validation includes active/foreign card selection, explicit eligibility confirmation, persisted attempt/review state, wrong-window rejection, independent modes and minimum rounds, simultaneous own/opponent end-turn reminders, and dialog refresh/reopen. Physical iPad acceptance is still required.
