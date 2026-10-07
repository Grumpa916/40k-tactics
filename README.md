# 40K Tactics

A clean-room V2 rebuild of the OnoForge 40K application.

## Architecture

```text
UI / Views
    ↓
Application Layer — commands / validation / workflows
    ↓
Game Engine — phases / turns / units / combat / objectives / timers / undo
    ↓
Game State — state transitions / history
    ↓
Rules & Data — rules / units / weapons / missions / BSData
```

The engine is browser-independent. UI code consumes application commands and rendered state; core game rules do not depend on the DOM.

## Development status

Phase 1: architecture foundation.

V1 reference: `Grumpa916/onoforge40k`. V1 remains independently maintained and is not modified by this repository.
