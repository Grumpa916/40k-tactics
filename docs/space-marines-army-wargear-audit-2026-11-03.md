# Space Marines Army Builder / Codex audit — 3 November 2026

## Scope and source authority

This audit updates a **verified subset** of the Space Marines Army Builder data, without claiming that all Codex weapons or datasheets have been fully reconciled.

- Games Workshop official [Warhammer 40,000 downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) lists the Munitorum Field Manual updated **14 October 2026**.
- [Games Workshop Space Marine Codex preview (24 August)](https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/) confirms the official baseline characteristic changes: Tacticus Toughness 5, Phobos Move 8 and Toughness 4, and Terminators Toughness 6.
- [Games Workshop 30 September balance update](https://www.warhammer-community.com/en-gb/articles/rylbvfnv/warhammer-40000-balance-update-emboldened-astartes/) independently confirms these armour-class distinctions.
- [Warp Nexus independent MFM comparison, 2 October](https://warpnexus.app/updates/2026-10-02/) records the GW price changes, unit-size and extra-copy tiers. [Its 14 October comparison](https://warpnexus.app/updates/2026-10-14/) reports no subsequent Space Marine price change. This fan-made source corroborates the updated figures but is *not* itself a GW publication. The live MFM still requires a fresh direct page-level verification.
- Official [MFM Space Marines](https://mfm.warhammer-community.com/en/space-marines) is the definitive price source. Automated browser indexing may return a stale earlier snapshot; **do not treat old indexed values as current**.

## Completed changes in this PR

1. A separate immutable, dated points table adds reviewed sizes and copy-tier conditions for **28 Space Marine entries**. Examples:
   - Intercessor Squad: 5 models / 85 pts, 10 models / 170 pts
   - Aggressor Squad: 3 / 90, 6 / 180 (first two copies); 3 / 100, 6 / 190 (third+)
   - Bladeguard Veterans: 3 / 90, 6 / 180; third+ 3 / 110, 6 / 200
   - Eradicators with melta rifles: 3 / 100, 6 / 200; third+ 3 / 120, 6 / 220
   - Land Raider: 245 first, 265 second+; Crusader 230 / 250
   - Repulsor Executioner: **260 pts** (corrects outdated local 270-point default)
2. The existing Army Builder unit-size selector and ordinal cost resolver consume those records automatically. No new, unreviewed wargear options were invented.
3. Corrected **15 selected baseline characteristic records**: six Tacticus squads (T5), two Terminator squads (T6), seven Phobos units (Move 8; T4). No changes to unconfirmed weapon numbers, firing modes, model-specific invulnerable saves, Leader links or abilities.
4. An explicit warning identifies the difference between *possible weapon profiles* and *actually selected weapons* for Space Marines. Their full replacement-equipment picker is still **not** implemented.
5. Bumped the Space Marines catalog revision so saved rosters from the previous baseline ask for revalidation. **Saved armies are never edited by this change.**
6. Regression tests assert 28 source-linked entries, model count availability, first/third-copy price selection, the stale Repulsor correction, 15 characteristic patches, and the wargear warning.

## Known gaps / next Codex pass

| Priority | Missing or pending |
|---|---|
| High | Full Space Marines **Codex equipment options**, replacement constraints, per-model quantities and weapon profiles. A profile's presence in the local reference is not proof that a unit carries it |
| High | Unit-specific official MFM live-page verification for every remaining entry and chapter-specific variants. Imported default points are unchanged unless independently corroborated |
| High | Codex-era **Legends / Legendary Proxy** eligibility and newer unit names; do not silently mark legacy units tournament-legal |
| Medium | Every Leader/Support attachment restriction from the official current MFM and Codex, including revised Ultramarines choices |
| Medium | Detachment stratagems, enhancement points, invulnerable saves, FNP, specific abilities, and damage-calculation effects |

**Dependency:** PR #505 (general roster-cost consistency/completeness audit) has merged into main. Its conditional-pricing validator can now check saved Space Marine unit-copy costs against the reviewed MFM options in this change.

**Acceptance:** automated verification + production build required; manual iPad Safari and user Army Builder roster comparison still pending. No changes to current game battles, mission/scoring code or saved rosters.
