# Live-play stabilization follow-up

Based on main after PRs #356, #361, #362 and #363. Keeps the map-first layout and pinned damage/record controls.

## Changes

- Fight retaliation still considers another recorded engaged enemy when the selected target is destroyed. Completed and declined current-turn Fight activations are excluded; earlier-turn completions are not.
- Unknown retaliation displays a dash rather than a misleading zero. The estimate remains the strongest known response, not all enemy attacks combined.
- Shooting shows the existing target recommendation and, where relevant, named supporting fire, a stronger weapon match or overkill warning. Combined mean damage is explicitly not a combined destruction probability.
- CP and phase-relevant catalog references are collapsed by default. Eligibility must be checked at the table; unmodeled text is not silently added to damage calculations.
- Target cycling preserves keyed Advisor disclosures, selector/comparison focus and panel scroll.
- Recovery/tools refreshes preserve focus and dialog scroll. Tab stays within the dialog; Escape closes ordinary tools but not the mandatory resume choice. Dismissed incompatible-save warnings stay closed until reopened, without enabling an overwrite.

## Verification

`npm run verify`: 410 tests passed; static build passed. Regression coverage includes retaliation, current/earlier-turn completion, unknown response display, escaped strategy references, target continuity, dialog focus/scroll, mandatory recovery choice and incompatible-save preservation.

Real Safari/iPad visual and touch verification is still required; unit DOM fixtures do not establish browser layout correctness. Suggested checks:

1. Cycle targets with Advisor assumptions open and the panel scrolled. Confirm the map and pinned record controls remain usable.
2. Destroy the selected enemy while another recorded engaged enemy remains. Confirm return damage does not disappear solely because the first target died.
3. Finish that enemy's Fight activation. Confirm it no longer contributes to the return estimate.
4. Open Game tools, scroll its report and trigger a cloud-status refresh. Confirm its scroll/focus remains stable.
5. Reload a saved battle. Resume must remain an explicit choice, and restored clocks must be paused.

This follow-up does not change mission rules, automatically spend CP, infer exact map eligibility or broaden offline support.
