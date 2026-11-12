# Space Marines 11e completion tranche — detachments and enhancements (11 November 2026)

## Scope and source confidence
This PR extends the existing 87 / 87 independently reviewed, non-Legends Space Marines unit catalog. It does **not** supersede the earlier caution: all 87 units still await a full direct October GW Codex / official current MFM per-datasheet certification. It adds the **16 current core Codex detachments** and **33 currently indexed Enhancements/Upgrades**, source-labeled and with durable selection and point-cost checks.

### Direct GW primary evidence
- https://www.warhammer-community.com/en-gb/articles/zcobdkzh/your-first-look-at-15-new-space-marine-detachments/ (11 Sept 2026) describes three mutually exclusive 'Unique: Doctrines' detachments and Gladius's extra use of a doctrine.
- https://www.warhammer-community.com/en-gb/articles/ifgezlgu/space-marines-rules-first-look/ (10 Sept 2026) establishes new Combat Doctrines.
- https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/ (updated 14 Oct 2026) indexes GW MFM/Codex updates.

### Current independent source (not GW-certified per numeric row)
- https://tactical40k.com/codex/space-marines (11e content through 30 Oct 2026) provides 16 active detachments, separate 11 Legends detachments and eligible enhancement text/points.
- https://warmind.online/factions/space-marines (8 Nov 2026) supports 87 unit entries, includes Legends and chapter-supplement detachments; its 48-enhancement list includes older chapter options and omits some currently indexed core Codex upgrades. Do **not** treat its 48 as 48 eligible current-core enhancements.

**Known conflict:** An older local detachment list uses Ironstorm Spearhead at 2DP and Stormlance Task Force at 3DP. Current 11e secondary source lists **1DP each**. This PR updates them and labels source certainty rather than misrepresenting direct GW MFM verification. The current MFM live URL remains inaccessible for a complete authoritative check.

## Implemented
- 16 current Codex detachment names, DP, force disposition(s) and phase-rule summaries; unique Doctrines restriction for Assault/Tactical/Devastator Brethren.
- Preserves all 22 older detachment entries when not superseded, resulting in **35 indexed entries** (16 current + 19 older preserved). Explicit Legends (10 old entries present; Vengeful Hosts is listed among 11 external Legends but wasn't in the original local catalog) are flagged and disabled for new selections. Older non-Legends chapter supplements are explicitly marked **eligibility unverified**, not silently deleted or mislabeled as current Codex.
- **33 current 11e enhancements**, keyed by **detachment + name** because Venator Omni-auspex appears in two detachments. Eligibility distinguishes model-only (usually non-Epic Hero Characters) vs unit-only Upgrades (non-Characters permitted), checks armor keywords and specific models, and caps at 2 Incursion / 4 Strike Force. Ordinary unique limits are one per army, Upgrades max three copies, first instance counts to enhancement limit.
- iPad unit editor uses a minimum 44px selection control, exact points and read-only effect summary, never silently overwrites previously saved weapons.
- Unit-upgrade points feed into the shared Army Builder totals, source validation and saved-roster revision system.
- Existing stored roster detachments are preserved; older saved Legends selections appear as labeled warnings, not deleted or silently normalized.

## Follow-up work not claimed complete
1. **Current GW October 2026 MFM**: verify all 87 unit size/copy-order and wargear-surcharge points, **every detachment DP, disposition, and 33 current core enhancement values**, plus supplementary chapter-specific price entries.
2. **Complete October Codex/errata**: compare unit weapons, FAQ and army rule details; source field mismatches still pending for Captain/Lieutenant Phobos, Cato Sicarius, Feirros/Techmarine, leader attachment/chapter restrictions.
3. **Chapter supplement enhancements**: existing Ultramarines/Imperial Fists/Salamanders etc enhancements are not automatically included as core Codex enhancements; verify supplements and introduce these as separately sourced catalogs.
4. **51+ stratagems and combat doctrine live state**: need all new 16 detachments' stratagems and phase timing, spent doctrine recording, once-per-battle limits, and conditional Tactical Advisor effects. Current upgrade effects are rendered as references, not fully evaluated as automatic combat modifiers.
5. **Real iPad acceptance**: inspect the current/Legends grouping, touch controls, saved imported armies, exact costs and battle setup with your Space Marine opponent.
6. **Legends**: 89 indexed Legends candidates remain explicitly outside routine matched-play lists. Supplementary chapter detachments remain source-pending, even if still usable in previously saved lists.

**Acceptance:** All automated tests and build must pass before merge, and PR requires user review; no change is automatically deployed.
