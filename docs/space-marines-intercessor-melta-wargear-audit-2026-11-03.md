# Space Marines wargear verification — Intercessors and Melta Eradicators

Audit date: 2026-11-03 (Pacific). This is a **focused current 11th-edition datasheet comparison**, not a claim that the entire October 2026 printed Codex or latest Munitorum Field Manual was independently transcribed.

## Source authority and limits

- **Games Workshop official Codex preview**, [Big Space Marines News, 24 August 2026](https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/): confirms Intercessor bolt rifles gain two firing profiles with Strength 5 and Strength 6, and Tacticus models are T5.
- **Games Workshop official kit preview**, [New Space Marines infantry revealed, 31 August 2026](https://www.warhammer-community.com/en-gb/articles/betdve0h/new-space-marines-infantry-revealed/): describes ten Intercessor bodies with two auxiliary grenade launchers and Sergeant chainsword/power sword/power fist weapon options.
- **Current 11e datasheet transcriptions**, [Intercessor Squad](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Intercessor-Squad) and [Eradicator Squad with Melta Rifles](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Eradicator-Squad-with-Melta-Rifles): supply exact available selection lists, two bolt rifle modes, melta Hunter profiles and additional-copy price tiers. These are independent transcriptions of current game data; **do not label them independently checked official Codex text**.
- **Official Munitorum Field Manual**, [Space Marines](https://mfm.warhammer-community.com/en/space-marines) remains the authoritative pricing source; current October 14 source-index record and prior independently checked MFM options remain in use. No speculative points changes were made in this PR.

## Newly supported live equipment choices

| Squad | Wargear selection and quantities | Combat reference |
| --- | --- | --- |
| Intercessor Squad | The Sergeant can separately replace **Knives and Fists** with Chainsword, Power Fist, Power Weapon or Thunder Hammer; and separately replace the **Bolt Rifle** with Chainsword, Hand Flamer, Plasma Pistol or Power Weapon. Ordinary squad members retain their standard equipment. One ordinary Intercessor per five models can add a Grenade Launcher | Bolt Rifle has *Focused Fire* (S6, Damage 2, Heavy/Rapid Fire 1) and *Saturation* (S5, Damage 1, Assault/Rapid Fire 1). Updated pistol, plasma, launcher Frag/Krak and Sergeant melee profiles |
| Eradicator Squad with Melta Rifles | Fixed bolt pistols and Ceramite Fists; up to **one Multi-melta replacement for every three models**. Unit sizes 3 and 6 as already priced | Melta Rifle and Multi-melta each provide normal and **Hunter: Monster/Vehicle** attack modes, not additional weapons. Hunter BS2+, S12; standard profiles BS3+, S10. The Total Obliteration damage reroll is noted, not applied automatically |

The rule-set engine already handles fixed equipment, Sergeant replacement slots, unit size changes and per-model rifle replacements. A small shared extension adds a real **one per N models** maximum for optional equipment. That limit is used consistently by touch controls, unit resizing, restored saved equipment and legality checks.

Because a model's **Hunter** / **Saturation** fire mode is a choice made for an attack, the app lists those as profiles of **one equipped weapon**, rather than claiming that two weapons were mounted or fired simultaneously. It must still defer target keyword eligibility, weapon-mode legality and tabletop range to the players, rather than automatically assuming either attack profile is allowed.

## Safety and existing rosters

- Explicitly preserves the saved roster, the original Calgar stable ID and the previous two waves of source-reviewed Space Marines weapons.
- Does not add any automatic objective scoring or require tracking mission Actions, consistent with the manual-scoring plan.
- The Serjeant-only Intercessor model positions are represented as two separate equipment slots, while default weapons of other squad members remain fixed. An added Grenade Launcher is assigned to a regular Intercessor; the app tracks total quantity but **not which specific physical regular model carries it**, so that model is identified on the tabletop.
- The existing profiles for **Hellblasters, Bladeguard, Terminator Squads, Victrix, Wardens, Calgar weapons and vehicles** remain pending per-datasheet current official Codex checks. Their editor continues to mark selectable wargear as unreviewed.
- Revision stamp is incremented so saved Space Marines rosters can be explicitly revalidated before play; no stored points or weapons are overwritten.

## Remaining priority order

1. Complete **Terminator Squad** (storm bolter/assault cannon/cyclone/heavy flamer limits, Sergeant equipment, model sizes and special firing profiles).
2. Complete **Bladeguard Veteran Squad** and **Hellblaster Squad**, then selected named Ultramarines: Calgar, Victrix, Wardens and Cato Sicarius.
3. Cross-compare the latest official Codex and GW MFM for every named entry, equipment cost and Leader/Bodyguard rule, including variants and current errata.
4. iPad Safari live acceptance: model-count selection, restoring imported weapon choices, and testing real shooting/fight with split fire and Hunter-only targets.

All tests and production build must pass before proposing merge into `main`.
