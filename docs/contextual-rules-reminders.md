# Contextual rules reminders

The Rules button in the live toolbar opens current-phase reminders and a saved per-unit notes editor. The phase panel also provides an expandable, unit-focused reminder list. The reminders follow the battle roster's faction, selected detachments, reviewed datasheet abilities and recorded history.

Selecting a Custodes target in Shooting or Fight displays its defensive rules before damage entry. Warden Living Fortress states **worsen incoming AP by 1** with an AP −2 → AP −1 example. Sentinel/Galatus protection is shown when attack Strength exceeds the formation's Toughness, or as an explicit condition when Strength is unknown. Telemon Guardian Eternal appears for ranged attacks only. Conditional mortal/Psychic protection is labeled; a Leader's general Feel No Pain and Moment Shackle save are tied to allocation to that model.

Limited ability uses are recorded in battle history and survive the existing JSON save/resume flow. Moment Shackle is once per army per battle, the Venatari mine once per unit per battle, and Swift Ruin once per army per phase. Marking these records tabletop use; their dice, movement and temporary offensive effects are resolved at the table. Aquila Commander confirmation adds 1 recorded CP once per army per round. Superhuman Focus spends 1 recorded CP and re-readies an eligible formation once per battle round. The immediate action can be undone from the Rules drawer.

Moment Shackle offers its two choices at the start of either player's phase. After recording one, the selected effect stays visible as **Active this phase** in the unit reminders and Rules drawer, including when Trajann is attached to Wardens. The save reminder explicitly applies to Trajann only. At the next phase it leaves the active reminders, remains in used abilities, and cannot be chosen again in that battle. No additional map badge is added.

## Venatari controls

The Rules drawer and inline unit reminders use dedicated Venatari forms rather than a generic mark-used button:

- **Neutronium Cascade Mine:** at the start of either player's phase, select a deployed enemy formation and confirm its measured 3″ range. Enter actual wounds lost after defensive rolls using 0–6 touch choices. A known non-Monster/Vehicle target is capped at 3. Recording updates tracked wounds, marks zero-wound failures as spent, and preserves the once-per-unit-per-battle limit through saves and reserve moves. No dice are rolled by the app. Positive damage requires a tracked target wound count.
- **Take Wing:** in opponent Fight, confirm the phase has ended and the unit is unengaged. Known recorded engagements prevent use. Recording moves the unit to Strategic Reserves and removes its map position. Wounds, notes and ability-use history persist.
- **Swift Ruin:** in opponent Movement from round 2, a non-Battle-shocked lance unit in reserves can confirm legal Rapid Ingress and the actual cost after the 1 CP discount (normally 0). Positive costs are deducted once. The confirmed unit appears in a Swift Ruin tray; select it and tap its arrival position on the existing map. Movement cannot advance until placement is recorded. The army-wide use limit and placement authorization apply only to that phase; another unit's normal Rapid Ingress is not marked spent by this ability.

All three actions can be immediately undone as a single transaction, including wounds/reserve/CP changes. Arrival placement also has immediate reserve-transfer undo. Generic reminder commands cannot bypass the required confirmations. Range, end-of-phase timing, reserve eligibility and final placement remain table-confirmed; approximate map distance is never a hard eligibility test.

Venatari Deep Strike is referenced when reviewing their reserves during own Movement. Kinetic Destroyers receive their Strike from the Skies re-roll reminder only after a recorded ingress in the current turn; that rule is never granted to the user's lance unit. Lance and Precision remain part of the equipped-weapon reminders. This adds no map status badges.

Rules checked against the current [Verutum Lances reference](https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/Venatari-with-Verutum-Lances) and [Custodes datasheets](https://orpheax.github.io/custobuilder/datasheets.html), including Rapid Ingress's round-one restriction and opponent Movement timing. Imported obsolete ability wording remains ineligible for automatic controls.

## Defensive modifiers and Guardians opportunities

The selected target's defense card shows current weapon-specific AP and Damage examples, strength-dependent wound protection, and allocated-model saves. A recorded In Auramite Clad use worsens AP only against the named enemy formation, through that attacker's remaining weapons. It expires on recorded activation finish or phase change. Kaptaris's melee Hit penalty and the selected Moment Shackle save feed the existing expected-damage forecast in their valid windows; the latter applies only to Trajann's profile, never the Warden bodyguard. Actual damage entered by the player is not reduced a second time.

Guardians controls are grouped by stratagem in **Rules** and filtered for the selected friendly formation in unit reminders. In Auramite Clad is also available beside the selected incoming target, with the attacker preselected. Unavailable entries explain CP, Battle-shock, timing and recorded-use restrictions. Attached Leaders cannot receive a second stratagem independently. The use ledger enforces each stratagem once per army per phase and one stratagem per friendly formation per phase, including recorded Superhuman Focus and Rapid Ingress history. The table confirmation covers other stratagem uses that were not recorded in the app.

- **Superhuman Focus:** confirm the end of a phase, spend 1 CP and re-ready the formation; additionally once per unit per battle round. Explicit readiness before the first Command phase is supported. Confirming phase end does not reopen a start-of-Fight Ka’tah window.
- **In Auramite Clad:** opponent Shooting or either player's Fight, when an enemy selects targets and before its first recorded attack. Excludes Wardens and their attached formation. A zero-AP weapon receives a no-benefit reminder; other weapons may still matter.
- **Shield of Honour:** start of Fight, Infantry/Mounted only. The reminder remains conditional on each engaged enemy model's allocations. No blanket Hit/Wound penalty is applied by the forecast.
- **Prime Target:** own Shooting, when selected to shoot and before recording attacks. Skipped/action-only and completed activations are excluded. Resolve the single Hit, Wound and Damage re-rolls at the table.
- **Unlimited Endurance:** immediately after the recorded Advance. Its Assault and Advance-and-charge reminders remain visible in the relevant later phases of the same turn. They do not alter the recorded Advance.
- **Swift as the Eagle:** after a recorded enemy move in opponent Movement, an unengaged Trusted Sentinel can confirm the measured 8″ trigger. The app records CP and use; resolve the D3+3″ Normal move and its destination at the table.

Each confirmed use spends the printed 1 CP, persists in saves and history, and supports immediate atomic undo. No stratagem use adds a map status badge. Conditions involving distances, final phase timing or individual enemy models stay table-confirmed.

Current references: [Guardians](https://wahapedia.ru/wh40k11ed/factions/adeptus-custodes/#Guardians-of-the-Throne), [core stratagem restrictions](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/#Using-Stratagems) and the linked Custodes reference. Superhuman Focus's end-of-phase timing and Auramite's either-player Fight window correct earlier shortened catalog summaries.

Start-of-phase prompts close after a recorded tabletop activation, move, attack or charge. Dacatarai and Kaptaris now enforce that same boundary in the existing Ka’tah UI/command. Expired defensive effects are not carried to later phases. A unit known to be engaged is excluded from Take Wing and Swift as the Eagle reminders; unrecorded proximity and engagement still require table confirmation.

Personal notes are stored on each battle unit, including opponent units, so they remain specific to that battle and persist through normal battle saves. Drafts stay separate when switching units. Notes are escaped when rendered, including in target defense cards.

The opponent reminder uses the current Combat Doctrines army-rule summary and asks the player to confirm army-wide and unit-specific doctrine exceptions. The old Oath of Moment reference was replaced with the September 2026 official preview's doctrine summary; doctrine effects remain reference-only.

Validation covers opponent target selection, conditional and formation defenses, phase expiry, once-per-unit/army limits, CP/readiness transactions, saved notes, draft switching, and native-select dismissal behavior. The battle shell delegates this feature to focused rules, transition and UI modules; its screen registry was extracted to keep the shell below its existing 50 KiB limit.
