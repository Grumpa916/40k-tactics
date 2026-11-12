# Tyranids — 11th-edition equipment, enhancements, points, and rules review (11 November 2026)

## Status and evidence policy

This is a **consolidated build audit**, NOT a complete direct-Games-Workshop certification. It includes the previously approved but currently conflicting PR #623 corrections, and adds the complete **30 standard enhancements + 4 Upgrades**, their point costs, eligibility, and saved roster wiring.

Official publication index: https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/
Current Tyranids Faction Pack URL: https://assets.warhammer-community.com/eng_14-10_wh40k_faction_pack_tyranids-an12izciwp-np2hnkcsje.pdf
Official MFM: https://mfm.warhammer-community.com/en/tyranids

**Access limits during this review:** the official October PDF exceeded the document retrieval tool's size limit (17 MB) and could not be directly read; the live official MFM returned HTTP 403. Consequently **do not claim October Faction Pack or MFM primary-source certification**. A directly read GW June 11e Faction Pack covered six specific datasheet field sets; the remaining entries were reviewed through 11th-edition secondary references. Official Codex: Tyranids content remains an independent source requirement.

Current secondary cross-check (states updated to October 30, 2026):
https://tactical40k.com/codex/tyranids
11th-edition core enhancement rules:
https://wahapedia.ru/wh40k11ed/the-rules/core-rules/

## Datasheets and wargear
- **57 catalog entries**, of which 52 currently used in matched play and five Legends.
- **56 structured loadout definitions**, including 12 with selectable equipment, 42 fixed-only, and two conventional-weaponless; Hyperadapted Raveners remains excluded from exact casualty-dependent loadouts.
- Carries forward six June GW datasheet field comparisons from the approved PR #623. Fixes: Red Terror unsupported Mobile keyword, Harridan missing Damaged condition, Barbed Hierodule has **two** bio-cannons.
- Distinguishes fixed equipment, alternate modes, optional gear, and equipment with multiple profiles.
- **Official current October per-datasheet weapon/stat/cost confirmation still pending**. No user-saved imported roster is silently rewritten.

## Detachments and stratagems
The catalog contains all 10 detachments: Ambush Predators, Assimilation Swarm, Crusher Stampede, Invasion Fleet, Subterranean Assault, Synaptic Nexus, Talons of the Norn Queen, Unending Swarm, Vanguard Onslaught, Warrior Bioform Onslaught. Its curated stratagem catalog remains available. Current primary-source per-wording certification of stratagem timing/effects remains open.

## Enhancements (new)
There are **34 selectable entries** across the ten detachments: 30 ordinary Enhancements and four Upgrades (two each in Ambush Predators and Talons of the Norn Queen). They have distinct model/unit eligibility restrictions, definitions, points costs, and detachment gating.

Current *secondary* 30 October values used for the two recently inconsistent prices:
- **Synaptoprescience** 30 points (Norn Assimilator; Upgrade, 4+ invulnerable save)
- **Hunting Grounds** 30 points (Vanguard Onslaught; normal Enhancement)
Earlier cached copies of the MFM list 25/20, respectively. **Do not backdate or mark these as direct MFM confirmation** until the official October site is accessible.

Core 11e enhancement restrictions applied:
- Strike Force 2,000 pts: maximum **4** enhancements, Incursion 1,000 pts: maximum **2**.
- One enhancement per unit, including attached-unit combinations; only non-Epic Hero Characters can receive ordinary enhancements, with some individual model exceptions.
- Upgrades may be given to eligible non-Characters, at most **3 copies** of the same name; the second and third copies do not count toward the army enhancement limit, but still cost points.
- A maximum of **2 Trygons** may gain the Character keyword in Subterranean Assault. These must be explicitly designated in the unit editor before applying Trygon Prime.
- Every enhancement is selected in the Army Builder on a minimum 44px control, stored on the exact unit in `unitUpgrades`, and added to base points without changing weapons or profile equipment selections. Duplicate and detachment conflicts block invalid saves.

## Points
The existing catalog contains model-size and later-copy price tiers for 57 entries, including Tyrannofex gun costs. We leave those base costs unchanged rather than transplanting an older official MFM or unverified third-party tiers into saved rosters. Enhancement costs are additional to the validated builder base cost and are separated into `basePoints`, `unitUpgrades`, and `points` for correct restamping and saved roster evaluation.

## Tactical Advisor
The exact equipped wargear and enhancement names flow into saved roster snapshots and the combat reference. Enhancement-specific **conditional** rules (e.g. selected targets, protection against specific attack types, active auras, Stratagem spend) must be applied only when their timing and conditions are recorded, rather than added to every forecast unconditionally.

## Remaining *primary-source* certification blockers
1. Retrieve and compare the **full October Faction Pack v1.3** PDF, including official FAQ/errata changes.
2. Confirm **all current October MFM** model-size/copy-order unit prices, enhancement/Upgrade points, and detachment dispositions; the portal currently blocks direct retrieval.
3. Obtain official current Codex text or official Warhammer App export to certify remaining 51 datasheets and all 10 detachment stratagem timing restrictions without guessing.
4. Complete model-specific casualty assignment for Hyperadapted Raveners and enforce exclusive firing profile use per phase.
5. Verify any rules-related changes through iPad live gameplay (including Norn effects and the Tyranid enhancement picker) before declaring production acceptance.
