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
- When a UI file approaches roughly 50–60 KB, new feature work should normally include or precede an extraction unless the added code is purely declarative/static.
- `battle-shell.js` should not grow for a phase-local fix when the behavior can be implemented in the phase module.

## Change review question

For every substantial feature, ask: **Does this behavior truly belong to the shell, or is the shell only coordinating a focused module that should own it?**

The default answer for Shooting, Movement, Charge, Fight, Command, Deployment, setup, Tactical Advisor calculations, scoring, and persistence is that the focused module owns the behavior and the shell coordinates it.
