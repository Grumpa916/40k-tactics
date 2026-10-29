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

Start-of-phase prompts close after a recorded tabletop activation, move, attack or charge. Dacatarai and Kaptaris now enforce that same boundary in the existing Ka’tah UI/command. Expired defensive effects are not carried to later phases. A unit known to be engaged is excluded from Take Wing and Swift as the Eagle reminders; unrecorded proximity and engagement still require table confirmation.

Personal notes are stored on each battle unit, including opponent units, so they remain specific to that battle and persist through normal battle saves. Drafts stay separate when switching units. Notes are escaped when rendered, including in target defense cards.

The opponent reminder uses the current Combat Doctrines army-rule summary and asks the player to confirm army-wide and unit-specific doctrine exceptions. The old Oath of Moment reference was replaced with the September 2026 official preview's doctrine summary; doctrine effects remain reference-only.

Validation covers opponent target selection, conditional and formation defenses, phase expiry, once-per-unit/army limits, CP/readiness transactions, saved notes, draft switching, and native-select dismissal behavior. The battle shell delegates this feature to focused rules, transition and UI modules; its screen registry was extracted to keep the shell below its existing 50 KiB limit.
