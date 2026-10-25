# V2 Architecture Policy

The V2 codebase must remain modular as live-play features expand.

## Battle shell boundary

`src/ui/battle-shell.js` is a top-level coordinator only. It may:

- choose and mount phase screens;
- coordinate shared shell chrome, side panels, overlays, and global navigation;
- pass session, perspective, game-data, and other shared dependencies into focused modules;
- coordinate behavior that genuinely spans multiple phases.

It must not become the default home for phase-specific state, rules, handlers, or rendering logic.

Before adding substantial behavior to `battle-shell.js`, prefer a focused module under `src/ui/`, `src/application/`, `src/engine/`, or `src/rules/` according to responsibility. Phase-specific interaction state belongs with that phase screen or a dedicated phase controller.

## Growth guardrails

- New rules logic belongs in `src/rules/` or `src/engine/`, not UI files.
- Session/application orchestration belongs in `src/application/`.
- Phase-specific rendering and touch interaction belong in the corresponding `src/ui/*-screen.js` module or a small extracted helper.
- Static catalogs belong in `src/data/`; large data files do not by themselves constitute an application monolith.
- `battle-shell.js` must remain at or below 50 KiB. `tests/ui/battle-shell-architecture.test.js` enforces this boundary in CI.
- When another UI file approaches roughly 50–60 KB, new feature work should normally include or precede an extraction unless the added code is purely declarative/static.
- `battle-shell.js` should not grow for a phase-local fix when the behavior can be implemented in the phase module.

## Battle shell shrink procedure

When shell work would push against the size boundary:

1. Identify the smallest cohesive responsibility that can leave the shell without changing behavior.
2. Extract rendering-only code first when possible; then controllers/handlers; leave only coordination and lifecycle wiring in the shell.
3. Preserve existing DOM contracts and data attributes so integration behavior remains unchanged.
4. Add or preserve focused tests for the extracted module and keep the shell size guard passing.
5. Do not offset shell growth with unrelated deletions. The extraction must move a real responsibility to a focused owner.
6. Treat a shell-size CI failure as an architecture failure: extract before merge rather than raising the limit.

Current examples include scoreboard/VP/CP presentation in `src/ui/battle-shell-scoreboard.js` and setup navigation labels in `src/ui/setup-navigation-labels.js`.

## Change review question

For every substantial feature, ask: **Does this behavior truly belong to the shell, or is the shell only coordinating a focused module that should own it?**

The default answer for Shooting, Movement, Charge, Fight, Command, Deployment, setup, Tactical Advisor calculations, scoring, and persistence is that the focused module owns the behavior and the shell coordinates it.
