# Adeptus Custodes Tactical Advisor — Phase Two

Implemented on top of the Phase One Custodes Tactical Advisor slice against the current October 2026 Adeptus Custodes rules-data revision.

## Modeled second-wave rules

- **Generic hit/wound reroll engine** — shared roll-probability semantics now support re-roll 1s and failed-roll re-rolls in both expected-damage calculations and full damage distributions. Re-rolls never chain, and Twin-linked uses the stronger failed-wound reroll rather than stacking with re-roll 1s.
- **Dacatarai** — a readied Custodes unit fighting a non-Monster/Vehicle target receives a numerical comparison for melee Hit-roll re-rolls of 1. The Ka'tah is recommended but never silently expended.
- **Kaptaris** — Fight retaliation analysis compares modeled enemy return damage before and after the Ka'tah's -1 to Hit defensive effect, showing projected damage prevented without automatically spending readiness.
- **Might of the Moritoi** — Custodes Dreadnought strength state now drives the detachment rule: +2 OC at starting strength, re-roll Hit rolls of 1 below starting strength, and re-roll Hit and Wound rolls of 1 below half strength. Single-model strength state uses remaining wounds rather than unchanged model count.
- **Honoured Companions** — a Trusted Sentinel near a recorded objective can receive a conditional Wound-roll re-roll-of-1 damage comparison. Because map positions are approximate, objective range must be confirmed at the table before applying the bonus.

## Integration boundaries

- Phase Two extends focused rules/advisor modules; `battle-shell.js` remains untouched.
- Martial Ka'tah expenditure stays player-confirmed and history-backed.
- Rules whose eligibility depends on exact physical geometry remain advisory until confirmed at the table.
- Approximate map position never becomes an authoritative objective-range or movement ruling.
- Optional/conditional Custodes bonuses are not silently folded into a recommendation unless their tracked state makes them automatic.

## Verification

GitHub Actions run `40272834201` completed successfully before this documentation-only commit:

- `npm run verify` passed.
- **465 tests passed, 0 failed.**
- Static Cloudflare Pages bundle built successfully.

The documentation commit must also pass the normal branch/PR verification before merge.
