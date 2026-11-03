# Fight workflow simplification

## Live-play principle

The physical tabletop is authoritative for Fight eligibility, order, Pile In/Engagement Range, and target legality. The app preserves inferred engagement state, Charge history, Fights First, approximate positions, and Tactical Advisor calculations as guidance and review context, but those signals must not prevent recording a Fight that legally occurred on the table.

## Recording flow

1. Select the fighter from the map or Fight-order panel.
2. Select a melee weapon and tabletop-confirmed target.
3. Enter actual damage with the +/- controls.
4. Record the weapon attack. The first recorded attack automatically starts the unit's Fight activation.
5. Record additional weapon/target results as needed, then finish the activation.

There is no separate **Begin Fight** step in the tabletop layout.

## Fight ordering

- Inferred **Fights First** units remain listed first as the recommended priority.
- Other inferred combats remain visible.
- Additional deployed, unfinished combat formations are available as **Tabletop-confirmed fighters** when the app did not infer their eligibility.
- Selecting a non-Fights-First unit while Fights First remains produces a reminder rather than a hard block.
- Tabletop-confirmed activation events retain a `tabletopConfirmed` marker for review/debugging.

## Safeguards retained

- Units must exist, be deployed, and be recorded as their combat-formation root rather than an attached member.
- A formation can only receive one Fight activation per turn.
- Finished activations cannot attack again.
- Fight attacks still require a melee weapon and an activated attacker.
- Precision allocation and actual damage recording remain unchanged.
- End Fight only auto-records **inferred** remaining combats as `not_fight`; it never invents tabletop-only eligibility.

## Advisor behavior

Fights First, Charge history, engagement records, map position, expected outgoing damage, and retaliation estimates remain Tactical Advisor inputs. They are advisory context rather than execution locks.
