# 40K Tactics V2 Save Point — 2026-10-22

## Authoritative repository state

- Repository: `Grumpa916/40k-tactics`
- Authoritative branch: `main`
- Live app: `https://grumpa916.github.io/40k-tactics/battle.html`
- Target ruleset: Warhammer 40,000 11th Edition
- V1 reference only: `Grumpa916/onoforge40k` — do not modify
- Current `main` baseline: `f439e44514d0b79622287d116488e65bcaf4d82e`
- Latest merged work: PR #310 — **Optimize tabletop UI for iPad live play**
- Post-merge V2 Tests: green
- Post-merge GitHub Pages deployment: green

## Current project operating rules

- Work from `main` using focused feature branches and PRs.
- Never push production changes directly to `main`.
- Run/verify tests before merge, then verify `main` tests and GitHub Pages deployment.
- Preserve working behavior unless the requested task explicitly changes it.
- Optimize primarily for iPad landscape/tabletop use, large touch targets, minimal typing, and minimal live-game prose.
- Keep the app single-user oriented; do not add unnecessary account/multi-user complexity.
- Keep maps approximate context only, not authoritative tabletop measurement tools.

## Migration / hosting state

The application has been migrated back to GitHub/GitHub Pages and development has resumed there.

- GitHub is the authoritative source and production host.
- GitLab is no longer required for active development.
- Cloudflare is no longer required for the primary live app.
- Supabase remains useful for authentication, saved rosters, and battle persistence.

## Major completed work in this development session

### Mission data and scoring

- Complete 18-card 11th-edition Secondary Mission catalog imported.
- Complete 5×5 directional Primary Mission matrix imported — 25 Primary Missions.
- Primary/Secondary details integrated into persistent mission displays and scoring checkpoints.
- Mission actions are available where appropriate in Shooting.
- Secondary scoring remains player-confirmed.
- Primary scoring remains player-confirmed.
- Scoring reminders now display mission conditions relevant to the current scoring checkpoint.
- VP dropdowns are constrained to scoring values actually offered by the mission rather than generic 1–15 VP options.
- Primary/Secondary summary bars are expandable/collapsible.

### Scoreboard, CP, timers

- Persistent top scoreboard shows current VP and CP.
- Score adjustment popup supports ±1 VP / ±1 CP and correctly refreshes/closes.
- +1 CP is automatically granted to both players when a Command phase starts.
- Separate accumulated turn timers are shown for both players.
- Score/CP/timer interactions were consolidated into the tabletop HUD in PR #310.

### Objective control

- Objective control defaults to Uncontrolled.
- Tapping an objective cycles:
  - Uncontrolled
  - My Army
  - Opponent
  - Contested
  - Uncontrolled
- Objective colors:
  - blue = My Army
  - red = Opponent
  - yellow = Contested
  - neutral/gray = Uncontrolled
- Live labels resolve to compact logical identities such as My Home, Opponent Home, My Expansion, Opponent Expansion, Center 1, Center 2.
- Expansion naming was corrected so there is one My Expansion and one Opponent Expansion where applicable.

### Setup / deployment

- Select Armies screen cleaned up and dark-themed.
- Redundant explanatory text removed from Step 1.
- Battlefield layout selection shows Layout A/B/C previews with compact selection controls.
- Layout preview maps were drastically reduced for glance-level comparison.
- Declare Battle Formations page removed from the visible setup flow.
- Deployment + reserves are combined into the streamlined Deploy & Begin flow.
- Reserve list display is compact, one line per unit where practical.

### Command phase

- Command phase uses the large live-map workspace.
- Command CP display now uses actual tracked values.
- Secondary entry automatically uses the active player.
- Manual card-name entry removed; mission catalog is used instead.
- Card scoring checkpoint selector removed; scoring timing is driven by the checkpoint system.
- Battle-shock control is available from the army list rather than individual unit-detail pages.

### Movement phase

- Movement uses the large live map.
- Map zoom/fit controls removed from Movement.
- Scoring Check button removed.
- Added Undo / Reset Position after movement.
- Added explicit **Did Not Move · Heavy** state for Shooting `[HEAVY]` calculations.
- Movement controls are intended to remain minimal: Did Not Move, Normal Move, Advance, Fall Back, Undo.

### Shooting phase

- Enemy target selection and Action → Shoot restoration repaired and iPad-verified.
- Map banner/zoom clutter removed.
- Map gets more usable area.
- Tactical Advisor target comparison is shown before detailed selected-target analysis.
- Selecting an enemy target brings Tactical Advisor content into view.
- Actual damage remains quick-entry rather than dice-by-dice entry.
- Shoot / Action / Skip behavior remains supported.

### Charge phase

- Map zoom/fit controls removed from Charge.
- Added **Do not charge** as a valid per-unit resolution.
- Charge remains based on tabletop-measured/rolled distance; app records useful state without becoming authoritative for movement legality.

### Fight phase

- Map zoom/fit controls removed from Fight.
- Friendly selected unit names display blue; opponent selected unit names display red.
- Fights First and Remaining Combat logic preserved.
- Fight records attacker → weapon → target → actual damage with minimal input.

### Tabletop UI optimization — PR #310

PR #310 formalized the live-play presentation strategy:

- compact live HUD for round/phase, per-player VP/CP and individual timers
- phase browsing moved behind a compact control rather than a large persistent row
- Review/Overview is the information-heavy surface; Tabletop is the live-play surface
- compact expandable Primary/Secondary mission bars, including active mission names when closed
- battlefield receives roughly 70–75% of the live workspace by default
- narrower, context-driven right-side controls
- smaller bottom My Army / Opponent / Log dock
- repeated instructional prose removed from live combat workspaces
- compact objective labels and stronger status-language for markers
- Shooting advisor prioritizes target comparison first, detailed target analysis second
- Fight ordering is more scanable with friendly/opponent color cues
- no game-rule transitions or scoring authority were moved into presentation code

## Core UX principles now considered authoritative

### Tabletop mode

Default during live play:

- maximize battlefield size
- minimal prose
- compact persistent chrome
- large touch targets
- context-driven side controls
- show only information needed for the current action

### Review / Overview mode

Use for deeper information:

- full mission text
- scoring history
- event log
- unit status/reference detail
- correction/review workflows
- expanded Tactical Advisor details

Do not let live Tabletop mode gradually accumulate Review-mode information.

## Known design preferences to preserve

- iPad landscape is the primary test device.
- Avoid numeric keyboard entry when quick buttons can do the job.
- Do not record every dice roll.
- Map positions are approximate and have uncertainty; physical tabletop state is authoritative.
- Both players should remain visible simultaneously where practical.
- Army list is a compact reference with tap-to-expand unit details.
- Destroyed/battle-shocked/reserve/deployed states should be visually obvious but not consume excessive space.
- Manual confirmation remains preferred for VP/scoring outcomes.

## Immediate next task

**iPad verification of PR #310 / current `main`.**

Verify these areas in a normal game flow:

1. compact live HUD uses less vertical space and remains readable
2. VP, CP, and timer controls open the correct controls independently
3. phase navigation remains accessible without covering live controls
4. Primary/Secondary closed bars show useful mission identity and open/close reliably
5. bottom My Army / Opponent / Log dock is smaller but still easy to tap
6. Movement remains fast and the Did Not Move / Undo behavior still works
7. Shooting target comparison and selected-target advisor flow are readable without excessive scrolling
8. Charge Do Not Charge works and Charge phase can complete correctly
9. Fight Fights First / Remaining ordering remains correct and blue/red ownership cues are readable
10. objective labels and state colors remain clear without covering terrain
11. Overview/Review still exposes the fuller mission/history/reference information
12. no phase progression, scoring, CP, timer, save/resume, or map interaction regressions

Any issues found during iPad verification should be handled as focused follow-up fixes rather than another broad redesign.

## Suggested continuation prompt

> Continue my Warhammer 40K Tactics V2 project from the October 22, 2026 save point in `docs/save-points/2026-10-22-tabletop-ui-optimization.md`.
>
> Repository: `Grumpa916/40k-tactics`
> Authoritative branch: `main`
> Baseline commit: `f439e44514d0b79622287d116488e65bcaf4d82e`
> Latest merged work: PR #310, the iPad Tabletop UI optimization pass.
>
> Do not restart or redesign completed work. V1 (`Grumpa916/onoforge40k`) is reference-only. Continue with focused feature branches/PRs and require green tests before merge.
>
> First task: perform/continue iPad verification of the optimized Tabletop UI and address any regressions I report. Preserve the design split: Tabletop = maximum battlefield/minimal live controls; Overview/Review = detailed information.
>
> Continue autonomously unless my input is genuinely required.
