# Charge and Fight map workflows

Implemented from GitHub main `5d2a169` with the existing combat commands and Advisor calculations.

- Tabletop mode is the default for Charge and Fight; explicit classic mode remains available.
- Shared map/control presentation and stylesheet live in `combat-workspace.js` and `styles/combat-workspace.css`.
- Phase selection state, interactions and command errors live in their respective `*-tabletop-screen.js` modules. The battle shell is unchanged.
- Charge uses the active army even when the screen perspective is the other player. It supports multiple declared targets, one measured distance per target, success/failure, current-turn history, and exclusion of completed attempts and units that Fell Back.
- Fight supports preview before activation, enemy map selection, weapon selection, actual damage, repeated weapon/target entries, either army, and existing Fights First and engagement guards. Comparing targets records no activation. The first attack or explicit Begin Fight records one activation.
- Finish unit entry clears the local selection. Existing history remains available to continue an entry; this change does not impose a new irreversible activation-finalization rule.
- Advisor context resolves roster/catalog melee profiles for the existing survival-weighted retaliation calculation without changing live unit state. Retaliation is the strongest known option, not summed damage from every opponent. Missing profiles and tabletop exceptions still require player judgment.
- Map position is approximate; unit movement and legal Charge/Fight declarations remain table-side. Map taps in these screens select units/targets rather than moving them.
- Alternating player selection remains table-side as in the existing engine. This change does not implement the held advanced Advisor package.

Automated verification: 156 tests and static build passed. Six added interaction scenarios cover declaration measurements, opponent charges, target comparison, per-weapon recording, activation priority, rejection handling and immutable Advisor context.

Physical iPad acceptance remains with the testing chat: confirm map/controls fit, target taps, scrolling, measured-distance presets, multiple weapon entries, opponent Fight entry, and end-phase navigation.
