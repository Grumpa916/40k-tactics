# Space Marines 11th Edition Land Raiders — source-scoped audit

Reviewed November 4, 2026. Includes the standard Land Raider, Land Raider Crusader and Land Raider Redeemer. These profiles were cross-checked against current **11e community transcriptions**, not directly certified page-by-page against the full official October Games Workshop Codex or live Munitorum Field Manual.

## Reference sources
- [Land Raider — 11e](https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider)
- [Land Raider Crusader — 11e](https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider-Crusader)
- [Land Raider Redeemer — 11e](https://wahapedia.ru/wh40k11ed/factions/space-marines/Land-Raider-Redeemer)
- Definitive official data to certify: [GW Warhammer 40,000 downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/), [GW live Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines).

## Reviewed 11e data

| Datasheet | Fixed weapons | Optional weapons (each max one) | Capacity and abilities | Cost |
|---|---|---|---|---|
| Land Raider | Two Godhammer Lascannons; Twin Heavy Bolter; Armoured Tracks | Hunter-killer Missile, Multi-melta, Storm Bolter | M10, T12, 2+ save, W16, OC5; transport **14** infantry; Assault Ramp (normal move then assault disembark); Power of the Machine Spirit (one ranged hit and one wound re-roll) | 245 first, 265 second+ |
| Land Raider Crusader | Two Hurricane Bolters; Twin Assault Cannon; Armoured Tracks | Same three | M12, T12, 2+ save, W16, OC5; transport **16** infantry; Assault Ramp; Fury of the Machine Spirit: Lethal Hits for ranged attacks against targets within 12 inches | 230 first, 250 second+ |
| Land Raider Redeemer | Two Flamestorm Cannons; Twin Assault Cannon; Armoured Tracks | Same three | M12, T12, 2+ save, W16, OC5; transport **14** infantry; Assault Ramp; Wrath of the Machine Spirit: conditional Devastating Wounds against non-MONSTER/VEHICLE targets within 12 inches | 245 first, 265 second+ |

None can transport JUMP PACK models; each GRAVIS/TERMINATOR model uses two transport spaces. Damaged 6, Deadly Demise D6 and the One Shot missile must be handled manually.

### Source discrepancy requiring direct official certification
The independent 11e source lists the **Crusader's Multi-melta Damage D3+3**, versus D3+2 on the standard and Redeemer datasheets. The scoped profile retains the source literal and explicitly flags it for official printed Codex confirmation rather than silently homogenizing equipment.

## Integration and safety
- Optional equipment is modeled independently from fixed weapons and capped at one of each. No 10th-edition weapon swaps or assumed optional weapons.
- Unlike fixed-only Gladiators, these vehicles are **not** automatically hydrated on an empty Warhammer App import: the user must confirm optional choices.
- The review updates the battle-facing reference/attack profiles and displays timing, range and transport reminders. It does not automatically move units, modify scores, CP, Wounds, objectives or existing saved rosters.
- Existing points tables already have the 11e first/second+ Land Raider tiers; they are intentionally preserved.
- Completeness increases from 36 to 39 of the 87 non-Legends cataloged Marine entries after merge.
- Final official Codex/MFM comparison, the anomalous Crusader Multi-melta, live transport/disembark integration, and iPad Safari testing remain outstanding.
- Next audit scope: Repulsor and Repulsor Executioner, then Impulsor, Drop Pod, Rhino and remaining vehicles.

Regressions test three distinct fixed loadouts, three independent optionals and max caps, Power/Fury/Wrath target conditions, transport capacities, weapons and first vs later copy prices. CI is required before merge, and this PR remains unmerged pending user approval.
