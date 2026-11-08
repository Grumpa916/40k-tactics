# Games Workshop Chapter Approved FAQ and errata review — 8 November 2026

## Scope / authority hierarchy

Purpose: reconcile the **completed 25/25 Primary printed scoring-face and 18/18 Secondary printed-card audit** with publicly available current mission FAQs, keeping live scoring **manual**. All 11 Primary Action faces were also directly photographed.

1. **Official GW Warhammer Event Companion, latest listed v1.3 (14 October 2026):** https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf — authoritative publication link traced from the public v1.3 historical link and official GW download listing.
2. **GW v1.2 Event Companion, previously reviewed directly:** https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf — existing user-reviewed geometry and checked mission-sequence/FAQ evidence.
3. **Version 1.3 FAQ transcription for comparison (secondary mirror):** https://wahapedia.ru/wh40k11ed/the-rules/warhammer-event-companion/ — records v1.3, October 2026, and the complete displayed Chapter Approved mission FAQ list.
4. **Official GW November 2026 World Championships rules updates (event-only):** https://warcomprod2024productionstorage.s3.eu-west-2.amazonaws.com/worldchamps2026faqs/wcw2026_40k_update-z28qslftvl-ooradhsjdb.pdf and https://www.warhammer-community.com/en-gb/articles/2ykrr5eg/world-championships-of-warhammer-2026-rules-update-documents/.

**Retrieval limitation:** The official October v1.3 Companion PDF is large (~10.7 MB) and could not be opened by the available web/PDF retrieval path. This audit verified the *version/link* and cross-checked the displayed v1.3 mission FAQs against the earlier checked official v1.2 FAQ text and current app data; **it is not a line-by-line certified v1.3 PDF audit**. Therefore `inspectedDocumentVersion` and the map source remain **v1.2**, and **v1.3 geometry is not asserted rechecked**.

## Mission FAQ and errata comparison

The displayed v1.3 mission FAQ list contains no new general mission-card text amendment requiring a VP or phase-window change relative to the previously checked official v1.2 FAQs. The individual rulings and app treatment are:

| Topic | FAQ interpretation | V2 reconciliation |
|---|---|---|
| Plunder Secondary Action | The requirement outside friendly territory applies to the **terrain area**, not the acting unit. | Already reflected in action summary and reference notes. No code change. |
| Beacon Secondary | If the originally designated beacon unit is destroyed, **no replacement** beacon unit may be nominated. | Already present in the Secondary notes; no replacement automation. |
| End of battle scoring | **End of battle** scoring is separate from the end of battle round 5; its awards do **not** use the per-battle-round 15 VP ceiling, but game category totals still apply. | Existing independent end-of-battle scoring and cap test preserved. |
| Status attached to operation marker | Removing a marker also removes any status conferred by it (for example, decoyed). | Already surfaced on Death Trap / Smoke and Mirrors FAQ notes. |
| Removing mission operation markers | A player may only remove mission markers **when and how the Primary Mission itself says to do so**. | Added plain-language reference reminders for **Locate and Deny** and **Triangulation** (no automatic marker removal). |
| Death Trap | The terrain area need not have been trapped when an enemy was killed; the relevant status is determined for the scoring condition. | Already corrected in #565; preserve wording and test. |
| Surveil the Foe | Removing a blocking marker **later in the same turn** can allow a previously surveilled enemy unit to qualify. | Already noted; retain unit-turn scoring reference. |
| Vital Link | If more than one central objective exists, cumulative marker VP can come from markers near **different** controlled central objectives. | Already noted and protected by tests. |

The print-card changes to Fixed **Bring It Down** and **A Grievous Blow** were addressed earlier in #560/#562; neither is reversed here. All mission scoring still requires player agreement. No change to 15 VP/battle-round, 45 VP total Primary/Secondary, or 20 VP per Fixed Secondary card.

## November 2026 World Championships clarifications: **event-only**

The separate official GW document says its responses are **valid for the December 2026 World Championships only** and are not yet general Warhammer 40,000 app rules. These are **not installed as normal live-play behavior**, irrespective of their source authority.

Mission-related answers in that event-only document:
- **Consecrate / Unleash the Lions:** newly split units do **not** remain designated consecration units.
- **Beacon / Unleash the Lions:** newly split units do **not** inherit the beacon designation.
- **Punishment / Unleash the Lions:** original condemned unit **does leave the battlefield**, even though it is not destroyed.
- **Plunder / Strategic Reserves:** a unit coming in 6 inches from the edge at a terrain area 6 inches from that edge may start Plunder or contest the objective.

Related Custodes event-only rulings worth tracking for user reference: Unleash the Lions removes rather than destroys the original unit; persistent effects do not transfer to new units, but their once-per-battle abilities are available anew; singled-out target effects may lose their target without a destruction event. Shield-Captain Master of Ka'tahs may allow Dacatarai and Kaptaris to activate in the same phase with a re-ready between activations.

**Policy:** Do not alter V2 normal mission scoring, automatic battle state, stratagem eligibility, or Tactical Advisor on these event-only answers. If GW later adopts any wording in a general official FAQ, audit that edition explicitly and implement under a separate reviewed PR. If a tournament uses the World Championships rules as its own event pack, its TO may apply them; the app should not assume that.

## Changes in this PR and outstanding work

- Source index: newer **v1.3** publication link/index check; retained **v1.2** inspected PDF, geometry, and full-PDF-audit limitations; World Championships source explicitly marked **event-only**.
- Primary source notice corrected to state **25 scoring / 11 Action faces compared**, without claiming fresh general FAQ certification.
- Primary mission FAQ reference notes add the **operation-marker removal restriction** for Locate and Deny and Triangulation.
- Regression tests assert source separation, marker restrictions, no false current PDF/geometry certification, and unchanged printed scoring tiers.
- Existing confirmed v1.2 mission FAQs and manual player-agreed VP remain intact.
- **Still pending:** a direct page-by-page download/visual inspection of the official v1.3 PDF (including October-specific terrain differences if any), comprehensive current GW core/faction updates, and live iPad acceptance checks. Historical v1.2 map-render verification must not be silently re-labeled v1.3.

Do not merge until tests pass and user approves.
