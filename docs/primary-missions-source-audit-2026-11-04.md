# 25 Primary Mission source and scoring verification — 4 November 2026

## Result and source authority

- **25/25 pairings and current scoring VP sets** were checked against a *separate, photo-transcribed community dataset*: [wn-mitch/40kdc-data, pinned 709ecd9f](https://github.com/wn-mitch/40kdc-data/tree/709ecd9f5bb6c06b7446eda6a6a0eae6b921a1c8/data/core). All 25 match after accounting for two equivalent encodings described below. **Community agreement is corroboration, not official certification.**
- **14/25 printed scoring faces** are directly visible in the user's previously uploaded mission-card photographs (IMG_0178/0179/0182/0183). Existing `primary-card-photo-crosscheck.test.js` asserts their precise VP tier sequences.
- **11/11 mission-action faces** are directly visible in user's earlier photographs (IMG_0180/0181/0188/0189/0190/0191). The user photographs contain each of the 11 action-bearing Primary mission backs; this is a direct partial print comparison and does not certify the unphotographed scoring faces.
- Official [Games Workshop Event Companion v1.2](https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf), **p. 1–4**, was reviewed from the uploaded PDF. Page 4 lists **no Chapter Approved card amendments**, but includes mission FAQs. The Event Companion is authoritative for event mission procedures, limits and listed errata; **it does not reproduce every printed mission card**.
- **0/25 full mission cards are marked `officialCardVerified`**. No unphotographed card face has been upgraded to official certification, nor was a rules-verified flag set just because a community source agrees.

## Mission-by-mission evidence matrix

| Primary mission | Scoring face directly photographed | Action face directly photographed | Other scored comparisons |
|---|---|---|---|
| Battlefield Dominance | — | no action | independently corroborated |
| Immovable Object | IMG_0178 | no action | independently corroborated |
| Determined Acquisition | — | no action | independently corroborated |
| Purge and Secure | — | no action | independently corroborated |
| Inescapable Dominion | — | no action | independently corroborated |
| Unstoppable Force | IMG_0178 | no action | independently corroborated |
| Meatgrinder | IMG_0178 | no action | independently corroborated |
| Punishment | IMG_0182 | no action | independently corroborated |
| Consecrate | IMG_0178 | no action | independently corroborated |
| Destroyer's Wrath | IMG_0179 | no action | independently corroborated |
| Death Trap | — | IMG_0188 (Booby Trap) | independently corroborated |
| Delaying Action | IMG_0178 | no action | independently corroborated |
| Outmanoeuvre | IMG_0178 | no action | independently corroborated |
| Smoke and Mirrors | — | IMG_0180/0190 (Decoy) | independently corroborated |
| Locate and Deny | — | IMG_0181/0191 (Sensor Sweep) | independently corroborated |
| Reconnaissance Sweep | — | no action | independently corroborated |
| Triangulation | — | IMG_0180/0190 (Triangulate) | independently corroborated |
| Surveil the Foe | — | IMG_0181/0190 (Surveil) | independently corroborated |
| Gather Intel | IMG_0179 | IMG_0189 (Extract Intelligence) | independently corroborated |
| Search and Scour | IMG_0178 | no action | independently corroborated |
| Secure Asset | — | IMG_0188 | independently corroborated |
| Vital Link | IMG_0183 | IMG_0189 (Maintain Control) | independently corroborated |
| Extract Relic | IMG_0183 | IMG_0189 (Sensor Sweep) | independently corroborated |
| Vanguard Operation | IMG_0179 | IMG_0191 | independently corroborated |
| Sabotage | IMG_0182 | IMG_0188 | independently corroborated |

The **11 scoring faces still lacking an original photograph** are: Battlefield Dominance, Determined Acquisition, Purge and Secure, Inescapable Dominion, Death Trap, Smoke and Mirrors, Locate and Deny, Reconnaissance Sweep, Triangulation, Surveil the Foe and Secure Asset.

## Known equivalent encodings in 25-card comparison

1. **Immovable Object**: the independent transcription has two 5 VP entries for battle rounds 2–4 Command and round 5 end-turn respectively; the app has a single 5 VP row with a combined timing string. No award is omitted or duplicated.
2. **Purge and Secure**: independent data lists two mutually exclusive 3 VP destruction alternatives; the app presents one 3 VP condition with both tabletop alternatives described together. The same award can only be earned once.

All other 23 mission numeric VP sets matched directly. These are value comparisons, **not a claim that every condition/Action timing is fully verified from its official printed card**. Independent side's time-specific transcription is a corroborating reference and existing scoring-checkpoint tests protect the app's round and phase gating.

## Official Event Companion v1.2 FAQ incorporated into mission reminders

- **Death Trap**: a terrain area need not already be trapped when the enemy unit was destroyed. The FAQ also says removing an operation marker removes the status it applies.
- **Surveil the Foe**: a relevant marker may be removed *later in the same turn* after the enemy unit was surveilled and the scored result may still qualify.
- **Vital Link**: where there is more than one central objective, operation-marker bonus VP can be spread across central objectives the player controls.
- **Smoke and Mirrors**: removing a Decoy marker removes its applied decoyed status (generic FAQ).
- **End of battle** is a separate checkpoint, exempt from the 15 VP per-battle-round limit (Event Companion v1.2 p. 4); normal 45 VP Primary total cap still applies.

New FAQ note metadata appears in the expanded mission summary and in the appropriate Primary scoring reminder; it does **not** automatically judge conditions or award VP.

## Clarified scoring references, preserving manual scoring

- **Extract Relic:** the user's IMG_0183 printed scoring face confirms that both the end-of-turn 4 VP and end-of-battle 5 VP last-marker conditions require exactly one opponent marker, a friendly unit in the same terrain area, and no enemy unit there. The formerly vague displayed summaries now state that condition.
- **Purge and Secure:** the independent community card transcription distinguishes two alternative objective-related destruction conditions, worth 3 VP **once**, not twice. The live reference now explains these OR alternatives explicitly; this scoring face was not in the supplied original photographs and is not certified official.
- **Locate and Deny:** the independent card transcription explains the exact-one-friendly-marker, friendly-in-same-terrain, enemy-absent conditions, replacing an unhelpful placeholder. This face remains pending official original comparison.
- **Surveil the Foe:** the official Event Companion FAQ quotes the protected-marker exclusion; the UI scoring reference now mentions it and the FAQ note covers removing a marker later in the same turn.
- **Reconnaissance Sweep:** the independent card transcription supports the 6-inch centre exclusion and alternative three-/four-quarter tiers. The original scoring face remains pending.

These are changes to human-readable condition reminders, not a reinterpretation by automatic scoring logic. Players continue to confirm and enter actual tabletop VP.

## Functional correction from the photographs

Locate and Deny's **Sensor Sweep** was already implemented by the special-case primary Action picker in `src/rules/mission-action-state.js`, but the core Primary mission definition lacked the `action` entry, so its expanded reference omitted the official Action. The definition now exposes the previously working Action and its once-per-turn, central-objective, end-of-turn completion and last-marker restrictions. No new live action engine was added.

## Verification and remaining acceptance

The new `primary-mission-full-source-audit-20261104.test.js` guards all 25 disposition matchups, all 25 VP sets, all 14 photo scoring references, all 11 photo action references, the official FAQ mappings, and the distinction between partially photo-checked and fully officially certified. Earlier photographed scoring tiers and existing checkpoint/VP tests remain in place.

**Still required for strict 25/25 official card certification:** directly read the 11 missing scoring faces from the user's current physical Chapter Approved 2026–27 deck (or equivalent authoritative licensed full-card source) and compare exact conditions, phases, caps and any revised errata. Keep `officialCardVerified:false` until full-card comparisons have actually been performed. A complete five-round iPad playthrough remains separate acceptance testing.

Scope: source provenance, primary mission reference text, and regression tests only. Do not alter existing battle saves, scoring ledger, live map, phase transitions, or Secondary mission cards.
