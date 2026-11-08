# Primary Mission printed scoring-face audit — 8 November 2026, batch 1

## Source and verification scope

Compared six Chapter Approved 2026–27 **physical Primary Mission scoring faces** photographed by the user to the current 11th-edition Primary Mission catalog. These are user conversation attachments; the images are not copied into GitHub.

- `IMG_6700A944-0A87-4143-80AE-D186E14863F9.jpeg`: Battlefield Dominance, Purge and Secure, Determined Acquisition.
- `IMG_CBC6160D-BB92-46BA-B6D5-5B09859CC60C.jpeg`: Smoke and Mirrors, Death Trap, Inescapable Dominion.

All six photographs show readable scoring timing/conditions/VP values. The reverse-side Action text for Death Trap and Smoke and Mirrors was separately photographed in October (see `src/data/primary-mission-evidence.js`). The user did not upload the Action backs again in this batch.

## Results

| Printed Primary Mission | Direct scoring-face comparison | Result |
|---|---|---|
| Battlefield Dominance | R1 and R2, end of own turn: control more objectives, 2 VP. R2+ Command (or own end of turn R5): 3 VP per objective; cumulative +2 VP for each non-home controlled objective while also controlling own home objective. | Matches |
| Purge and Secure | Any round own end of turn: **one** 3 VP award if either an enemy was destroyed by a friendly unit within range of one or more objectives, **OR** an enemy unit that began the turn within range of one or more objectives was destroyed. R2+ Command (R5 own end of turn): 4 VP per non-home objective. R2+ own end of turn: 3 VP if controlling at least one newly gained non-home objective. | Matches. The app consolidates the two mutually exclusive 3 VP branches into one explicitly non-cumulative reference row. |
| Determined Acquisition | Any round own end of turn: 2 VP per controlled objective newly gained this turn, excluding own home. R2+ Command (R5 own end of turn): 3 VP per controlled objective; cumulative +3 VP per such objective in opponent's territory. | Matches |
| Smoke and Mirrors | Own end of turn: 2 VP per decoyed objective and +2 cumulative if such objective is in opponent territory; R2+ Command (R5 own end of turn): 4 VP for at least one non-home objective controlled; end of battle: 10 VP for four or more decoyed objectives. | Matches; separately published FAQ about removed Decoy marker remains noted. |
| Death Trap | Own end of turn: 2 VP per terrain area trapped **this turn**, +3 cumulative for each such trapped terrain area that is an objective; separately 3 VP if one or more enemy units that started the turn in a terrain area were destroyed and that terrain area is trapped at scoring. R2+ Command (R5 own end of turn): 4 VP for at least one controlled non-home objective. | All values and windows match. Clarified reference text to avoid incorrectly requiring the terrain to have been trapped when the enemy was destroyed (official Event Companion v1.2 FAQ). |
| Inescapable Dominion | Own end of turn: 4 VP for controlling at least three objectives; R2+ Command (R5 own end of turn): 5 VP for controlling at least two objectives, plus 4 VP for controlling more objectives than opponent; end of battle: 5 VP for controlling opponent's home objective. | Matches |

## Status and limitations

- Previously reviewed 14 physical scoring faces plus these six = **20/25 photographed scoring faces**.
- All 11 Primary mission-Action faces were previously photographed; no Action data changed in this batch.
- The **remaining five scoring faces** to photograph: **Locate and Deny, Reconnaissance Sweep, Triangulation, Surveil the Foe, Secure Asset**.
- The previous source index remains historically dated November 4; this dated addendum updates photo coverage without claiming new event-companion or FAQ certification.
- Individual Primary `officialCardVerified` and `rulesVerified` remain false pending a distinct complete, current full-card/FAQ certification. Photo evidence alone must not blindly upgrade these flags.
- Manual player-confirmed Primary scoring, phase checkpoints, round/game VP caps, saved games, map position and automatic behavior are not changed.

## Regression coverage

The photo cross-check asserts all 20 tier sequences and the additional six cards' timing labels. Focused checks protect Purge and Secure's non-cumulative OR alternatives; Smoke and Mirrors / Determined Acquisition cumulative territory VP; Death Trap cumulative objective-terrain VP and end-of-turn trapping interpretation.

PR must pass GitHub Actions before any merge. Preserve the already-accepted deck state until user approval.
