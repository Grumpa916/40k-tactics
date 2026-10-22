# 40K Tactics V2 Save Point — 2026-10-22

## Authoritative state
- Repository: `Grumpa916/40k-tactics`
- Authoritative branch: `main`
- Live app: `https://grumpa916.github.io/40k-tactics/battle.html`
- Target ruleset: Warhammer 40,000 11th Edition
- V1 reference only: `Grumpa916/onoforge40k` — do not modify
- Baseline commit: `f439e44514d0b79622287d116488e65bcaf4d82e`
- Latest merged work: PR #310 — **Optimize tabletop UI for iPad live play**
- Post-merge V2 Tests: green
- Post-merge GitHub Pages deployment: green

## Working rules
- Use focused feature branches + PRs.
- Never push production changes directly to `main`.
- Require green tests before merge and verify `main` tests + Pages after merge.
- Preserve working behavior unless the requested task explicitly changes it.
- Optimize for iPad landscape/tabletop use, large touch targets, minimal typing, and minimal live-game prose.
- Maps are approximate context only; the physical tabletop is authoritative.
- Keep scoring player-confirmed.
- Keep the app single-user oriented; avoid unnecessary account/multi-user complexity.

## Hosting / persistence
- GitHub is authoritative for source and production hosting.
- GitHub Pages is the primary live deployment.
- GitLab and Cloudflare are no longer required for active development.
- Supabase remains useful for authentication, saved rosters, and battle persistence.

## Completed systems and recent changes

### Missions and scoring
- Complete 18-card Secondary Mission catalog imported with timing/scoring/action metadata.
- Complete 5×5 directional Primary Mission matrix imported — 25 Primary Missions.
- Primary/Secondary mission details integrated into persistent mission displays and scoring checkpoints.
- Mission actions appear in Shooting where applicable.
- Primary and Secondary scoring remain player-confirmed.
- Scoring checkpoints display missions due at that timing.
- VP choices are constrained to scoring values actually offered by the mission.
- Primary/Secondary mission bars are expandable/collapsible.

### Scoreboard / CP / timers
- Persistent scoreboard tracks VP and CP.
- Score adjustment popup supports ±1 VP / ±1 CP and refreshes/closes correctly.
- +1 CP is automatically granted to both players when Command phase starts.
- Separate accumulated turn timers are shown for both players.

### Objectives
- Default state: Uncontrolled.
- Tap cycle: Uncontrolled → My Army → Opponent → Contested → Uncontrolled.
- Blue = My Army, red = Opponent, yellow = Contested, gray = Uncontrolled.
- Live labels: My Home, Opponent Home, My Expansion, Opponent Expansion, Center 1, Center 2 as applicable.
- Expansion naming corrected so there is one My Expansion and one Opponent Expansion.

### Setup / deployment
- Select Armies dark-themed and stripped of redundant explanatory text.
- Battlefield layout selection uses compact Layout A/B/C previews.
- Layout previews are glance-level rather than full-size maps.
- Declare Battle Formations removed from the visible setup flow.
- Deployment + reserves combined into streamlined Deploy & Begin.
- Reserve display compacted to one line per unit where practical.

### Command
- Uses the large live-map workspace.
- Actual tracked CP shown.
- Secondary mission entry uses active player automatically.
- Manual card-name field removed; mission catalog used instead.
- Manual scoring-checkpoint selector removed; timing comes from mission/checkpoint data.
- Battle-shock toggle lives on army list, not unit-detail page.

### Movement
- Large live map.
- Map zoom/fit controls removed.
- Scoring Check button removed.
- Undo / Reset Position after movement.
- Explicit **Did Not Move · Heavy** state for `[HEAVY]` calculations in Shooting.
- Minimal control intent: Did Not Move, Normal Move, Advance, Fall Back, Undo.

### Shooting
- Enemy target selection repaired and iPad-verified.
- Action → Shoot restoration repaired and iPad-verified.
- Map banner/zoom clutter removed.
- Tactical Advisor shows compact target comparison before detailed selected-target analysis.
- Selecting a target brings advisor content into view.
- Actual damage uses quick entry, not dice-by-dice logging.

### Charge
- Map zoom/fit controls removed.
- Added **Do not charge** as a valid per-unit resolution.
- Physical/tabletop charge measurement and legality remain authoritative.

### Fight
- Map zoom/fit controls removed.
- Friendly selected fighter name = blue; opponent selected fighter name = red.
- Fights First / Remaining Combat behavior preserved.
- Minimal event entry remains attacker → weapon → target → actual damage.

## PR #310 — Tabletop UI optimization
PR #310 formalized the live-play UI strategy:
- compact live HUD for round/phase, per-player VP/CP, and individual timers
- phase browsing behind compact controls rather than a large persistent row
- **Tabletop** = maximum battlefield, minimal prose/chrome
- **Overview / Review** = mission text, history, references, corrections, detailed advisor data
- compact expandable mission bars that surface mission identity while closed
- battlefield receives roughly 70–75% of live workspace
- narrower, context-driven right-side control panel
- smaller My Army / Opponent / Log dock
- repeated live instructional prose removed
- compact objective labels and clearer marker status language
- Movement simplified to action buttons + undo
- Shooting advisor presents target comparison first, selected-target detail second
- Charge copy minimized
- Fight ordering made more scanable with blue/red ownership cues
- no game-rule transitions or scoring authority moved into presentation code

## UX principles to preserve

### Tabletop mode
- maximum battlefield
- minimal prose
- compact persistent chrome
- large touch targets
- context-driven controls
- only current-action information

### Overview / Review mode
- full mission text
- scoring/history
- event log
- unit/reference detail
- correction workflows
- detailed Tactical Advisor data

Do not allow Tabletop mode to gradually accumulate Review-mode information.

## Immediate next task
Perform iPad verification of current `main` / PR #310:
1. compact HUD saves vertical space and remains readable
2. VP, CP and timer controls open independently and correctly
3. phase navigation remains accessible without covering live controls
4. Primary/Secondary bars open/close reliably and identify active missions while closed
5. bottom dock is smaller but still easy to tap
6. Movement Did Not Move / Undo still works
7. Shooting comparison → selected-target advisor remains readable with limited scrolling
8. Charge Do Not Charge and phase completion work
9. Fight ordering and blue/red ownership cues remain correct
10. objective labels/states remain clear without obscuring terrain
11. Overview/Review still exposes detailed mission/history/reference information
12. no regressions in phase progression, scoring, CP, timers, save/resume, or map interaction

Any issues found during iPad verification should be handled as focused follow-up fixes rather than another broad redesign.

## Continuation prompt
> Continue my Warhammer 40K Tactics V2 project from `docs/save-points/2026-10-22-tabletop-ui-optimization.md`.
>
> Repository: `Grumpa916/40k-tactics`
> Authoritative branch: `main`
> Baseline commit: `f439e44514d0b79622287d116488e65bcaf4d82e`
> Latest merged work: PR #310, the iPad Tabletop UI optimization pass.
>
> Do not restart or redesign completed work. V1 (`Grumpa916/onoforge40k`) is reference-only. Continue with focused feature branches/PRs and require green tests before merge.
>
> First task: continue iPad verification of the optimized Tabletop UI and address any regressions I report. Preserve the design split: Tabletop = maximum battlefield/minimal live controls; Overview/Review = detailed information. Continue autonomously unless my input is genuinely required.
