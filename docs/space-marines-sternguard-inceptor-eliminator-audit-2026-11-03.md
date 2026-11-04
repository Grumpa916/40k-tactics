# Space Marines 11th-edition equipment verification — Sternguard, Inceptor, Eliminator

Review date: 2026-11-03 Pacific. **This is a focused current-11e reference audit, not direct certification against the full October 2026 Games Workshop Codex or latest GW MFM.**

## Sources and limitations

- [Games Workshop official 40K downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) lists the Munitorum Field Manual updated **14 October 2026**, the definitive source for points and force-building rules.
- Current 11e cross-references (independent, not official): [Sternguard](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Sternguard-Veteran-Squad), [Inceptors](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Inceptor-Squad), [Eliminators](https://www.wahapedia.ru/wh40k11ed/factions/space-marines/Eliminator-Squad); corroborated by [Sternguard profile transcription](https://wh-rules.ru/factions/space-marines/datasheets/sternguard-veteran-squad) and [October Inceptor reference](https://praetorium.gg/factions/space-marines/rules/space-marines-codex-2026-10-12/datasheets/inceptor-squad).
- **Inceptor pricing conflict:** A current 11e reference lists **130/260** (first/second 3/6 models) and **150/280** (third+). Another October 2026 reference lists **125/250** and **140/265**. We cannot resolve the discrepancy with the current GW MFM because its live browser blocks automated access. This PR **deliberately preserves the app's existing 130/260 and 150/280** and does not certify either set as definitive GW points. Confirm with the current official MFM or Warhammer App before competitive play.

## New selectable wargear and combat profiles

| Unit | Actual selections now modeled | Current 11e reference corrections |
|---|---|---|
| Sternguard Veteran Squad | 5/10 models; Sergeant Chainsword can switch to Power Fist or Power Weapon; each of 4/9 other Veterans carries an Artificer Firearm unless replacing it with Heavy Bolter or Pyrecannon, with a **combined cap of 1 per 5**. All carry Bolt Pistols; ordinary Veterans have Ceramite Fists | T5; Artificer Firearm Infernus, Purgatus and Damnatus as **three firing modes of one equipped gun**, updated pistol, melee, Heavy Bolter, Pyrecannon and Veteran Marksmen reminder |
| Inceptor Squad | 3/6 models; each Inceptor chooses Assault Bolters or Plasma Exterminators. All retain Ceramite Fists | M10, T6, W3; Assault Bolters with Sustained Hits 2 and Twin-linked; Plasma Exterminators Standard and Supercharge as **two modes of the same equipped weapon**, with Hazardous confirmed manually |
| Eliminator Squad | Exactly 3 models; Sergeant chooses Bolt Sniper Rifle, Instigator Bolt Carbine or Las Fusil. Each of the two other Eliminators chooses Bolt Sniper Rifle or Las Fusil; no regular-model Instigator. All carry Bolt Pistols and Ceramite Fists | M8 T4; corrected Bolt Sniper Rifle, Instigator Bolt Carbine, Las Fusil and pistol profiles. Chameleoline Cloaks, Stealth, Infiltrators, and Special-issue Optics and Ammunition remain manual reminders |

Sternguard price table now has **5/10 = 105/210 points first two units, 120/225 third+**, where two current 11e references agree. This remains a community-transcribed pricing comparison pending full direct official reconciliation.

## Safeguards

- Existing saved armies and game snapshots are **not rewritten**. The Space Marine catalog revision is incremented for explicit review.
- Shared equipment UI and legality engine used; no new monolith. Combat profiles are patched in the reviewed overlay rather than changing the legacy generated export.
- Special weapons and ranged modes are counted as *selected equipment* versus *available attack modes*; the app must not auto-fire all modes.
- Potential movement and weapon rule effects, especially Inceptor ingress, Hazardous rolls and Eliminator special optics, require player confirmation at the table.
- Unreviewed Space Marine units continue showing a warning; no blanket claim of official certification.

## Next

Finish remaining Space Marine chapter characters, Phobos/Gravis units and transports, explicitly reconcile the disputed Inceptor points and other source conflicts with the **current** GW MFM, and run live iPad Safari army import, equipment selection and battle fire tests. Official Chapter Approved physical secondary-card review remains separately deferred.
