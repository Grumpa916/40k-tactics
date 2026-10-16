# Live-Play UI Design Requirements

Last updated: 2026-10-12

This document records agreed design requirements from the Warmind UI/UX comparison. Warmind is a reference for information hierarchy and interactions, not a visual template.

## Responsive battle shell

- Use a landscape-first, responsive three-column layout where width permits.
- The center column is the active phase workspace and must gain width when a side panel collapses.
- Left and right panels collapse independently.
- Start with the left battle-status panel collapsed to a narrow rail on wide screens, while keeping score/CP summary available in the persistent battle header as that header is implemented.
- The right reference panel defaults open; Stratagems is expanded first, with Army Rules, Detachments, and Terrain Layout independently expandable.
- When the viewport is too narrow, panels should collapse or stack rather than make text and touch targets too small.
- Keep persistent My Army and Opponent Army controls at the bottom; opening an army list must not lose the current phase context.

## Unit Status and event history

- Use Unit Status rather than a Destroyed Units-only panel.
- Show destroyed, reserves/on-battlefield, and currently Battle-shocked states.
- Distinguish Battle-shock tests known to be due from units whose strength data is insufficient to determine eligibility automatically.
- In 11th Edition Command Phase, a unit requires a Battle-shock test if it is currently Battle-shocked or at/below half-strength. A passing test clears the Battle-shocked condition; a failed test applies it.
- Record the player's test outcome, not the individual dice, and append a typed event to authoritative history.
- Event Log should summarize important phase/turn transitions, activations, combat results and actual damage, Battle-shock outcomes, CP changes, objective control, and VP awards/adjustments. Keep a useful recent view with access to older events.

## Rules and reference panel

- Stratagems should be phase-aware and distinguish the player's options from the opponent's options.
- Show cost, timing, restrictions, and eligibility reasons where the underlying data supports them; do not imply that listed means currently usable.
- Army Rules and Detachments should be available for both players, especially when the opponent's army is unfamiliar.
- Terrain layout and map references are secondary to the active phase.
- Missing rules data should be labelled as unavailable, never fabricated.

## Decisions and scoring

- Use contextual reminder/decision sheets for required choices, relevant faction abilities, mission events, and scoring checkpoints.
- Base faction reminders on the selected battle roster, detachment, available datasheet abilities and recorded battle history; do not infer faction abilities solely from unit names.
- Invasion Fleet Hyper-adaptations are an opening Round 1 choice and must be recorded once for the battle.
- Shadow in the Warp can be offered during either player's Command Phase only when a deployed unit on the perspective player's roster has that ability and it has not already been used. Recording its use must not roll or resolve enemy Battle-shock tests automatically.
- Mission sections should be compact and independently collapsible by section and player.
- Trigger scoring prompts at the mission's configured timing (Command Phase, own end-of-turn, opponent end-of-turn, or end of battle).
- Show criteria and calculated/confirmed score; only award VP after player confirmation and ledger validation.
- Don't create a parallel scoring system. Extend the existing mission/scoring coordinator and VP ledger.

## Clock

- Add a persistent Turn Clock control available from every phase.
- Track each player's elapsed turn time separately.
- Start, pause, and resume must not lose accumulated time.
- Switch the active clock on player-turn transitions, not phase transitions.
- Preserve clock state through battle save/restore. Countdown limits/warnings can be a later enhancement.

## Delivery constraints

- Implement incrementally on feature branches; do not modify main directly.
- Reuse existing game state, event history, mission timing, and scoring infrastructure.
- Do not infer legal state from rough map coordinates.
- Do not claim CI green until the actual workflow reports success.


## Setup navigation update

- Split setup into four focused workspaces in this order: Account & Saves, Army Builder, Pre-game, and Mission & Map.
- Keep the top tab navigation and a bottom Continue action visible during setup so iPad users do not need to scroll back to the top.
- Keep mission readiness visible in Pre-game; place detailed standard procedures and conditional ability guidance in collapsible sections.
- Tab switching changes only the viewed workspace and must preserve roster edits and battle state.
- Army roster detachment is saved explicitly. Only reviewed detachment options are offered as named choices; unsupported choices can be entered as printed text without inventing rules.
- The Turn Clock starts when the first player turn begins, remains running across phase changes, and switches player at turn boundaries.


## Tyranid detachments (11th edition)
- Army Builder's Tyranid detachment selector lists all ten detachments currently published for the 11th edition faction pack: Ambush Predators, Assimilation Swarm, Crusher Stampede, Invasion Fleet, Subterranean Assault, Synaptic Nexus, Talons of the Norn Queen, Unending Swarm, Vanguard Onslaught, and Warrior Bioform Onslaught.
- Each option displays its Force Disposition and Detachment Point (DP) cost. These are army-building reference labels, not an automated army legality validator.
- Rules reference: Games Workshop's [June 2026 Xenos Faction Pack announcement](https://www.warhammer-community.com/en-gb/articles/fchkklcq/new40k-download-new-xenos-faction-packs-today/) and current [Munitorum Field Manual Tyranids page](https://mfm.warhammer-community.com/en/tyranids). 40k.app is a secondary discovery/reference source; it is not the authority for rules wording.
- When a detachment's current rules or costs are not reviewed in the local rules data, show the official published name/disposition/DP for selection but do not invent enhancements, stratagems, or ability text.

## Reviewed setup flow from V1

V1's setup UI in `Grumpa916/onoforge40k/index.html` provides examples of the complete pre-battle sequence. V2 should keep the same information discoverable but align it to current 11th-edition data and the V2 state model:

1. **Account & Saves:** sign in before opening saved army lists or cloud battles.
2. **Army Builder:** edit, name, and save each roster, then assign it explicitly to Your army or Opponent army. Both players must have an assigned roster before setup can proceed.
3. **Pre-game:** choose the Attacker, derive the Defender as the other army, and record Who Goes First. Run the fixed procedure reminders and verify both armies have units.
4. **Mission & Map:** resolve the two Primary Missions from the selected Force Dispositions and choose the verified Event Companion layout. Select the battle-wide secondary mode here; Fixed cards are recorded here before deployment.
5. **Deployment:** deploy or declare each non-destroyed unit in reserves. The First Player selection should be prefilled from Pre-game while still allowing correction at the deployment checkpoint.
6. **Command phase:** make secondary card entry conspicuous. For Tactical mode, record the two physical cards drawn for the active player during each Command phase; this is card tracking, not automatic drawing or scoring.

V1 explicitly separates Attacker, Defender, and Who Goes First; offers Fixed/Tactical secondary mode and player-specific card entry; and uses named objective identities. Keep those workflow affordances without copying outdated rules text.

### Objective identities and layout changes

- The verified Event Companion map catalog is authoritative for the available marker names and coordinates. Five-marker layouts have two home objectives, one central objective, and two expansion objectives.
- Six-marker layouts must have **Central 1** and **Central 2**, as well as **Attacker Home**, **Defender Home**, and **Expansion 1/2**. Never substitute a generic home marker for a missing central identity.
- When switching layouts, reconcile canonical layout-linked objective records to the selected geometry; remove stale canonical markers that do not exist on the new layout while preserving unrelated/manual records.
- The map remains approximate context only. It does not infer objective control, line of sight, distances, or rules legality.
