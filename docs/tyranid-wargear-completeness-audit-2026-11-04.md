# Tyranid structured wargear completeness audit — 4 November 2026

## Scope and evidence standard

Examined all **57** Tyranid catalog entries and the structured equipment rules on the current repository branch. This is a repository coverage/composition audit grounded in the existing `src/data/tyranid-datasheet-details.js` transcriptions (predominantly 40k.app material dated 12 October 2026), **not a fresh full GW Codex/Munitorum Field Manual certification**. The existing official GW June Faction Pack supports specific revised Tyranid datasheets, but does not itself certify all 57 equipment tables. No disputed or unknown options were inferred.

### Coverage by classification

| Class | Entries | Treatment |
| --- | ---: | --- |
| Existing structured selectable wargear | 11 | Preserved, no changes to legal combinations |
| Source-listed fixed weapons added | 34 | Declared fixed quantity: one per single model or per model in uniform squads; authoritative option detail still to cross-check |
| Explicitly no conventional weapon profiles | 2 | Mucolid Spores, Spore Mines: `noEquipment: true` (special abilities remain separate) |
| Complex unresolved alternative/composition profiles | 10 | No automatic loadout inference until source verification |
| **Total** | **57** | Entire catalog classified |

The newly added fixed-only entries are explicitly tagged `officialWargearCertification: pending`; having structured coverage does not certify a newer official update. Existing saved rosters are unchanged.

### Priority units

- **Exocrine:** Bio-plasmic cannon and Powerful limbs are listed as fixed on the local datasheet; now modeled as separate shooting/melee selections.
- **Norn Assimilator:** The local datasheet lists Toxinjector Harpoon ranged, Monstrous scything talons, and Toxinjector Harpoon melee, but imported selection quantities conflict with one-per-profile assumptions. Hold pending model-specific reconciliation.
- **Hormagaunts:** Hormagaunt talons modeled per model.
- **Zoanthropes:** Two Warp Blast variants (witchfire and focused witchfire) are grouped modes; require exact selection semantics before fixed-weapon automation.
- **Norn Emissary:** Three Psychic Tendril profiles and two melee profiles require grouped/alternative mode verification before automated equipment quantities.

### Other unresolved entries (exactly 10)

1. Old One Eye — separate strike/sweep claws profiles.
2. Zoanthropes — alternate Warp Blast modes.
3. Maleceptor — alternate massive scything talon strike/sweep.
4. Norn Emissary — multi-mode psychic tendrils and melee profile interaction.
5. Harpy — twin heavy venom cannon vs twin stranglethorn cannon may be alternatives, despite both appearing as Default in the local catalog.
6. Hyperadapted Raveners — mixed Prime/Ravener model equipment; do not multiply all weapons by model count.
7. Norn Assimilator — imported loadout does not support unconditional one-copy-per-profile assumptions.
8. Toxicrene — ranged/melee lashes may represent shared equipment profiles; importer conflicts with automatic rule.
9. Hierophant — imported equipment quantities contradict simple per-profile inference.
10. Harridan — imported equipment quantities contradict simple per-profile inference.

These ten have valid reference data but no complete modeled selection rules; hold as `loadout rules coverage pending` rather than adding invented options.

### Exclusions and follow-up

- Compare current primary GW Codex/Faction Pack and MFM to verify all fixed weapon counts, costs, options and FAQ changes. Additional weapons that the existing local datasheet lacks cannot be detected by this internal audit alone.
- Verify any model compositions with exceptional leader/sergeant loadouts, including standard troop datasets before claiming tournament-safe legality.
- Check existing saved Tyranid rosters for new `manual-selection-required` states and confirm manual editing is practical on iPad.
- Review alternative profile combat logic so the Tactical Advisor never combines mutually exclusive fire modes.
- Run full CI and iPad battle smoke tests; do not merge before green checks.

## Implementation

`src/data/tyranid-fixed-wargear-coverage.js` contains the explicit fixed-only allowlist, weaponless exception, and ten-item exclusion list. The existing Tyranid data router incorporates the fixed-only rules. Tests enforce 57-entry partitioning, profile identities, quantities, and no-weapon handling.
