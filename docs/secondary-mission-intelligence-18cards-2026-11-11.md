# Secondary Mission Intelligence — 18-card coverage audit

**Updated:** 2026-11-11  
**Rules source:** Chapter Approved 2026–27; all 18 scoring faces directly checked against supplied photographs of physical cards on 2026-11-08. Previous scoring-window audit is retained in `src/data/secondary-mission-catalog.js`. This implementation does **not** replace the physical card or award VP automatically.

## Audit by card

| Secondary | Scoring checkpoint | Intelligence added or verified | Evidence and limitations |
|---|---|---|---|
| A Grievous Blow | Either player's turn (Fixed/Tactical) | Combat target flag for enemy units with recorded Starting Strength 13+; printed Fixed per-kill vs Tactical cap | Needs accurate starting strength; actual destruction confirmed |
| A Tempting Target | Own end turn | Objective-specific ranking only for opponent-selected stored target | Missing When Drawn choice blocks bonus |
| Assassination | Either player's turn (Fixed/Tactical) | Existing CHARACTER target prioritization and distinct Fixed/Tactical VP | Models vs units and character wound tier still require physical confirmation |
| Beacon | Opponent end turn, fifth-round alternative | Only recorded Beacon unit gets forward staging; targeting that opponent Beacon can deny its card | Embarked/destroyed Beacon not misrepresented as a deployed movement candidate |
| Behind Enemy Lines | Own end turn | Staging towards *opponent deployment zone*, not just opponent territory | Wholly-within zone must be confirmed physically |
| Bring It Down | Either player's turn (Fixed/Tactical) | Target models with per-model Wounds characteristic 10+; mode-specific card value | Does not infer model W from pooled unit wounds |
| Burden of Trust | Opponent end turn, fifth-round alternative | Recorded objective + assigned unit used for objective ranking; enemy guard targets highlighted for denial | Requires current guard assignments, control and continued range |
| Centre Ground | Own end turn | Stage at actual battlefield centre; enemy centre target relevance already present | 3/6-inch enemy exclusions and 3-inch friendly range need physical measurement |
| Cleanse | Own end turn | Non-home objective ranking, excludes same-turn used objectives; Shooting action reminder | Different-unit/actions and end-turn control are manual |
| Defend Stronghold | Opponent end turn, fifth-round alternative; round 2+ | Boost own-home defence only from round 2 | Enemy deployment-zone exclusion still manual |
| Display of Might | Own and opponent end turns | Explicit No Man's Land *unit* staging, not generic objective bonus | Wholly-within qualification and both-army count require physical confirmation |
| Engage on All Fronts | Own end turn; Fixed/Tactical distinct | Suggest a new quarter away from battlefield centre | Whole-unit, 6-inch and 3/4-quarter tiers remain physically confirmed |
| Forward Position | Own end turn | Opponent home and expansion objective ranking only | No arbitrary center objective bonus |
| No Prisoners | Either player's turn | All enemy units as potential 2 VP per destruction targets | Tactical 5 VP card cap and per-turn cap still enforced in manual award |
| Outflank | Own end turn | Edge-specific staging with opposite-edge and out-of-territory reminder | 6-inch edge, eligible unit and opposite-edge conditions need physical measurement |
| Overwhelming Force | Either player's turn | Targets only when recorded **turn-start snapshot** locates unit near an objective | Missing snapshot or uncertain position withholds ranking bonus |
| Plunder | Own end turn | Candidate map terrain ID (not objective), once-per-turn readiness and Shooting reminder | Actual terrain entirely outside own territory must be confirmed; no automatic action recording |
| Secure No Man's Land | Own end turn | Rank eligible central/expansion objectives, not home objectives | Must control at least two; manual score verification |

## End-to-end controls

- **Command:** Existing when-drawn replacement selections (Beacon, Tempting Target, round-one and Cleanse/Plunder restrictions), Fixed/Tactical modes and Burden of Trust choices remain unchanged.
- **Movement:** Typed per-card objective, terrain, territory, center/quarter/edge staging and opponent-turn checkpoint context supersede the previous generic text-matching bonus for official cards. Only the specified target or eligible objective receives a bonus.
- **Shooting:** Secondary action reminders explicitly describe Cleanse and Plunder without changing activations or pretending their requirements were met. Destruction-based secondary target forecasts now distinguish the four qualifying destruction cards as well as existing Assassination/Centre Ground logic.
- **Charge/Fight:** Secondary target relevance follows the same tactical target context used by combat advisor; it does not auto-confirm a future kill.
- **Scoring:** The existing explicit own-turn/opponent-turn/fifth-round checkpoint workflow remains authoritative; Action and VP confirmation are manual.
- **Saved battles:** Use the authoritative active secondary instances, card choices, turn-start snapshots and source objective IDs. No saved roster or battle rewrites.

## Validation boundaries

This is **18/18 structured advisory coverage and automated regression coverage**, not a claim that 18 cards have been physically scored and played through every possible combination in Safari. A map marker is approximate and never proves a wholly-within footprint, model count, objective control, legal Action or completed score. Current raw mission-card caps, scoring window, Fixed/Tactical restrictions and end-turn score approvals are preserved in their existing engines.

**Next after this PR is merged:** isolated iPad checks of the secondary dropdown/mission context, then the full five-round battle acceptance test. No merge or deployment should occur without explicit approval.
