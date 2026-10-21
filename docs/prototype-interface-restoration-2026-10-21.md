# Restore the approved tabletop interface

Reference: `/workspace/sites/tactics-tabletop` at `63b00da` and the October 18 UI savepoint. This applies the approved presentation to the current GitHub engine, rather than replacing current rules or using the prototype's sample state/calculations.

- Battle view: large left map, 330–360px unified phase/advisor column, optional hide/show panel, persistent armies and Log. Overview reveals scores, missions and phase navigation. The real guarded phase progression stays reachable in the compact toolbar.
- Movement shares the workspace, with existing pointer dragging and command handlers retained. Shooting, Charge and Fight preserve their existing target and attack workflows.
- Circular blue/red markers retain real positions and Event Companion terrain. Completed activations show a check; open multi-weapon activations show an ellipsis. Saved history supplies badges, scoped to the current round/turn/phase. Shooting marks cannot leak into Charge.
- Army rows show M/T/S/SV/LD/OC, models, wounds and status. Strength is weapon-specific. Missing live counts are unknown, not inferred from roster size. A row opens full datasheet details, including manual Battle-shock marking/clearing for either army in any active phase.
- Manual Battle-shock uses an audited command, independent of Command test eligibility. A passed Command test clears all supported status representations.

Focused modules: `prototype-workspace.js` owns view preferences/overlay interaction, `army-unit-summary.js` owns row presentation, `unit-activation-presentation.js` derives badges, and `manual-battle-shock-transitions.js` owns the new state change. The shell only composes these pieces.

Validation: automated tests cover history/reload and phase boundaries, Action/Skip badges, catalog details, workspace toggling, persistent manual status commands and Command clearing, alongside existing target selection, movement and combat completion regressions. Physical iPad Safari review remains a user acceptance check.
