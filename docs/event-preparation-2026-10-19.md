# Event preparation update — 19 October 2026

Baseline: user-supplied GitLab main ZIP, archive commit 58e642d3dcc2fefd7be128540819ad0005a6f45a.
Rules baseline: uploaded Warhammer 40,000 11th-edition Core Rules (sections 18–20 and 24) and uploaded Event Companion v1.2, pages 1–2. This implements the event sequence; it does not certify every later erratum or faction rule.

## Implemented

Prepare Game is a guided, saved sequence: missions/layout → terrain → attacker/defender → secondary reveal → formations → deployment → redeployment → first-turn roll → pre-battle rules → begin.

- Secondary mode and Fixed cards are recorded after private physical/paper selection and simultaneous reveal. The app explicitly asks for confirmation; it is not a secret digital selection system.
- Fixed-card setup is usable when a setup battle record exists. Tactical draws stay in the player's Command phase, with the existing two-per-Command rule and retained active cards unchanged.
- First-turn choice has no automatic default and cannot be recorded before redeployment.
- Formations record battlefield, strategic reserve or embarked status. Passengers follow transport selection; attached roster components follow their bodyguard for deployment.
- Known reserve points include passengers and attached components. Unknown costs/limits or an over-limit exception require a recorded tabletop review. Known Fortifications are rejected from initial strategic reserves.
- Transport eligibility, keyword, total capacity and any rule exceptions require physical rules verification and confirmation. The existing data is insufficient for complete automated transport validation.
- Defender-first deployment and Titanic skips are explicit prompts, not an enforced deployment-turn simulator. Redeployment and Scouts each have their own confirmation and rule-authorised reserve changes.
- Engine gates prevent skipping preparation or starting the first turn early. Earlier setup steps can be revisited before deployment; doing so invalidates later confirmations.
- Older deployment saves have an explicit review path retaining map placements. Active battles continue unchanged.
- Prepare Game uses existing terrain and map renderers. No terrain geometry was regenerated. A stale setup-tab condition was corrected so deployment/live screens are not presented as setup views after leaving setup.

## Future design decision — accepted

Army creation/import/editing/storage will live separately from active game preparation and play. Retain isolated battle snapshots of saved rosters. Army mustering owns Leader/Support attachments and eligible dispositions; event registration records the committed disposition. Full navigation separation and Support-specific roster validation are future work, not part of this patch.

## Validation

135 automated tests pass; static build passes. New tests cover official ordering, engine gates, Fixed-card entry, opponent first turn remaining Round 1, saved checkpoint recovery, reserve passenger accounting, unknown costs, attached-unit placement and UI controller cleanup. Tests exercise controllers with DOM doubles; iPad Safari visual/touch verification is still required. No browser binary was available for browser rendering in this environment.

## iPad acceptance checks

1. Load a fresh setup and select both saved armies. Open Prepare Game.
2. Confirm missions/layout, view the existing measured terrain screen, then choose attacker/defender. There must be no first-turn choice yet.
3. Privately choose secondary modes/cards physically; reveal and record them. Test one Fixed and one Tactical player. Confirm the checkpoint.
4. Assign a passenger to a transport and set the transport in reserves. Verify passenger costs are included; supply tabletop review if roster data is missing. Confirm formations.
5. Place remaining units using existing tap/drag gestures. No passenger marker should require separate placement. Confirm deployment.
6. Complete redeployment, record the first-turn roll, then resolve Scouts/pre-battle rules. Test an eligible reserve-to-field Scout setup and place its marker before confirming.
7. Begin with the opponent first: verify Round 1 and Command phase. Save/resume before starting to verify the checkpoint persists.
8. Verify the existing live battle view, CP/VP controls and phase progression still work. This package does not include the paused tabletop UI propagation experiment or staged Tactical Advisor v2.
