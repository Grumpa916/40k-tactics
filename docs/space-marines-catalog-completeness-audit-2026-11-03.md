# Space Marines datasheet-name completeness and Calgar discovery audit

Date: 2026-11-03. This is a **catalog-name coverage audit**, not a complete verification of every model's current official rules, selectable weapons, points or tournament eligibility.

## Sources

- Games Workshop Warhammer 40,000 downloads (official authority): https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/
- Warhammer Community Ultramarines source, describing Marneus Calgar's revised variants and guard arrangement: https://www.warhammer-community.com/en-gb/articles/isqbppri/ultramarines-rules-reveal-datasheet-previews-for-the-new-marneus-calgar-cato-sicarius-and-victrix-honour-guard/
- Independent current Space Marines datasheet-name and points list (updated **2026-11-02**): https://warmind.online/factions/space-marines

The comparison reference lists 176 names including Legends, of which 87 are classified as current non-Legends and 89 are Legends. The original app had only **72 current names** from a user Warhammer App export; the audited index adds **15 missing current names** and preserves **89 Legends names** strictly as unverified reference-only candidates. Not all faction-specific packs or newest FAQ rules have been directly compared with official documents.

## Why Marneus Calgar appeared missing

**Marneus Calgar already existed** in the base `src/data/space-marines-army-catalog.js` with ID `space-marines:marneus-calgar`, default size 1 and 180 points, plus a supplemental combat profile. A previous Calgar-only unit test verified the data structure, **but no user-visible name search field existed** even though `filterCatalog` accepted a search term. Finding him required manually scanning an extensive role-grouped catalog.

This does not conclusively explain the user's specific live-game symptom (the saved opponent roster could also have omitted him), so the fix adds a complete **catalog → search → Warhammer App import → battle assignment** regression. A unit present only in the global catalog does **not** automatically appear on the battlefield: the saved roster must contain that unit and be assigned to the relevant battle side.

The 2026 official Ultramarines preview also distinguishes an older Calgar build and a newer terminator-armour version. This pass does not silently alias differently named armour variants into one datasheet or assume they can coexist. Confirm edition/variant rules from the current Codex and FAQ before enabling alternate profile choices.

## Implemented

1. Add 15 overlooked current names and reference points: Aethon Shaan, Caanok Var, Captain Titus, Cato Sicarius, Chief Librarian Tigurius, Darnath Lysander, Iron Father Feirros, Kaius Konorius, Kayvaan Shrike, Kor'sarro Khan, Roboute Guilliman, Suboden Khan, Tor Garadon, Wardens of Ultramar and Victrix Honour Guard.
2. Retain missing current units as **name/points reference-only** until official datasheet profiles and loadout choices have been independently checked; do not invent damage values or equipment. Existing Marneus Calgar combat profile is preserved.
3. Add **89 Legends names**, hidden unless the user explicitly toggles *Include Legends*. They have **no invented points, weapons or stats**, and show event/tournament legality warnings.
4. Expose a **Find a unit by name** search field in the Army Builder unit browser. Trim whitespace; filter by unit name and available keywords/abilities, and group missing current Epic Heroes correctly at the top.
5. Show incomplete profile/Legends indicators in catalog rows, not misleading default model sizes or prices.
6. Regression tests assert all 87 current names, no duplicates, separate Legends filtering, Marneus Calgar search and 180-point profile, and Calgar/Victrix propagation into an opponent battle snapshot.

## Remaining work

- Direct official Codex + MFM comparison for each of the 15 added units' stats, weapons, points, Warlord/Leader rules, and alternative model size options. New candidate point values are attributed to a dated **independent** source only.
- Rules and participation check for 89 Legends entries; they remain user-request-only, reference names.
- Confirm whether the live-play opponent used an older *Calgar in Armour of Antilochus* export name or simply lacked Calgar in the applied saved roster. Preserve variant identity when importing; do not substitute automatically.
- Complete the full Space Marines selectable wargear/attachments review, including PR #506's separate points/baseline corrections.
- iPad Safari live acceptance remains outstanding.
