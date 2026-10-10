# Chapter Approved 2026–27 Secondary Mission Rules Audit

**Status: audit worksheet only — not an authoritative rules transcription.**

This document records the legacy V1 reference summaries for the 18 secondary cards so they can be checked against the actual Chapter Approved 2026–27 cards. It does not change V1 or V2 gameplay. None of the summaries below should be promoted to `rulesVerified: true` without direct card-text verification.

## Sources and trust level

1. **Primary rules source to verify against:** the physical/official Chapter Approved 2026–27 Secondary Mission cards. The publicly available Games Workshop article shows only two sample cards, not all 18.
   - [The Chapter Approved deck — What is it and how does it work?](https://www.warhammer-community.com/en-gb/articles/p3i6aa3h/the-chapter-approved-deck-what-is-it-and-how-does-it-work/)
   - [Official sample card image 1](https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards1-s8wf8ybsuf.jpg)
   - [Official sample card image 2](https://assets.warhammer-community.com/40k_chapterapproved-may28_secondcards2-myplj4vtwi.jpg)
2. **Official general timing/cap rules:** [Warhammer Event Companion v1.0 (PDF)](https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf). It documents the scoring checkpoints and caps, but does not reproduce the full text of the secondary cards.
3. **Legacy cross-check only:** `Grumpa916/onoforge40k` `index.html`, commit `c5a9dc058615b16e8f5edde03313b1a7ac0ca825`. This repository is preserved and must not be modified as part of V2 work.
4. **Unofficial community cross-check only:** [IRONBUILT dataset pinned to commit `6f61cb3796f79348b81389ec0eb32d461b675d02`](https://github.com/IRONBUILT-LLC/ironbuilt-data/blob/6f61cb3796f79348b81389ec0eb32d461b675d02/datasets/wh40k-11e-missions.json). Do not use it alone to verify a card.

## Legacy summary inventory

The following summaries are transcribed from the legacy V1 data and are **pending card-by-card verification**. Wording is condensed legacy wording, not claimed to be the official card text.

| Card | Fixed/Tactical in legacy reference | Legacy scoring summary | Verification notes |
|---|---|---|---|
| A Grievous Blow | Fixed and Tactical | Fixed: 4 VP per enemy unit with Starting Strength 13+ destroyed this turn. Tactical: 5 VP (max 5) per such unit destroyed this turn. | **Known conflict:** pinned community dataset describes Tactical as 5 VP if one or more qualifying units were destroyed, not 5 VP per unit. Must inspect actual card. |
| A Tempting Target | Tactical | 5 VP for controlling the opponent-selected tempting target objective. | Verify when control is checked and exact target restrictions. |
| Assassination | Fixed and Tactical | Fixed: 3 VP per enemy CHARACTER model destroyed this turn, plus 1 VP for each of those models with 4+ Wounds (cumulative). Tactical: 5 VP if one or more enemy CHARACTER models were destroyed this turn, or all enemy CHARACTER models have been destroyed during the battle. | Scoring windows partially transcribed from official sample card; confirm complete card wording before treating any additional details as verified. |
| Beacon | Tactical | 3 VP if, at end of opponent's turn or end of battle round five, the selected beacon unit is on the battlefield and outside your deployment zone; 5 VP if it is on the battlefield and outside your territory. | Verify whether the second tier shares the same timing and exact cumulative/alternative relationship. |
| Behind Enemy Lines | Tactical | 3 VP per eligible friendly unit wholly within the opponent's deployment zone; max 5 VP. Excludes AIRCRAFT and Battle-shocked units. | Verify scoring checkpoint and whether any first-round redraw text is present. |
| Bring it Down | Fixed and Tactical | Fixed: 4 VP per enemy model with 10+ Wounds destroyed this turn. Tactical: 5 VP (max 5) per such model destroyed this turn. | Verify Tactical per-model wording against the actual card; check when-drawn condition. |
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

## Implementation guardrails

- Keep all 18 V2 card names and Fixed/Tactical availability as currently catalogued unless verified card text establishes a correction.
- Keep unverified rules visibly unverified. Do not convert legacy summaries directly into verified rules.
- Any draft scoring-window metadata must use an explicit legacy/unverified provenance marker and must continue to require player review. It must never award VP automatically.
- Preserve the existing global caps: 15 VP per turn and 45 VP per battle for secondaries; additionally, no more than 20 VP from any one Fixed secondary card.
- Verify timing separately from scoring conditions. A condition's existence does not establish whether it is checked at end of your turn, end of opponent's turn, or end of battle.
- Before implementation, resolve the A Grievous Blow Tactical discrepancy and any tier relationships (cumulative versus mutually exclusive) from the actual card.
