# Chapter Approved 2026–27 Secondary Mission Rules Audit

**Status: audit worksheet only — not an authoritative rules transcription.**

This document records the legacy V1 reference summaries for the 18 secondary cards so they can be checked against the actual Chapter Approved 2026–27 cards. It does not change V1 or V2 gameplay. None of the summaries below should be promoted to `rulesVerified: true` without direct card-text verification.

## Sources and trust level

1. **Primary rules source to verify against:** the physical/official Chapter Approved 2026–27 Secondary Mission cards. The publicly available Games Workshop article shows only two sample cards, not all 18.
   - [The Chapter Approved deck — What is it and how does it work?](https://www.warhammer-community.com/en-gb/articles/p3i6aa3h/the-chapter-approved-deck-what-is-it-and-how-does-it-work/)
   - [Official sample card image 1](https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards1-s8wf8ybsuf.jpg)
   - [Official sample card image 2](https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards2-myplj4vtwi.jpg)
2. **Official general timing/cap rules and specific FAQ answers:** [Warhammer Event Companion v1.2 (official Games Workshop PDF, August 2026)](https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf). It documents scoring checkpoints and caps, but does not reproduce the full text of the secondary cards. Its FAQ explicitly distinguishes the end of the battle from the end of the fifth battle round and says end-of-battle VP is not subject to the 15 VP per battle-round cap; the 45 VP game cap and 20 VP per Fixed card cap still apply. It also directly clarifies the Beacon replacement restriction and that Plunder's territory restriction refers to the terrain area.
3. **Independent text transcriptions for cross-checking, not official sources:** [GDM 2026 secondary mission index](https://gdmissions.app/11th/secondary-missions), [GDM 2026 version history](https://gdmissions.app/version-history), [Wahapedia's Chapter Approved secondary mission text](https://wahapedia.ru/wh40k11ed/the-rules/warhammer-event-companion/), and [11th.help's secondary mission reference](https://www.11th.help/secondary_missions.html). GDM provides readable/selectable card text and a version history; use these sources to reconcile claims, not to promote a V2 card to `rulesVerified: true`.
4. **Legacy cross-check only:** `Grumpa916/onoforge40k` `index.html`, commit `c5a9dc058615b16e8f5edde03313b1a7ac0ca825`. This repository is preserved and must not be modified as part of V2 work.
5. **Unofficial community cross-check only:** [IRONBUILT dataset pinned to commit `6f61cb3796f79348b81389ec0eb32d461b675d02`](https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/6f61cb3796f79348b81389ec0eb32d461b675d02/datasets/wh40k-11e-missions.json). Do not use it alone to verify a card.

## Legacy summary inventory

The following summaries are transcribed from the legacy V1 data and are **pending card-by-card verification**. Wording is condensed legacy wording, not claimed to be the official card text.

| Card | Fixed/Tactical in legacy reference | Legacy scoring summary | Verification notes |
|---|---|---|---|
| A Grievous Blow | Fixed and Tactical | Fixed: 4 VP per enemy unit with Starting Strength 13+ destroyed this turn. Tactical draft: 5 VP if one or more such units were destroyed this turn. | **Third-party discrepancy:** GDM's v3.5 changelog explicitly says Tactical is a flat 5 VP for one or more qualifying units and that the MAX 5 VP cap was removed from both sides; the current 11th.help transcription still displays a 5 VP cap marker on the Tactical line. Draft follows GDM but remains unverified until direct official-card checking. |
| A Tempting Target | Tactical | 5 VP for controlling the opponent-selected tempting target objective. | Verify when control is checked and exact target restrictions. |
| Assassination | Fixed and Tactical | Fixed: 3 VP per enemy CHARACTER model destroyed this turn, plus 1 VP for each of those models with 4+ Wounds (cumulative). Tactical: 5 VP if one or more enemy CHARACTER models were destroyed this turn, or all enemy CHARACTER models have been destroyed during the battle. | Scoring windows partially transcribed from official sample card; confirm complete card wording before treating any additional details as verified. |
| Beacon | Tactical | 3 VP if, at end of opponent's turn or end of battle round five, the selected beacon unit is on the battlefield and outside your deployment zone; 5 VP if it is on the battlefield and outside your territory. | Verify whether the second tier shares the same timing and exact cumulative/alternative relationship. |
| Behind Enemy Lines | Tactical | 3 VP per eligible friendly unit wholly within the opponent's deployment zone; max 5 VP. Excludes AIRCRAFT and Battle-shocked units. | Verify scoring checkpoint and whether any first-round redraw text is present. |
| Bring it Down | Fixed and Tactical | Fixed: 4 VP per enemy model with 10+ Wounds destroyed this turn. Tactical draft: 5 VP if one or more such models were destroyed this turn. | **Third-party discrepancy:** same GDM changelog correction and 11th.help cap marker conflict as A Grievous Blow. Draft follows GDM, not official-card verified. Check the when-drawn condition too. |
| Burden of Trust | Tactical | 2 VP per objective guarded by your army; max 5 VP. | Verify guard-selection rules, duration, and scoring timing. |
| Centre Ground | Tactical | 3 VP if an eligible friendly unit is within 3" of battlefield centre and no enemy unit is within 3" of centre; 5 VP if no enemy unit is within 6" of centre. Eligible friendly units exclude AIRCRAFT and Battle-shocked units. | Public official sample image is available; retain its current verified status only for the exact text actually visible there. |
| Cleanse | Tactical | 2 VP if one objective was cleansed by your army this turn; 5 VP if two or more objectives were cleansed this turn. | Verify action requirements, timing, and interaction with Plunder. |
| Defend Stronghold | Tactical | 3 VP for controlling your home objective, plus 2 VP if no enemy units are within your deployment zone. | Legacy metadata says unavailable in battle round one and describes cumulative scoring; verify exact card text and timing. |
| Display of Might | Tactical | 2 VP at end of your turn if more eligible friendly units than enemy units are wholly within No Man's Land; 5 VP at end of opponent's turn for the same comparison. | Verify which units are eligible and the precise checkpoints. |
| Engage on All Fronts | Fixed and Tactical | Fixed: 2 VP for presence in three table quarters; 4 VP for presence in four. Tactical: 3 VP for three quarters; 5 VP for four. | Legacy metadata marks the tiers as mutually exclusive; verify exact presence requirements and exclusivity. |
| Forward Position | Tactical | 5 VP for controlling the opponent's home objective and/or expansion objectives. | Verify whether the card grants one combined score or separate scoring conditions and whether first-round redraw text applies. |
| No Prisoners | Tactical | 2 VP per enemy unit destroyed this turn; max 5 VP. | Verify scoring timing and exact cap wording. |
| Outflank | Tactical | 3 VP if one or more eligible friendly units are within 6" of one or more battlefield edges and outside your territory; 5 VP if two or more eligible friendly units are within 6" of opposite battlefield edges and at least one is outside your territory. Eligible units exclude AIRCRAFT and Battle-shocked units. | Verify whether tiers are alternative or cumulative and exact wording. |
| Overwhelming Force | Tactical | 3 VP per enemy unit that started the turn within range of one or more objectives and was destroyed; max 5 VP. | Verify what counts as being within range and exact timing. |
| Plunder | Tactical | 5 VP if a terrain area was plundered this turn. | Verify action details and interaction with Cleanse. |
| Secure No Man's Land | Tactical | 5 VP for controlling two or more No Man's Land objectives, excluding your home objective. | Verify timing and exact objective restrictions. |

## Legacy special-rule metadata to verify

The legacy V1 reference also records these special cases. Treat all as pending verification:

- **A Grievous Blow:** when drawn in Tactical mode, may be redrawn if no enemy units with Starting Strength 13+ are on the battlefield.
- **A Tempting Target:** opponent selects a No Man's Land objective, excluding home objectives, as the tempting target.
- **Beacon:** select a friendly unit on the battlefield or embarked within a TRANSPORT on the battlefield as the beacon unit.
- **Behind Enemy Lines:** first battle round may permit a redraw and shuffle-back.
- **Bring it Down:** may be redrawn if no enemy models with 10+ Wounds are on the battlefield.
- **Burden of Trust:** select a friendly unit on the battlefield to guard each objective until the start of your next turn.
- **Cleanse / Plunder:** each card has a legacy when-drawn interaction with the other card being active.
- **Defend Stronghold:** legacy metadata says it is available from battle round two and its tiers are cumulative to 5 VP.
- **Engage on All Fronts:** legacy metadata marks the scoring tiers as exclusive.
- **Forward Position:** first battle round may permit a redraw and shuffle-back.

## Official FAQ evidence found (reviewed 10 October 2026)

The current 11th-edition [Warhammer Event Companion v1.2 (August 2026)](https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf) is available through the official Games Workshop asset URL and is indexed in the 11th-edition rules reference. Its FAQ gives direct official answers to two card-specific interactions:

- **Beacon:** if the selected Beacon unit is destroyed before the mission is achieved, the player cannot select a replacement Beacon unit.
- **Plunder:** “not within your territory” refers to the terrain area, not the unit.
- **Scoring caps:** VP scored at the end of the battle is not subject to the 15 VP per battle-round limit. The battle-wide 45 VP secondary cap and 20 VP Fixed-card cap still apply.

These FAQ answers are official evidence for the listed interactions and cap rules, but **they do not reproduce or verify the complete scoring text of Beacon or Plunder**. Both cards remain `rulesVerified: false`, and the catalog’s draft windows remain manual-review-only. The companion’s mission-deck FAQ does not provide a full official transcription of all 18 secondary cards; the Games Workshop article’s publicly available sample images still show only Assassination and Centre Ground.

- [Official Warhammer Event Companion v1.2 PDF](https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf)
- [11th-edition reference index for the companion and FAQ](https://wahapedia.ru/wh40k11ed/the-rules/warhammer-event-companion/)

## Independent-transcription reconciliation (reviewed 9 October 2026)

GDM 2026 is the strongest additional practical cross-check found so far: it provides a page for each secondary, readable/selectable card text, card imagery, and a version history. I inspected its current reproduced card images for all 18 secondaries and compared the visible scoring windows, tier relationships, timing labels, and special-rule notes against 11th.help. Its version history says the readable full card-text sections were added in v4.2 (3 July 2026), and the latest secondary card artwork was refreshed in v4.9 (25 July 2026). Its v3.5 entry (15 June 2026) records a specific correction to **A Grievous Blow** and **Bring it Down**. These are still unofficial transcriptions, not the authority for setting `rulesVerified: true`.

- [GDM 2026 secondary index](https://gdmissions.app/11th/secondary-missions)
- [GDM 2026 version history](https://gdmissions.app/version-history)
- [11th.help secondary index](https://www.11th.help/secondary_missions.html)

| Card | Third-party comparison result | Required V2 handling |
|---|---|---|
| A Grievous Blow | **Conflict.** GDM v3.5 says Tactical is a flat 5 VP when one or more qualifying units are destroyed and says the MAX 5 VP cap was removed from both sides. The current 11th.help transcription still displays a 5 VP cap marker on its Tactical line. | Draft reflects the flat 5 VP trigger and no tier-level `maxVP`; keep unverified pending official card text. |
| A Tempting Target | Broad agreement on opponent-selected No Man's Land target (excluding home objectives), 5 VP for controlling it, and end-of-your-turn timing. | Keep unverified. |
| Assassination | Broad agreement on Fixed 3 VP per CHARACTER model plus a cumulative +1 VP for each destroyed CHARACTER with 4+ Wounds, and Tactical 5 VP for a qualifying destruction event or all enemy CHARACTER models destroyed in the battle. Official sample-card verification remains limited to the text actually visible in the official sample. | Existing official-sample status retained only for that visible text. |
| Beacon | Broad agreement on selected beacon unit, opponent-turn/fifth-round timing, and 3 VP / exclusive 5 VP position tiers. | Keep unverified. |
| Behind Enemy Lines | Broad agreement on first-round redraw, 3 VP per eligible unit wholly in the opponent's deployment zone, and 5 VP maximum. | Keep unverified. |
| Bring it Down | **Conflict.** GDM v3.5 says Tactical is a flat 5 VP when one or more qualifying models are destroyed and says the MAX 5 VP cap was removed from both sides. The current 11th.help transcription still displays a 5 VP cap marker on its Tactical line. | Draft reflects the flat 5 VP trigger and no tier-level `maxVP`; keep unverified pending official card text. |
| Burden of Trust | Broad agreement on selecting a guarding unit per objective, duration through the start of the next turn, and 2 VP per guarded objective up to 5 VP. | Keep unverified. |
| Centre Ground | Broad agreement on the 3-inch friendly-unit condition and 3 VP / exclusive 5 VP enemy-proximity tiers; an official sample image exists. | Existing official-sample status retained only for the text visible in that image. |
| Cleanse | Broad agreement on 2 VP for one objective and exclusive 5 VP for two or more, end-of-your-turn timing, the Plunder redraw interaction, and the Objective Action requirements (start in Shooting; exclude home objective; different objective per unit; complete at end of turn while controlling it). | Keep unverified. |
| Defend Stronghold | Broad agreement on first-round redraw, availability from round two, and 3 VP home-objective control plus a cumulative 2 VP if no enemy units are in your deployment zone. | Keep unverified despite transcription agreement. |
| Display of Might | Broad agreement on eligible units wholly within No Man's Land and the 2 VP own-turn / 5 VP opponent-turn checkpoints. | Keep unverified. |
| Engage on All Fronts | Broad agreement on quarter-presence requirements and mutually exclusive 2/4 VP Fixed or 3/5 VP Tactical tiers. | Keep unverified. |
| Forward Position | Broad agreement on first-round redraw and 5 VP for controlling the opponent's home objective and/or expansion objective(s). | Keep unverified. |
| No Prisoners | Broad agreement on 2 VP per enemy unit destroyed this turn, up to 5 VP, at end of either player's turn. | Keep unverified. |
| Outflank | Broad agreement on edge-distance/territory conditions and mutually exclusive 3 VP / 5 VP tiers. | Keep unverified. |
| Overwhelming Force | Broad agreement on 3 VP per destroyed enemy unit that started the turn within objective range, up to 5 VP. | Keep unverified. |
| Plunder | Broad agreement on 5 VP for plundering a terrain area and the Cleanse redraw interaction. | Keep unverified. |
| Secure No Man's Land | Broad agreement on 5 VP for controlling at least two eligible No Man's Land objectives. | Keep unverified. |

**Interpretation:** the two unofficial transcriptions appear broadly aligned on the other cards' draft summaries, but agreement between secondary sources is not official verification. Only Assassination and Centre Ground retain their already-limited official-sample status. All other cards remain manual-review-only with `rulesVerified: false`. The global 15 VP per battle-round / 45 VP battle caps and the 20 VP Fixed-card cap are handled by the scoring system, not inferred from per-card draft text.

## Implementation guardrails

- Keep all 18 V2 card names and Fixed/Tactical availability as currently catalogued unless verified card text establishes a correction.
- Keep unverified rules visibly unverified. Do not convert legacy summaries directly into verified rules.
- Any draft scoring-window metadata must use an explicit legacy/unverified provenance marker and must continue to require player review. It must never award VP automatically.
- Preserve the existing global caps: 15 VP per turn and 45 VP per battle for secondaries; additionally, no more than 20 VP from any one Fixed secondary card.
- Verify timing separately from scoring conditions. A condition's existence does not establish whether it is checked at end of your turn, end of opponent's turn, or end of battle.
- The A Grievous Blow / Bring it Down cross-source disagreement is now recorded in the independent-transcription reconciliation section. Their draft tiers follow GDM's explicit correction but remain unverified until the actual official cards are checked.
