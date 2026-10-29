# Contextual rules reminders

The Rules button in the live toolbar opens current-phase reminders and a saved per-unit notes editor. The phase panel also provides an expandable, unit-focused reminder list. The reminders follow the battle roster's faction, selected detachments, reviewed datasheet abilities and recorded history.

Selecting a Custodes target in Shooting or Fight displays its defensive rules before damage entry. Warden Living Fortress states **worsen incoming AP by 1** with an AP −2 → AP −1 example. Sentinel/Galatus protection is shown when attack Strength exceeds the formation's Toughness, or as an explicit condition when Strength is unknown. Telemon Guardian Eternal appears for ranged attacks only. Conditional mortal/Psychic protection is labeled; a Leader's general Feel No Pain and Moment Shackle save are tied to allocation to that model.

Limited ability uses are recorded in battle history and survive the existing JSON save/resume flow. Moment Shackle is once per army per battle, the Venatari mine once per unit per battle, and Swift Ruin once per army per phase. Marking these records tabletop use; their dice, movement and temporary offensive effects are resolved at the table. Aquila Commander confirmation adds 1 recorded CP once per army per round. Superhuman Focus spends 1 recorded CP and re-readies an eligible formation once per battle round. The immediate action can be undone from the Rules drawer.

Start-of-phase prompts close after a recorded tabletop activation, move, attack or charge. Dacatarai and Kaptaris now enforce that same boundary in the existing Ka’tah UI/command. Expired defensive effects are not carried to later phases. A unit known to be engaged is excluded from Take Wing and Swift as the Eagle reminders; unrecorded proximity and engagement still require table confirmation.

Personal notes are stored on each battle unit, including opponent units, so they remain specific to that battle and persist through normal battle saves. Drafts stay separate when switching units. Notes are escaped when rendered, including in target defense cards.

The opponent reminder uses the current Combat Doctrines army-rule summary and asks the player to confirm army-wide and unit-specific doctrine exceptions. The old Oath of Moment reference was replaced with the September 2026 official preview's doctrine summary; doctrine effects remain reference-only.

Validation covers opponent target selection, conditional and formation defenses, phase expiry, once-per-unit/army limits, CP/readiness transactions, saved notes, draft switching, and native-select dismissal behavior. The battle shell delegates this feature to focused rules, transition and UI modules; its screen registry was extracted to keep the shell below its existing 50 KiB limit.
