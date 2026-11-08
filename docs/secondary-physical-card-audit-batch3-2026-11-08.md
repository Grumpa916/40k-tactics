# Secondary Mission physical card audit — 8 November 2026 (Batch 3 / final)

## Source and scope

Directly compared the final six **Chapter Approved 2026–27** Secondary Mission scoring/rules faces photographed by the user with `src/data/secondary-mission-catalog.js`, `src/data/secondary-mission-complete-catalog.js`, and the existing VP option/checkpoint tests.

- `IMG_5E07372E-20A8-40F8-8B75-7D84CC740172.jpeg`: Forward Position, No Prisoners, Outflank.
- `IMG_D4E1074B-C2FC-4FFD-AAA9-565A8235F6E3.jpeg`: Overwhelming Force, Plunder, Secure No Man's Land.

Photos are user conversation attachments, **not copied into the repository**. All shown rules, timing labels and VP figures are legible. Printed cards are directly compared, not presumed current against future errata/FAQ.

## Individual comparison results

| Card | Physical card (scoring / When Drawn / Action) | Catalog comparison |
|---|---|---|
| Forward Position | Optional redraw and shuffle back in battle round 1. End of your turn: control opponent home objective and/or each expansion objective for 5 VP. | Exact match |
| No Prisoners | End of **a** turn: 2 VP for each enemy unit destroyed this turn, **up to 5 VP**. | Exact match; UI 2, 4 or capped 5 VP on either turn |
| Outflank | End of your turn: 3 VP for eligible friendly unit(s) within 6″ of battlefield edge(s) outside own territory, OR 5 VP for two+ eligible friendly units within 6″ of **opposite parallel** battlefield edges, at least one outside territory. Exclude Aircraft/Battle-shocked. | Exact match; exclusive 3 / 5 VP |
| Overwhelming Force | End of **a** turn: 3 VP for each enemy unit which **started this turn** within range of any objective and was destroyed, **up to 5 VP**. | Exact match; UI 3 or capped 5 VP on either turn |
| Plunder | Optional redraw and shuffle back if Cleanse active. One unit in a terrain area **not within your territory** starts the Action in your Shooting phase, once/turn, completes **immediately**; score 5 VP at end of your turn if a terrain area was plundered. | Exact match; the territory rule applies to the terrain area (also clarified in official Event Companion FAQ). Secondary Action completion remains player-confirmed, not recorded live |
| Secure No Man's Land | End of your turn: control 2+ objectives within No Man's Land, excluding own home objective, for 5 VP. | Exact match |

All six are Tactical-only. No changes to VP values, scoring logic, timing, map interactions, or action automation were necessary.

## Complete 18-card photo verification status

Batch 1 (merged PR #560): Assassination, Bring It Down, Beacon, Defend Stronghold, Cleanse, Burden of Trust — corrected erroneous Fixed 5 VP cap on Bring It Down.

Batch 2 (merged PR #562): A Grievous Blow, A Tempting Target, Behind Enemy Lines, Centre Ground, Display of Might, Engage on All Fronts — corrected erroneous Fixed 5 VP cap on A Grievous Blow.

Batch 3 (this branch): Forward Position, No Prisoners, Outflank, Overwhelming Force, Plunder, Secure No Man's Land — six direct matches, no rules corrections.

**18/18 physical scoring/rules faces have been directly compared.** The catalog-wide physical-card flag is true and each individual record retains original photo evidence and a comparison date. This does **not** imply that future official FAQs, digital updates, or primary-card content were independently certified. The community import source remains separately marked unverified, as it is not the printed deck itself.

## Test and release safeguards

- Assert physical-card evidence for all eighteen entries individually, and accurate catalog-wide source status.
- Lock the final six cards' per-turn VP options, conditional scoring, timing, Fixed/Tactical eligibility, first-round optional replacement, and Plunder Action reference semantics.
- Retain existing battle-round (15 VP), total Secondary (45 VP), and Fixed-card (20 VP) caps, including the two corrected Fixed kill missions.
- Keep existing player-agreed manual scoring, no automatic Secondary Actions, no saved-battle migration, and no unrelated changes.
- GitHub Actions must be green before merging; live iPad acceptance remains separate.

This completes physical verification issue #502 only after this PR is merged. Primary mission face verification and future edition updates remain separate workstreams.
