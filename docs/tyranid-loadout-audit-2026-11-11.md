# Tyranid 11th-edition equipped-wargear audit — 11 November 2026

## Scope and evidence
Reviewed all 57 locally catalogued Tyranid entries against the existing structured rules, the 4 November 2026 coverage baseline, and specific current 11th-edition v1.3 datasheets. Checked equipment selection, per-model quantities, fixed versus optional rules, alternate weapon profiles, saved equipment and the Tactical Advisor weapon-option source. Includes 52 current entries and 5 Legends catalog entries.

This is a **focused loadout** audit, **not** a full official GW Codex/MFM certification or a claim that every weapon characteristic/points value is current. Current datasheet cross-check: `https://www.wahapedia.ru/wh40k11ed/factions/tyranids/`, with source URLs preserved on each new rule. Official primary-source certification remains separately pending where the catalog indicates this.

## Structured coverage after this PR

| Category | Previous | Now | Reason |
| --- | ---: | ---: | --- |
| Selectable/optional | 11 | 12 | Harpy's mutually exclusive main cannon choices |
| Fixed-only | 34 | 42 | Old One Eye, Zoanthropes, Maleceptor, both Norns, Toxicrene, Hierophant, Harridan |
| No conventional weapons | 2 | 2 | Spore Mines and Mucolid Spores |
| Unresolved | 10 | 1 | Only Hyperadapted Raveners remains |
| **Total** | **57** | **57** | No additions to the unit catalog |

## Newly verified structure

- **Harpy:** Stinger salvoes and scything wings fixed; choose **one** of twin stranglethorn cannon (default) or twin heavy venom cannon. Two cannons at once fails validation.
- **Old One Eye:** one claws-and-talons weapon with strike/sweep melee profiles, not two independently equipped weapons.
- **Zoanthropes:** every model equips Warp Blast and claws/teeth; witchfire/focused witchfire are alternate firing profiles of one Warp Blast.
- **Maleceptor:** psychic overload and one massive-scything-talons weapon with strike/sweep profiles.
- **Norn Emissary:** one Psychic Tendril (neuroparasite/neuroblast/neurolance), monstrous scything talons, and extra-attack rending claws. The psychic firing profiles are alternatives, not three guns.
- **Norn Assimilator:** one harpoon with both ranged and extra-attack melee profiles, plus monstrous scything talons.
- **Toxicrene:** one massive toxic lashes selection has both ranged and melee profiles.
- **Hierophant:** one bio-plasma torrent, **two** dire bio-cannons, one lashwhip pods, one titanic scything talons.
- **Harridan:** **two** dire bio-cannons, one gargantuan scything talons.

For fixed-only equipment the Army Builder can derive the weapons with no manual selection; explicit built lists maintain exact `equippedWargear` (physical selection) and `equippedWeapons` (usable profiles) counts. The Tactical Advisor receives profile-specific attack quantities. Models with actual choice options must still select and save their real equipment.

## Existing 11 selectable rules reviewed

Hive Tyrant (two compatible slots), Winged Hive Tyrant (one slot plus talons), Tervigon (melee replacement), Tyrannofex (main gun), Termagants (one baseline plus per-10 specialists), Carnifexes (two model-specific arm slots and optional bio-plasma/spine banks), Hive Guard, Tyrant Guard, ranged Tyranid Warriors, Ripper Swarms, and Legends Sky-slasher Swarms. No ungrounded new choices were introduced for these.

## Held out: Hyperadapted Raveners

v1.3 unit composition: one Ravener Prime with prime claws and talons; four Raveners with heavy claws and talons; exactly one Ravener additionally carries venom bolt. This is **fixed**, but which model survives after casualties materially changes the available venom bolt and per-model attacks. The current generalized casualty selector does not know which specific Ravener died. Consequently, this entry remains marked as needing casualty-identity logic rather than being treated as four uniform weapons or falsely certified as accurate.

## Remaining risks and acceptance

1. **Alternate firing modes:** The Army Builder now identifies one equipped weapon with multiple profiles, but live attack recording must still not treat every alternate profile as a separate physical gun fired in the same turn. A distinct fire-mode accounting audit is recommended.
2. **Profile-specific casualty identities:** Hyperadapted Raveners and any mixed-model special weapons need reliable unit/member-level casualty identity for exact surviving firepower.
3. **Official cross-check:** The previous 34 fixed-only entries are based on local 40k.app weapon listings with official certification pending. The extra reviewed entries are sourced to current v1.3 secondary datasheets, not independently certified page-by-page to GW's complete Codex.
4. **Upgrades:** Detachment enhancements and conditional upgrades are a separate layer from equipped bio-weapons and should have their own completeness pass (including Norn-specific enhancements).
5. **Model points:** Variable weapon surcharges, where present, must be independently checked in the points engine; loadout validation alone does not certify pricing.

Regression coverage tests all 57 categories, exactly one physical selection for grouped profiles, per-model Zoanthrope quantities, correct two-cannon attack counts, and Harpy either/or options. No existing saved roster is modified by this PR.
