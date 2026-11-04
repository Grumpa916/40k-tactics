# Space Marines — official Codex and Munitorum Field Manual verification ledger

**Audit date:** 4 November 2026. **Branch:** `feature/space-marines-gw-mfm-source-verification-20261104`.
**Pre-existing catalog:** 87 / 87 current non-Legends unit types reviewed against independent 11th-edition sources; **this is not official GW certification**.

## Verification grades and current results

| Evidence tier | Source | Date and status | Claim permitted |
| --- | --- | --- | --- |
| Primary, direct publication **index** | [GW Warhammer 40,000 downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) | Published index says MFM updated **14 Oct 2026**; visited 4 Nov | Confirms publication and date only; **not unit points** |
| Primary, direct GW **article** | [Emboldened Astartes balance announcement](https://www.warhammer-community.com/en-gb/articles/rylbvfnv/warhammer-40000-balance-update-emboldened-astartes/) | Published **30 Sep 2026**; inspected 4 Nov | Phobos infantry M8/T4 (applied), Tacticus/Terminator toughness increases, widespread S5 bolts/chainswords |
| Primary, direct GW **Codex preview** | [First look at Codex Space Marines datasheets](https://www.warhammer-community.com/en-gb/articles/paxsnmde/first-look-space-marines-datasheets/) | Published **14 Sep 2026**; inspected 4 Nov | Guilliman has all doctrines active; grants an additional doctrine to a friendly unit; Librarian psychic choice framework; Sternguard firing modes/Terminator Hunter. Not full Codex certification |
| Primary, current live **MFM row contents** | [GW Space Marines MFM](https://mfm.warhammer-community.com/en/space-marines) | Source access **blocked with 403**; search index available but crawled ~4 months earlier than current GW publication | **0 / 87** live official unit-price rows directly certified from current publication |
| Primary, printed/electronic **October Codex** | Codex: Space Marines + 14 Oct errata | Full codex text and updated official errata PDF not directly available from current source tools | **0 / 87** complete datasheets certified directly against official October Codex; never claim more |
| Secondary MFM changes | [Warp Nexus Oct 2 reported MFM comparison](https://warpnexus.app/updates/2026-10-02/) | 48 first-copy price rows and 23 additional-copy price rows checked in automated regression; 14 Oct [follow-up](https://warpnexus.app/updates/2026-10-14/) states other armies did not receive price change | **Independent corroboration, not live official MFM certification** |
| Secondary errata history | [Oct 14 GW errata reported in Warp Nexus](https://warpnexus.app/updates/2026-10-14/) and [11th-edition Oct 14 data-version changelog](https://game-datamissions.com/11th/rules/faction-changelog?v=981) | Both report updated GW errata; require direct official document to resolve conflicts | Evidence for issues to review, not automatic correction authority |

**Critical distinction:** The older indexed GW MFM page still shows prices such as **Ancient in Terminator Armour 65** and **Guilliman 340**, while the current independently reviewed roster uses **75** and **415**. Because the indexed GW page predates the Oct 2026 updates, these are **not grounds for repricing any unit**. A live current MFM read is mandatory before official price certification.

## Automated independent point comparisons

- `src/data/space-marines-official-source-audit.js` lists 48 changed first-copy price rows, 23 changed extra-copy price rows, source URLs and 87 explicit **pending-primary-source** statuses.
- `tests/state/space-marines-official-source-audit-20261104.test.js` compares these rows to actual `resolveBuilderUnitCost()` output with correct model counts and copy order; current source was Warp Nexus October 2, **not** the currently inaccessible GW MFM.
- Includes GW-published partial baseline checks, and preserves no-change flags to prevent cached 4-month-old information overriding current points.
- This audit does **not** silently change users' saved roster costs, codex abilities, wargear or gameplay state.

## Priority Codex/errata discrepancies to certify

| Priority | Unit(s) | Conflict / concern | Action after direct current official text |
| --- | --- | --- | --- |
| **P1** | Captain in Phobos Armour | The 14 October [GDM change log](https://game-datamissions.com/11th/rules/faction-changelog?v=981) reports Instigator Bolt Carbine changing A1 → A2 and S4 → S5 and gaining Rapid Fire 1/Assault. [Wahapedia 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Captain-In-Phobos-Armour) still reports A1/S4/Precision, which the current app follows. A [second 11e transcription](https://praetorium.gg/factions/space-marines/rules/space-marines-codex-2026-10-03/datasheets/captain-in-phobos-armour) reports A2/S5, but direct 14-Oct official evidence has not been read. | Check 14-Oct Codex errata and current datasheet; then correct A, S, traits and test baseline |
| **P1** | Cato Sicarius | The 14-Oct change log and [wh-rules 11e](https://wh-rules.ru/factions/space-marines/datasheets/cato-sicarius) report amended Talassarian Tempest Blade Strike (A5), Coup de Grace (A7/S6) and Sweep Sustained Hits 1 versus Infantry. The existing `src/data/space-marines-named-ultramarines-datasheets.js` **already matches those amended numbers**, while [Wahapedia 11e](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Cato-Sicarius) still shows older A4/6 and unrestricted Sweep. | Keep the current, later-version app values and certify them against direct GW Codex errata when available |
| **P1** | Lieutenant in Phobos Armour | October 14 [Warp Nexus](https://warpnexus.app/updates/2026-10-14/) describes the *scoped bolt carbine* at S5/AP-1, Assault and Rapid Fire 1 while [11e wh-rules](https://wh-rules.ru/factions/space-marines/datasheets/lieutenant-in-phobos-armour) lists **Master-crafted Bolt Carbine** S4/AP0 (the app's existing weapon). These may be different named weapons; do not conflate them. | Confirm correct equipped gun and legality from printed Codex/errata; correct only with model-specific official evidence |
| **P2** | Feirros and Techmarine | [14-Oct errata coverage](https://warpnexus.app/updates/2026-10-14/) specifies **the model**, not its attached unit, gains Lone Operative when near a friendly Astartes Vehicle. Current Tactical Advisor profile notes already say self/model. | Directly certify actual GW wording and inspect game logic for aura mistakenly applied to whole attached unit |
| **P2** | Terminator Librarian | [Oct-14 11e FAQ transcription](https://wh-rules.ru/factions/space-wolves/faq) adds CHARACTER keyword. | Validate against actual current GW PDF, then verify target/Leader eligibility and keywords |
| **P2** | Chapter-locked heroes | New 11e character profiles have conditional rules; `src/data/space-marines-catalog-coverage.js` identifies some as `Epic Hero` but chapter restrictions, dedicated support composition and one-per-army checks require a separate official Codex comparison. | Validate per-datasheet keywords, allowed bodyguards, Warlord restriction and chapter mixing |
| **P2** | Astraeus / Thunderhawk | Earlier audit flagged possible optional Ironhail and Cluster Bombs/Hellstrike package uncertainties from Forge World/Imperial Armour. | Verify against official Imperial Armour datasheets before certifying |
| **P3** | Original official Space Marines MFM + detachments | 87 unit prices, alternative squad sizes, duplicate-copy tiers, wargear premiums, 15 codex detachments, enhancements, DP and dispositions need primary-source extraction. | Link every row to a dated official snapshot and test; never assume the old cached page is current |

## Next primary-source pass

1. Obtain the **current live 14 October 2026 MFM Space Marines page**, via an accessible HTML export or user-supplied screenshot/PDF of the live page. Cross-check all 87 unit IDs, each permitted size, extra-copy tiers, per-model wargear premiums, support/leader eligibility, 15 codex detachment points/dispositions and enhancements.
2. Obtain the **full October 2026 Codex** in a permitted form plus current GW FAQs/errata. Compare each of the 87 datasheets' keywords, characteristics, weapons, alternate profiles, abilities, loadout replacements, chapter restrictions and attachments. Record line/page evidence for each.
3. Correct source-verified mismatches in **small feature PRs** with focused test cases; hold any contested secondary-source numbers as unverified, do not mutate saved armies automatically.
4. Re-run full GitHub Actions and test the iPad Safari landscape Army Builder and Tactical Advisor. Preserve manual VP/CP/wounds/battleshock/maps and 11e game-phase flexibility.

**Current merge impact:** This PR improves the evidence trail and adds independent price regression comparisons only. No tournament-level official certification is claimed and no points or weapon numbers are changed without primary-source proof. Main remains untouched pending user approval.
