# Scripted Full-Game Verification Pass

Use the dedicated verification preset rather than a normal saved battle. The preset exists to exercise as many V2 systems as possible with a repeatable configuration.

## Preset URL

After this feature is merged, open:

`battle.html?verification=full-game`

Normal `battle.html` is unchanged.

## Preloaded configuration

### Your army — Adeptus Custodes

- Battle size: **Strike Force — 2,000 points cap**
- Detachment: **Guardians of the Throne**
- Force Disposition: **Purge the Foe**
- Tactical secondaries
- Attacker: **You**
- First player is intentionally left unset so the first-player control is still tested.

Roster:
- Trajann Valoris — attached to Custodian Wardens
- Custodian Wardens
- Blade Champion — attached to Custodian Guard Sodality
- Custodian Guard Sodality
- Allarus Custodians
- Venatari with Verutum Lances
- Telemon Heavy Dreadnought
- Contemptor-Galatus Dreadnought
- Prosecutor Squad

### Opponent — Tyranids

- Detachment: **Vanguard Onslaught**
- Force Disposition: **Reconnaissance**
- Tactical secondaries
- Defender: **Opponent**

Roster:
- Neurotyrant
- Winged Tyranid Prime — attached to Hormagaunts
- Hormagaunts
- Termagants
- Norn Emissary
- Exocrine
- Zoanthropes
- Deathleaper
- Gargoyles
- Trygon

### Mission setup

- Layout: **A**
- Your Primary: **Consecrate**
- Opponent Primary: **Triangulation**
- Both sides: Tactical secondaries
- A deployment plan is preloaded for both armies; actual deployment is still left for the test so deployment/reserve controls are exercised.

## Test rules

- Use the preset only for acceptance testing; do not overwrite a real saved battle with it.
- Record actual damage with the app controls; do not try to reproduce exact dice probabilities.
- The physical tabletop remains authoritative for distances and line of sight. For this scripted pass, use the approximate map positions as the agreed test distances.
- When the script asks you to intentionally enter a wrong value, immediately test Undo/correction afterward.
- If a requested interaction is unavailable, stop only long enough to record the defect; continue the game if the rest of the workflow is still usable.

---

# Stage A — Startup, army selection and setup

## A1. Load the verification preset

1. Open the verification URL.
2. Confirm the app loads directly into Setup without a startup error.
3. Confirm the existing account/cloud controls still load normally.
4. Confirm the preset is not automatically written over a saved battle.

**Pass:** the verification battle appears as a separate setup state and normal saves remain untouched.

## A2. Verify army selection

Open **Step 1 · Select Armies**.

Confirm:
- Your roster is the Custodes verification roster.
- Opponent roster is the Tyranid verification roster.
- Battle size is Strike Force / 2,000.
- Guardians of the Throne is visible for Custodes.
- Vanguard Onslaught is visible for Tyranids.
- Unit counts, points, and factions render without missing/undefined values.
- Open Trajann, the Telemon, the Norn and the Exocrine reference details and verify stats/weapons display.
- Verify Trajann → Wardens and Winged Prime → Hormagaunts attachment information is visible.

**Pass:** both roster snapshots and detachment selections are correctly represented without manual roster loading.

## A3. Verify mission/disposition setup

Open **Step 2 · Prepare Game**.

Confirm:
- Your Force Disposition = Purge the Foe.
- Opponent Force Disposition = Reconnaissance.
- Your Primary resolves to Consecrate.
- Opponent Primary resolves to Triangulation.
- Both players show Tactical secondary mode.
- Layout A is selected.
- Planning map contains both armies and can be moved.

Move one Custodes planning marker and one Tyranid planning marker, then move them back approximately.

**Pass:** map dragging works and the Primary names remain unchanged.

## A4. Terrain setup

1. Open the terrain setup reference.
2. Expand to fullscreen.
3. Verify Event Companion terrain measurements are visible, readable and do not show units.
4. Exit fullscreen.

**Pass:** fullscreen opens/closes, terrain is usable for setup, and unit markers are absent from the terrain-placement reference.

## A5. Roles / first player

1. Verify **You = Attacker** and Opponent = Defender.
2. At the first-player checkpoint select **You** as first player.
3. Confirm active-player styling follows the selected first player.

**Pass:** attacker/defender and first player persist after changing screens.

## A6. Reserves and deployment

Declare these as reserves:
- Custodes: **Allarus Custodians**, **Venatari with Verutum Lances**.
- Tyranids: **Gargoyles**, **Trygon**.

Then:
1. Import/use the preloaded deployment plan for the remaining units if the deployment workspace offers that option.
2. Drag at least one friendly and one opponent unit to a new position.
3. Move one unit into the reserve tray and back if allowed before confirming deployment.
4. Confirm reserved units are not shown as deployed on the live map.
5. Begin Round 1.

**Pass:** both armies have correct deployed/reserve states and opponent markers can be moved during setup.

---

# Round 1 — Core phase workflow

## Command phase

Select Tactical secondaries:
- **Cleanse**
- **A Tempting Target**

Check:
1. Round/active player/VP/CP display.
2. Martial Ka'tah readiness appears for eligible Custodes units.
3. Primary and both secondary cards are visible in the mission review.
4. Collapse and expand Martial Ka'tah and mission panels, then perform another action; their open/closed state must persist.
5. Verify any stratagem opportunity is shown before ordinary rule reminders.

**Pass:** command information survives rerenders and the secondary cards are active.

## Movement phase

Perform three different movement choices:
- Telemon: **Stationary**.
- Custodian Guard formation: **Normal Move** toward a non-home objective.
- Prosecutors: **Advance** toward another objective.

Also:
- Drag the live-map markers to match the agreed approximate positions.
- Confirm Tactical Advisor movement destinations use the same numbered objective labels as the map.
- Toggle one friendly unit Battle-shocked, verify its badge/OC treatment, then clear it before Shooting.

**Pass:** all movement types record separately, marker positions persist and the Advisor/map labels agree.

## Shooting phase

Exercise four paths:
1. **Telemon** shoots the Norn Emissary. Record a non-zero actual damage result.
2. Use a unit with multiple ranged profiles to test weapon selection/split-fire if available.
3. Use an eligible unit to start **Cleanse** instead of shooting.
4. Choose **Not Shoot** with one otherwise eligible unit.

Check:
- target selection is at the top of the right panel;
- expected damage/advisor information appears;
- target filtering respects approximate range;
- Next Phase becomes green when the phase is eligible to advance;
- units with no ranged weapon do not block phase completion.

**Pass:** Shoot / Action / Not Shoot all coexist without trapping the phase.

## Charge phase

1. Select Blade Champion/Guard formation as a charger.
2. Select a Tyranid target from the map.
3. Record a measured charge distance of **7 inches** and a success.
4. With the Galatus, record a longer charge and exercise the charge re-roll/result controls if offered.
5. Move successful chargers on the live map.

**Pass:** measured charge, target, result and map position persist into Fight.

## Fight phase

1. Activate the successful charging formation first.
2. Select melee weapon and target.
3. Record actual damage.
4. Record the opponent fight-back.
5. Activate another eligible unit to verify already-activated units cannot be selected again.
6. Verify Fights First/charge status badges and friendly markers remain visible above overlapping enemy markers.

**Pass:** activation order, damage, casualties and status markers survive rerenders.

## End of your turn

1. Complete/review Cleanse.
2. Review A Tempting Target and choose the appropriate score rather than automatically taking the maximum.
3. Use the objective-control popup to record OC/controllers.
4. Review Consecrate Primary opportunities if a qualifying destruction occurred near an objective.
5. Confirm scored secondary cards retire correctly.

**Pass:** scoring is player-confirmed and no card can be scored twice.

## Opponent Turn 1

Record opponent activity rather than skipping it:
- Move at least two Tyranid units on the map.
- Exocrine shoots Telemon; record actual damage.
- Zoanthropes shoot a Custodes unit; record actual damage.
- Charge with Hormagaunts or Norn if eligible.
- Record opponent Fight damage.
- Mark one Custodes unit Battle-shocked during the opponent turn, verify the badge, then leave it active until your next Command phase.

**Pass:** opponent-turn damage, positions, charge/fight history and Battle-shock remain visible on your next turn.

---

# Round 2 — Tactical redraw, reserves, persistence

## Command phase

Select:
- **Beacon**
- **Behind Enemy Lines**

Then deliberately use the **once-per-game Tactical discard/return** on Behind Enemy Lines to regain 1 CP and choose **Bring it Down** as the replacement.

Check:
- CP increases exactly once;
- the discarded card is no longer active;
- the replacement is active;
- the one-use discard cannot be used again later;
- Command-phase Primary scoring reminders appear before moving on.

Open one blue external Rules/reference link, return to the app, and verify the entire battle state is still present.

**Pass:** tactical replacement, CP refund and external-link recovery all work.

## Movement phase

1. Bring **Allarus Custodians** in from reserves at an agreed legal test position.
2. Move the chosen Beacon unit outside your deployment zone/territory as appropriate.
3. Confirm the Advisor recognizes reserve arrival and the new map position.

## Shooting phase

Focus fire the **Norn Emissary** or another 10+ Wound target with multiple Custodes units.

Check:
- focus-fire advice can identify a high-value target;
- actual damage from each attacker is stored separately;
- Bring it Down evidence updates if the target is destroyed.

## Charge/Fight

Complete at least one charge and one fight activation with the Allarus or another newly positioned unit.

## Opponent Turn 2

1. Move a Tyranid unit to a non-home objective.
2. During the opponent Shooting phase, start **Triangulate** if the app offers the Primary Action for that unit.
3. Complete the end-of-turn Triangulation review.
4. At the end of the opponent turn, review **Beacon** scoring.

If Shadow in the Warp is surfaced for the opponent, exercise it here. If opponent-facing reminders are intentionally hidden from the user's perspective, record that as expected and use the manual Battle-shock controls to verify the resulting unit-state behavior.

---

# Round 3 — OC, guarded objectives and deep strike

Select:
- **Burden of Trust**
- **Secure No Man's Land**

## Command/Movement

1. Assign/record guarded objectives for Burden of Trust.
2. Bring **Venatari with Verutum Lances** in from reserves.
3. Move units so you contest/control at least two No Man's Land objectives.
4. Leave one friendly unit Battle-shocked and verify it does not contribute usable OC where the app models Battle-shock.

## Shooting

- Exercise split fire or multi-target shooting again.
- Compare expected vs actual damage.
- Confirm a Battle-shocked/0-OC unit is not given misleading objective-control advice.

## Charge/Fight

- Charge two different enemy units if possible.
- Verify target selection uses the map.
- Exercise multi-weapon melee selection if available.

## End of opponent turn

Review Burden of Trust at its opponent-turn checkpoint and confirm only qualifying guarded objectives are counted.

---

# Round 4 — Actions, stratagems, corrections and save/reload

Select:
- **Plunder**
- **Assassination**

## Movement/Shooting

1. Position an eligible unit for Plunder.
2. In Shooting choose **Action → Plunder**.
3. Select an eligible terrain area and complete the immediate action.
4. Try to destroy Neurotyrant, Winged Prime or Deathleaper to produce Assassination evidence.

## Stratagem/CP test

When a Guardians of the Throne stratagem opportunity is shown:
1. Confirm it appears at the top of the reminder list.
2. Record one stratagem use.
3. Verify the printed CP is spent and history updates.
4. Undo the stratagem if the app exposes atomic undo, then record it again once.

## VP correction test

1. Intentionally enter a **+1 VP** manual adjustment.
2. Verify the scoreboard changes.
3. Undo/correct it immediately.
4. Verify the original score returns.

## Persistence test

Mid-phase:
1. Save locally/cloud if signed in.
2. Reload the page or leave and return to the app.
3. Resume the battle.
4. Confirm phase, round, active player, CP/VP, unit wounds, Battle-shock, positions, active cards and completed actions are unchanged.

---

# Round 5 — Endgame scoring and review

Select:
- **Centre Ground**
- **Defend Stronghold** (or Display of Might if that card better matches the board state)

## Command through Fight

Use the final round to verify:
- Round 5 Primary timing uses end-of-turn where required instead of a future Command phase.
- Tactical Advisor changes urgency for final scoring opportunities.
- No unit that has already activated can be reused accidentally.
- Destroyed units stay unavailable.
- Reserve/off-battlefield statuses remain correct.

## Final scoring

1. Record final objective control.
2. Review Consecrate end-of-battle conditions.
3. Review any remaining Secondary end-of-battle/opponent-turn checkpoints.
4. Verify Primary caps: no more than the applicable round cap and no more than 45 Primary VP for the game.
5. Confirm Battle Ready / other non-Primary score handling if present in the live score.
6. Finish the battle.

---

# Final Game Review acceptance checks

Open **Game Review** and verify that the review can show or derive, where implemented:

- final VP/CP;
- objective-control history;
- unit loss history;
- recorded shooting/fight attacks;
- expected-vs-actual damage context;
- position history;
- active/completed/discarded secondary history;
- Primary mission context;
- resource/stratagem use;
- Tactical Advisor decisions or lessons where available.

## Overall pass criteria

The verification pass is successful when:

1. The game can proceed from Setup through Round 5 without a workflow blocker.
2. No navigation or reference link loses the battle state.
3. Friendly and opponent map movement works where intended.
4. Shoot, Action and Not Shoot paths all allow phase completion.
5. Charge and Fight activations are recordable and cannot double-activate accidentally.
6. Primary and Secondary scoring checkpoints occur at the correct times and require player confirmation.
7. Tactical discard/refund is one-use only.
8. Battle-shock/OC and unit status persist correctly.
9. Reserves can enter play and remain correctly represented.
10. Save/reload restores the same authoritative game state.
11. Final review is reachable and reflects recorded game history.

Any failure should be logged with: round, phase, active player, selected unit, exact action immediately before the failure, screenshot, and whether a reload reproduces it.