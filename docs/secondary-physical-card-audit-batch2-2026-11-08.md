# Secondary physical card audit — 8 November 2026 (Batch 2 of 3)

## Scope and evidence

Directly compared six Chapter Approved 2026–27 Secondary card rules/scoring faces against the current V2 mission catalog and manual-scoring UI. User-supplied photos remain chat attachments (not checked into GitHub):

- `IMG_ACBC8821-7C33-4602-AA96-6DE4682FD74E.jpeg` — A Grievous Blow, A Tempting Target, Behind Enemy Lines
- `IMG_5788EBC7-5E36-4BD0-BC43-55386D895FAC.jpeg` — Centre Ground, Display of Might, Engage on All Fronts

Print is legible for rule text, WHEN DRAWN, timing, VP tiers, and Fixed/Tactical distinctions. This is a direct comparison of the visible official printed faces; it is not a comprehensive FAQ re-audit.

## Card-by-card comparison

| Printed card | Printed timing and options | Outcome |
|---|---|---|
| A Grievous Blow | End of a turn. Fixed **4 VP per destroyed enemy unit** with Starting Strength 13+; Tactical 5 VP maximum. When Drawn allows Tactical replacement if no 13+-strength enemy units remain on battlefield. | **Fixed scoring corrected:** remove erroneous `maxVP:5` and retain Tactical 5 VP. Fixed choices 4,8,12,15 (15 is battle-round cap on four or more). |
| A Tempting Target | When Drawn opponent selects one non-home objective in No Man's Land; end of your turn, control it for 5 VP. | Matches |
| Behind Enemy Lines | When Drawn in round 1, may replace and shuffle original back; end of your turn, 3 VP per qualifying friendly unit wholly within opponent deployment zone, excluding Aircraft and Battle-shocked, **up to 5 VP**. | Matches |
| Centre Ground | End of your turn; friendly non-Aircraft/non-Battle-shocked unit within 3 inches of centre and no enemy within 3 inches: 3 VP; OR no enemy within 6 inches: 5 VP. | Matches |
| Display of Might | End of your turn: 2 VP for more eligible friendly than enemy units wholly within No Man's Land; end of opponent's turn: 5 VP for same condition, excluding Aircraft/Battle-shocked. | Matches |
| Engage on All Fronts | End of your turn; eligible presence in 3 quarters: Fixed 2/Tactical 3; OR 4 quarters: Fixed 4/Tactical 5. Presence excludes Aircraft, Battle-shocked, and units within 6 inches of board centre. | Matches |

## Implementation and safeguards

- Set six individually photographed cards to `officialCardVerified:true` with original photo filename and date. Preserve the six flags from Batch 1; **12/18 total**, not a catalog-wide official certification.
- Fixed A Grievous Blow must offer 4/8/12/15 (15 follows battle-round cap), and Tactical offers 5 only, both own- and opponent-turn scoring checkpoints.
- Preserve manual player-agreed scoring, Fixed card persistence, all global VP limits, deck behavior, secondary Actions as reference-only, and saved games.
- Add regression assertions for per-card source identity, VP options, and correct Fixed/Tactical separation.
- Merge only after the repository GitHub Actions workflow is green.

## Still pending six cards (Batch 3)

Forward Position; No Prisoners; Outflank; Overwhelming Force; Plunder; Secure No Man's Land.

Related tracking issue: #502. Previous batch: `docs/secondary-physical-card-audit-2026-11-08.md` (merged PR #560). Primary mission card certification remains separate.
