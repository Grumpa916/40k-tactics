# Space Marines 11th-edition Phobos unit review — Incursors, Infiltrators, Reivers

Review date: 2026-11-03 (US Pacific). This is a **current 11e source cross-check**, not a claim that the full October 2026 printed Codex or current GW MFM was directly examined for every line.

## Source authority

The Games Workshop Codex: Space Marines and current [Munitorum Field Manual](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) are authoritative. The 11e datasheet figures in this pass were compared against independent Warhammer App transcriptions, checked on November 3:

- [11e Incursor Squad](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Incursor-Squad)
- [11e Infiltrator Squad](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Infiltrator-Squad)
- [11e Reiver Squad](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Reiver-Squad)
- Independent corroboration: [Infiltrator datasheet](https://wh-rules.ru/factions/space-marines/datasheets/infiltrator-squad), [Reiver datasheet](https://praetorium.gg/factions/space-marines/rules/space-marines-points-2026-10-13/datasheets/reiver-squad)

**Important edition trap:** Search-engine results for `40k.app/factions/space-marines/units/...` and `wahapedia.ru/wh40k10ed/...` may show **old 10th-edition** datasheets. The current 11e edition has different weapons, 8-inch Phobos movement, equipment options and abilities. Do not restore those options from 10e caches.

## Three revised datasheets

| Unit | Legal equipment modeled | Combat, abilities and reviewed points |
| --- | --- | --- |
| Incursor Squad | **All weapons fixed**: Bolt Pistol, Occulus Bolt Carbine, Paired Combat Blades on each model; no optional mine picker | M8 T4 W2; updated S5 Bolt Pistol/Occulus/Blades. Divinator-class Auspexes scan in Shooting, **Haywire Mine is now an innate once-per-battle unit ability** (manual roll). Sizes 5/10; first two units 90/170, third+ 100/180 |
| Infiltrator Squad | Fixed Bolt Pistol, Marksman Bolt Carbine, Ceramite Fists; **maximum one Helix Gauntlet per entire squad**, independent of size | M8 T4 W2; current S5 Precision/Rapid Fire carbine. Helix heals D3 in Command phase; Omni-scramblers mark a visible enemy as detected within 18 inches. Sizes 5/10 cost 85/150. **Obsolete Infiltrator Comms Array is not offered** |
| Reiver Squad | Fixed Bolt Carbine, Special-issue Bolt Pistol and Monomolecular Combat Knife on **every** model; optional **one Grav-chutes** and **one Grapnel Launchers** squad-wide | M8 T4 W2; updated S5 Precision weapons. Scouts 6, Terror Troops OC penalty, Fearsome Assault battle-shock and optional Deep Strike/Grapnel movement are reminders. Sizes 5/10 cost 85/165. **Obsolete 10e knife/carbine replacement is not offered** |

### Army Builder safeguards

- The shared optional-equipment limit calculator now supports `maxTotal`: a unit-wide one-item cap for 5- or 10-model squads, without changing existing `perModel` or `perModels` cases. Quantity controls show **“Up to 1 per unit”**, rather than incorrectly saying one per model.
- The shared validator rejects a second Gauntlet, Grav-chutes or Grapnel selection, and rejects weapons/options not present on the 11e datasheet.
- Imported **Incursors** with fully fixed reviewed equipment are populated automatically. Infiltrator/Reiver **optional** equipment is not silently assumed to be present.
- Historical saved lists, opponent roster snapshots, existing games, user-entered Wounds, CP, VP and map positions are not rewritten. The rules-data revision changes so older saved rosters can be revalidated explicitly.
- Infiltrator detection, Reiver Terror Troops/battle-shock, Incursor mine rolls, movement effects and CP effects remain player-confirmed rather than spuriously automated.

## Outstanding review

Complete direct official October Codex/MFM verification (particularly chapter-specific Force Dispositions, attachments and points), then proceed with remaining Space Marines and named characters. Full iPad Safari live play for Phobos import, optional equipment, roster readiness and tactical shooting has not yet been performed. Old 10e profile sources must not be mistaken for 11e authority.
