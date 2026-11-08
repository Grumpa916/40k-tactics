# Secondary physical card audit — 8 November 2026 (Batch 1 of 3)

## Scope and evidence

Compared the printed rules/scoring faces of **six** Chapter Approved 2026–27 Secondary Mission cards with `src/data/secondary-mission-catalog.js` and the supplemental `secondary-mission-complete-catalog.js`.

User-supplied physical-card photos (retained as chat attachments, **not** committed as image binaries):
- `IMG_376981BB-993F-4503-9951-DE8CDC47D14F.jpeg`: Assassination, Bring It Down, Beacon (all legible).
- `IMG_664C74BC-36BE-4F8F-AAA5-8948A805D60F.jpeg`: Defend Stronghold, Cleanse, Burden of Trust (all legible).

Every shown card has the full rules, WHEN DRAWN conditions where present, phase and scoring printed legibly. Card backs are not asserted to contain additional independent rules. Current official Event Companion v1.2 FAQ notes (e.g. Beacon destroyed cannot be replaced) remain separate source records; this batch did not re-audit the full official document.

## Six card comparisons

| Card | Physical source findings | Catalog result |
|---|---|---|
| Assassination | End of any turn; Fixed 3 VP per destroyed CHARACTER model plus 1 VP each if W≥4; Tactical 5 VP for one or more destroyed this turn **or** all enemy CHARACTER models destroyed during battle | Matches |
| Bring It Down | End of any turn; Fixed **4 VP per destroyed enemy model with W≥10**; Tactical **5 VP maximum**; Tactical When Drawn replacement if none qualify on battlefield | **Corrected**: remove Fixed 5 VP max so choices become 4, 8, 12, or 15 VP (four or more qualifying models, round-cap applied); Tactical stays 5 |
| Beacon | When Drawn select one friendly battlefield unit (including embarked in an on-board TRANSPORT); end of opponent turn or fifth battle round; 3 VP outside own deployment zone OR 5 VP outside own territory | Matches |
| Defend Stronghold | When Drawn in round 1: mandatory replacement/shuffle; from round 2, end of opponent turn or fifth round; 3 VP home control plus cumulative 2 VP for no enemies in deployment zone | Matches |
| Cleanse | When Drawn replacement possible if Plunder active; objective Action starts in own Shooting at distinct non-home objectives; completes own end of turn if initiator controls; score 2 VP for one OR 5 VP for two+ | Matches |
| Burden of Trust | When Drawn/start of own turn assign a friendly unit per objective while in range and objective controlled; end of opponent turn or fifth round; 2 VP per guarded objective capped at 5 | Matches |

## Correction and verification policy

- The previous Fixed Bring It Down tier had `maxVP:5`, which incorrectly applied the Tactical cap to Fixed scoring. Remove this field, and update the summary and matrix tests to assert `[4,8,12,15]` Fixed vs `[5]` Tactical. Neither the 20 VP per Fixed card nor 15 VP per battle-round ceiling changes.
- `officialCardVerified: true` and photo provenance are set **only** on these six individually compared cards. Other twelve remain `officialCardVerified: false` with `user-supplied-card-transcription` provenance. The top-level Secondary mission source still denotes a **partially verified** 18-card catalog, not complete official certification.
- No change to manual player-agreed scoring, Actions, saved games, phase transitions, or mission selection.

## Still to review: 12 physical Secondary card faces

A Grievous Blow; A Tempting Target; Behind Enemy Lines; Centre Ground; Display of Might; Engage on All Fronts; Forward Position; No Prisoners; Outflank; Overwhelming Force; Plunder; Secure No Man's Land.

Tracked by issue #502. All 25 Primary mission official full-card verifications remain a separate activity.
