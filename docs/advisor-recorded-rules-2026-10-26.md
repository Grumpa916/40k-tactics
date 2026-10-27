# Advisor rules from recorded combat context

This change builds on the Custodes Phase One and Phase Two work. It connects additional existing reviewed datasheet rules to expected damage, damage distributions, target comparisons, Fight retaliation and charge projections.

## Added calculations

- Lance uses a successful charge recorded for this turn. The Charge Advisor's projected melee explicitly assumes success; the defender receives no hypothetical charge bonus.
- Vertus Praetors' Quicksilver Execution and Gyrfalcons' Death Blow use the same charge evidence.
- Slayer of Tyrants compares the target's Toughness with the attacking formation's Toughness.
- Dread Foe and Destructor Optics check attack type and known non-Monster/Vehicle target keywords.
- Reap a Terrible Tally supplies Hit/Wound re-rolls of 1 against Infantry, preserving stronger re-rolls.
- Living Fortress and Golden Laurels worsen incoming AP. Sentinel Praesidium Shields and Unyielding Ancient worsen Wound rolls only when incoming Strength exceeds Toughness.
- The Shield-Captain's damage reduction requires recorded, valid Praesidium Shield equipment. Guardian Eternal reduces ranged damage only. Reduction is applied to each dice outcome, to a minimum of 1, before wound prevention.
- Unconditional Feel No Pain is included in both the mean and the full probability distribution, rolling prevention per wound. Aegis of the Emperor applies its mortal-wound protection to the Devastating Wounds portion only; the best applicable prevention is used once.
- Swift Onslaught supplies a full Charge re-roll, including when the Blade Champion is attached. It does not stack with Dread Host.
- Conditional weapon text such as Galatus' Sustained Hits against non-Monster/Vehicle targets and Knight-Centura's Devastating Wounds against Psykers is checked against known target keywords.
- Shooting and Fight show a collapsed list of the additional rules used in their estimate.

## Evidence and scope

The Custodes inputs are the existing October 2026 reviewed descriptions in `adeptus-custodes-datasheet-details.js` and selected equipment in the saved roster. The adapter requires the saved description to match the reviewed rule; a different older rule with the same name is not silently interpreted as the current effect. Unit-wide abilities follow recorded attachment relationships. Model-specific shields and Feel No Pain remain with their bearer.

Core reference: [11th edition Core Rules](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf), including Lance (24.21), Devastating Wounds (24.10) and Feel No Pain (24.12). The existing catalog's source metadata remains authoritative for its rules snapshot.

The Advisor never spends CP, Ka'tah readiness, once-per-battle abilities, or alters recorded outcomes. Exact objective/aura distances, optional enhancements, designated marks and other unrecorded choices still need table context. Cleave needs confirmation that the required attacks share one target; this change does not assume that declaration. Restricted Psychic protection and other unmodeled effects remain reference rules. Existing aggregate-wound forecasts still do not simulate every model's individual damage allocation.

The shared rules and probability modules own the calculation. The battle shell is unchanged.

## Verification

Focused coverage exercises current/stale charges, target/attack conditions, valid/invalid shield equipment, attached models, saved-description mismatch, conditional weapon parsing, re-roll non-stacking, mean/distribution agreement, per-wound prevention and the applied-rule display. Full `npm run verify` checks the complete suite and static build.
