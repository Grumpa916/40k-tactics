# Official rules-source verification — 2026-11-03

## Result and limitations

This is a **source-authority and publication-version verification pass**. It is not a complete page-by-page re-extraction of the current official PDFs or a comparison of the user's physical Chapter Approved mission cards. The official Warhammer Community download listing was checked on 2026-11-03. Where the current document PDF text could not be fetched independently, this report marks that explicitly; existing accepted map geometry and rules are not silently re-certified.

Official index: https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/

| Source | Current GW listing | V2 status |
|---|---|---|
| Warhammer Event Companion | Updated 2026-10-14; repository references v1.2 | Previously user-reviewed terrain geometry remains unchanged; current PDF content not re-compared |
| Munitorum Field Manual | Updated 2026-10-14 | Custodes and Tyranids revision stamps cite October MFM; Space Marines points still await a post-update comparison |
| Core Rules | Updated 2026-06-01 | Publication dated; full content not independently re-audited |
| Universal Rules Updates | Updated 2026-08-26 | Publication dated; full content not independently re-audited |
| Adeptus Custodes download | Updated 2026-10-14 | Faction review in next wargear/data audit |
| Tyranids Faction Pack | Updated 2026-10-14 | Existing revision stamp references October v1.3; next datasheet review pending |
| Space Marines download | Updated 2026-10-14 | **Needs priority review**: catalog still identifies earlier faction-pack baseline and unverified MFM export points |

October update notice, 2026-10-29: https://www.warhammer-community.com/en-gb/articles/cumo9vbg/the-warhammer-40000-updates-update/

Games Workshop stated that the October rules changes had rolled out in several downloads and that the next scheduled quarterly balance update would be in the week beginning 2026-12-07. The source index deliberately records what was **listed** and what remains **unchecked**, rather than using a universal “official verified” flag.

## Mission scoring / Event Companion

The earlier official Warhammer Event Companion v1.0 provides direct corroboration for the event mission sequence, player-confirmed scoring, Fixed-card persistence, Tactical end-turn discard/CP, and VP caps (45 primary, 45 secondary, 15 each per battle round, 20 per Fixed card). The app already includes those behaviors and the resulting static regression tests preserve them.

Official initial publication: https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf

The V2 map catalog uses the official v1.2 PDF reference already visually reviewed by the user. No changes were made to its layout geometry, distances, names, or positioning.

## Mission-card provenance, kept separate from official publication status

- **25 Primary Mission pairings** — Community-derived structured reference; all stay `officialCardVerified: false` and `rulesVerified: false`. They must not be presented as independently checked official printed-card text.
- **18 Secondary Mission cards** — `rulesVerified: true` continues to mean the rules were checked against the *previously supplied user transcription*. All carry `sourceVerification: "user-supplied-card-transcription"` and `officialCardVerified: false`. This distinction prevents a mistaken upgrade from transcription-reviewed to officially verified.
- **Manual scoring** remains unchanged: the tabletop result is agreed by players; Secondary Action completion is not tracked live.
- **Physical-card comparison** is on hold under issue #502: https://github.com/Grumpa916/40k-tactics/issues/502

## Changes in this PR

- Added a dated official publication/source index separate from actual content-verification status.
- Added explicit per-card source verification fields on 25 Primary and 18 Secondary records; do not alter card rules, VP, modes or timing.
- Corrected the Command phase wording that incorrectly called every secondary transcription an “official sample card.”
- Added provenance notes inside expanded Primary/Secondary mission references; keep the main live UI compact.
- Flagged Space Marines' October official-versus-catalog data check without silently replacing saved roster points or weapon profiles.
- Added regression tests checking official-publication dates, all catalog fields, the immutable event-map source, and VP cap invariants.

## Remaining official-content work

1. Compare **current v1.2 Event Companion PDF content** against accepted V2 event/terrain procedural rules when official PDF content is available; do not undo approved maps without confirmed discrepancy.
2. Check each of the 25 Primary Mission card texts/scoring details against current official Chapter Approved card printings and errata where accessible.
3. Compare Space Marines and then Custodes/Tyranids unit profiles, points and wargear against the October 14 official downloads in the next Army Builder audit; correct only documented differences.
4. Recheck this official index on the announced December balance-update week, or earlier if GW publishes a new Codex or update.

**Source checking is not a substitute for a physical iPad live-game acceptance pass.**
