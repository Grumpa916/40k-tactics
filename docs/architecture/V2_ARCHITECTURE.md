# 40K Tactics V2 Architecture

## Core boundary

The game engine is independent of browser APIs and presentation.

User action -> Command -> Validation -> State transition -> Event/history -> UI update

## Ownership rules

1. Game state has explicit ownership.
2. Commands request changes; they do not mutate arbitrary shared state.
3. Rules live in engine/rules modules, not renderers.
4. Events record meaningful state transitions and gameplay actions.
5. Randomness will be centralized and replayable.
6. Undo/replay will operate from explicit state/history contracts.
7. Infrastructure adapters such as Supabase remain outside the engine.
8. Browser/UI code may depend on the application layer, but the engine must not depend on DOM APIs.

## Rules edition

V2 targets the Warhammer 40,000 11th edition core rules. V1 remains a behavioral reference, but any behavior carried forward must be checked against the V2 edition target.

## Battle round and turn flow

A battle round contains a start-of-round step, both players' turns, and an end-of-round step. Each player's turn contains a start-of-turn step, the five ordered phases, and an end-of-turn step:

1. Start of Turn
2. Command
3. Movement
4. Shooting
5. Charge
6. Fight
7. End of Turn

The mission selects the first player for the battle round. After that player's turn ends, the opponent takes a turn. Once both turns end, the battle round ends and the next round begins.

The engine records round and turn boundaries as events. `changePhase` advances one step at a time; `endTurn` records the next player; `advanceBattleRound` starts the next round with the first player.

## Movement model

A Normal Move is a command resolved during the Movement phase for a deployed unit owned by the active player. The unit holds individual model positions, and each model uses its own Movement characteristic when one is available; otherwise it inherits the unit profile's characteristic. This supports different movement values within one unit, including an attached Leader, without implementing attachment and detachment rules in this slice.

The command supplies a destination for each model. The engine validates each model's displacement, updates positions, and records the from/to positions and distance in history. A UI may show a temporary drag path, but the core game state does not store or replay the path.

This first movement slice does not model terrain, base shapes, engagement range, or unit coherency.
## Charge result recording

During the Charge phase, the engine records the active player's reported outcome. A successful outcome includes the enemy targets selected after the physical roll; a failed attempt has no targets. The engine does not generate dice or simulate the charge move.

## V1 relationship

Grumpa916/onoforge40k is the behavioral reference and regression oracle.

A V2 behavior difference must be classified as:
- V2 defect
- V1 defect
- intentional V2 improvement

V1 code is not copied into the engine merely to reproduce its architecture.

## Initial domain boundaries

- setup
- deployment
- phases and turns
- units
- movement
- shooting
- fight/combat
- objectives
- missions
- stratagems and command points
- reserves
- timers
- undo/history
- tournament lifecycle
- tactical advisor
