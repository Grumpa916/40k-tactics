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
