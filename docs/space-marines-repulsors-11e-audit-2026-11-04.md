# Space Marines 11e Repulsor and Repulsor Executioner audit

Review date: November 4, 2026. This is a source-scoped cross-check against current independent 11th-edition datasheet transcriptions. Complete direct verification against the latest official Games Workshop October Codex and live Munitorum Field Manual remains pending.

## Sources
- [Repulsor (11e)](https://wahapedia.ru/wh40k11ed/factions/space-marines/Repulsor)
- [Repulsor Executioner (11e)](https://wahapedia.ru/wh40k11ed/factions/space-marines/Repulsor-Executioner)
- Definitive sources for future comparison: [GW current downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) and [GW live Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines).

## Equipment and weapon profiles

**Repulsor:** M10 T12 Sv3+ W16 OC5. Fixed Armoured Hull, Defensive Array (24-inch, 18 shots, S5 AP-1 D1), Hunter-slayer Missile (48-inch, S14 AP-3 D3+3, Indirect Fire, One Shot). Two independent swaps: Heavy Onslaught Gatling Cannon (12 shots, S6 AP-1 D1, conditional anti-infantry Devastating Wounds and Sustained Hits 2) OR Las-talon (36-inch, 2 shots, S10 AP-3 D3+3); Twin Heavy Bolter OR Twin Lascannon. **Combat Embarkation** happens in the opponent's Charge phase after enemies select charge targets; the charged unit must be unengaged, within 3 inches and able to fit; the enemy can then reselect charge targets. Transport 14 Astartes Infantry, no Jump Packs; Gravis/Terminator count double. Points: 190 first/second, 210 third+.

**Repulsor Executioner:** M10 T12 Sv3+ W16 OC5. Fixed Armoured Hull, Defensive Array, Heavy Onslaught Gatling Cannon, Twin Heavy Bolter. One gun selection: Heavy Laser Destroyer (72-inch, 2 shots, S16 AP-4 D6+4, Heavy, Devastating Wounds) OR Macro Plasma Incinerator (Standard / Supercharge alternate modes; not two guns). **Executioner:** +1 to hit rolls for ranged attacks against enemy units *not below half-strength*, evaluated manually. Transport 7 Astartes Infantry, no Jump Packs; Gravis/Terminator count double. Base price 260 first/second or 280 third+. **Heavy Laser Destroyer is +10**, unlike the plasma option. Both require confirmation of actual selected loadout and no old saved points are automatically updated.

## Integration and safeguards
- The replacement slots are independent and legal; both plasma modes map to one physical gun.
- One-shot missiles, enemy Charge-phase Embarkation, half-strength target condition, damaged vehicle at six wounds, Deadly Demise D6 and transport disembark are player-confirmed, not automated.
- Do not restore obsolete 10e defensive/weapon rules or infer active game-state mutations. Keep phase-independent wounds, battle shock, map moves, CP, VP and manual scoring unchanged.
- The scoped source review increases current non-Legends Space Marines reviewed wargear from 39 to 41 of 87 **after #521 and this PR merge**.
- Remaining official Codex/MFM side-by-side certification, import variants, live iPad UI and transport map interactions are outstanding.
- PR #521 has merged; the present PR is reconciled against current `main`. User approved the merge; complete CI verification on the reconciled head before merging.

Tests verify the two legal Repulsor swaps, Executioner Heavy Laser/plasma choice, alternative attack modes, invalid doubled guns, transport rules, and first/second/third points tiers.
