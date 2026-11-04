# Space Marines Ultramarines named-unit wargear and data audit — 2026-11-03

## Scope and source authority

This pass verifies the **current 11th-edition named-unit reference data** for Marneus Calgar, Cato Sicarius, Victrix Honour Guard and Wardens of Ultramar, correcting absent or misleading fields. It deliberately does **not** certify the entire October 2026 Games Workshop Codex, updated MFM or all Chapter-specific attachments.

- **Definitive official published source:** [Games Workshop 11e Space Marines Faction Pack v1.0 (June 2026)](https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf), pp. 35–40 and 43–44. It establishes distinct Calgar, Cato, Victrix and six named Wardens datasheets with composition, equipment, abilities and attachment rules. Some profiles and special rules were changed by the October 2026 Codex.
- **Current October-era cross-reference:** [11e Ultramarines current datasheets](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/datasheets.html), [Cato Sicarius](https://wh-rules.ru/factions/space-marines/datasheets/cato-sicarius), [Wardens of Ultramar](https://wh-rules.ru/factions/space-marines/datasheets/wardens-of-ultramar), [Marneus Calgar](https://praetorium.gg/factions/ultramarines/rules/mfm-1-6/datasheets/marneus-calgar-984d-c25), [Victrix Honour Guard](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Victrix-Honour-Guard).
- **Official points authority:** [Games Workshop download index](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/), MFM October 14, 2026. The current Victrix option and banner pricing figures have been compared with independent current 11e sources, **not transcribed directly from the current MFM**.

The official GW PDF is authentic and authoritative; the web screenshot service could not render its embedded pages because the PDF exceeds its retrieval size limit. The searchable official PDF text was available, and used alongside live 11e reference comparisons. No uninspected visual page is claimed to have been certified.

## Implemented

| Unit | Wargear and profile handling | Remaining manual treatment |
|---|---|---|
| Marneus Calgar | Original stable `space-marines:marneus-calgar` ID and 180-point local cost retained; existing Terminator Gauntlets (ranged, melee, Overhead Smash) registered as one fixed equipped item with three attack profiles | Doctrine choices, insertion and leader effects require tabletop confirmation; no saved roster remapping |
| Cato Sicarius | Current 11e T5, 2+/4++ profile, Artisan Plasma Pistol, and Talassarian Tempest Blade with **Strike / Sweep / Coup de Grace** attack modes. Source-dated fixed loadout, 115 points | His Support status depends on an army containing Calgar; fight/movement stratagem timing remains manual |
| Victrix Honour Guard | T5, 2+ save, three/six total model choices, configurable Guard / Chapter Ancient / Chapter Champion model roles, at most one of each specialist. Adds **15 army points** for an Ancient's Banner of Macragge on top of the reviewed 1st–2nd or 3rd+ points tier | Banner once-per-battle and objective-control effects, model removal and surge moves are manual; no alternate unit-wide wounds |
| Wardens of Ultramar | **Six named individuals**, each with exact per-model T/Sv/W/OC and distinct fixed weapons. All six appear in a separate read-only individual reference table. Standard and Saturation firing modes of the single Bolt Rifle remain paired | No fictional aggregate Wounds/Toughness is fed into the calculator; allocate attacks/casualties by model manually. Support timing and redeployment effects remain manual |

### Attachment metadata

The existing roster attachment engine now supports reviewed Calgar bodyguards, Cato joining Victrix, and Wardens' Support options. It permits the specifically reviewed **Calgar + Cato + Victrix** arrangement, and requires a Support model to occupy a second attachment slot on other reviewed Space Marine bodyguards. It does not open a wildcard for all other Space Marine Characters or assert other factions' rules.

### Source limitations

- The existing Calgar profile already had the current weapon numbers, and is preserved. This pass marks it as a reviewed fixed equipped item rather than reconstructing an unreviewed variant.
- Wardens' *model-specific* combat characteristics cannot be represented accurately with one aggregate statline. The tactical damage calculator must not infer a unit-wide toughness or wound pool from those six individuals.
- Per-model Victrix Ancient/Champion choices are modeled within the total selected model count. The official June Faction Pack and current October-era reference are compared, but the current Codex and published card remain authoritative on specialist costs and use restrictions.
- Existing saved rosters are unchanged. The Space Marines catalog revision is incremented to prompt review.

## Remaining Space Marine verification

Continue with Sternguard Veterans, Inceptors, Eliminators, other named Characters (Titus, Tigurius, Guilliman), transport profiles, and full Leader/bodyguard and wargear audit. Confirm the latest GW MFM and current printed Codex directly, then complete the iPad Safari import/equipment/attack-mode trial. Physical secondary card comparisons remain deferred under issue #502.
