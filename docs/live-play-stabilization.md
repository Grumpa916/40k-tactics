# Live-play stabilization

## Device recovery and startup

The integrated app mounts before the optional cloud SDK loads. Cloud connection
has an eight-second timeout and can be retried from **Phases & tools**.
Existing signed-in cloud roster and battle stores remain separate.

Accepted session changes are saved asynchronously to IndexedDB on this device.
The recovery store retains the latest snapshot and its preceding snapshot.
Updates during a write are coalesced, and the UI says saved only after the
transaction completes. Storage failures are visible and do not reject gameplay
actions. Save errors retry on later actions or Save on device now.

On launch, a valid stored snapshot prompts Resume battle or Use new session.
Nothing overwrites that snapshot before the choice. An unreadable/incompatible
snapshot is preserved until the player explicitly chooses a new session.
Restored clocks pause at their saved elapsed time; time away from the app is
not charged. Visibility/pagehide events request a final save, but a device crash
can still interrupt a pending transaction.
Concurrent windows cannot silently overwrite one another's recovery slot. If
another window writes first, saving reports a conflict until the player explicitly
chooses Use this window for device recovery. The other window will then see a
conflict on its next save.

This is recovery for the current session, not a permanent library of battles.
Keep important games in named cloud saves. There is no service worker or full
offline installation support yet; the app files still need to load. Browser
and Home Screen storage can differ. Do not clear site data as an update step.

## Live controls and corrections

Phases & tools shows device-save status and opens a combat-data report. It
offers cloud retry and the immediately preceding supported action's correction.
Shooting and Fight show a receipt with Undo after recording an attack.
Correction restores the prior action's state/history together, including damage
and mission-card effects. Clock totals are retained. A subsequent accepted action,
phase transition, or restored battle clears that correction; this is not a
multi-step time machine. Existing specialized score/casualty corrections remain.

HUD scores/clocks, phase menu and army dock use 44-pixel minimum touch heights.
The dock's reserved space is enlarged accordingly. Fight damage and recording
controls live in the panel footer. Shooting initially shows three comparison
cards with additional targets expandable; all targets remain in the selector.
Panel scroll positions and the expanded additional-target group survive updates.

## Calculations and data

Each target's existing distribution is passed from priority evaluation to the
comparison layer. Browsing targets with the same state and weapon reuses the
comparison. Accepted state changes or changed weapon inputs invalidate it.
The readiness report identifies missing baseline defenses, wounds, reviewed
loadouts, weapon characteristics, uncertain surviving weapon quantities and
stale rules-data stamps. It never prevents recording physical results and does
not claim to validate every special ability or modifier.

Supported mission evidence conditions are explicit identifiers on current
catalog entries. The legacy text-to-condition mapping exists only for older
saved cards. Unsupported conditions remain player-confirmed. Objective control
records the turn, round and phase of confirmation; evidence distinguishes
confirmations from this turn and carried-forward/undated control. No VP is
awarded automatically.

## Maintainability and testing

Command/faction reminder rendering and Shooting Advisor markup are extracted
from battle-shell.js and shooting-screen.js respectively. Persistence, recovery,
correction descriptions, startup and session tools each have their own module.

Automated checks cover recovery choice protection, fallback snapshots, failed
storage, pending writes, paused clocks, delayed/failed cloud startup, corrections
with real combat commands, structured evidence and view continuity.

Physical iPad validation remains necessary: PWA launch/resume, storage permission
behavior, 30-unit density, panel/dock fit, touch selection, and rotation. No
latency or memory performance numbers are claimed without device measurement.
