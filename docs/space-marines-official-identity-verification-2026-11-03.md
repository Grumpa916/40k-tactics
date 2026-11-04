# Space Marines official-source verification — identity, imports and eligibility

Audited 2026-11-03. This is the next phase after PR #507 (name coverage), not full current Codex/MFM certification.

## Authoritative sources examined

1. [Games Workshop, 2026-06 Space Marines 11e Faction Pack v1.0](https://assets.warhammer-community.com/eng_08-06_warhammer40000_faction_pack_space-marines-nd2ezs5yzn-wxe2nf2ckk.pdf) — official supplementary rules, including datasheets for **Marneus Calgar in Armour of Antilochus** (p.35), **Victrix Honour Guard** (p.39), **Captain Titus** (p.41), **Wardens of Ultramar** (p.43). Those published datasheets are authoritative for that June version; full post-October Codex comparison remains outstanding.
2. [Games Workshop Ultramarines preview, October 24, 2025](https://www.warhammer-community.com/en-gb/articles/isqbppri/ultramarines-rules-reveal-datasheet-previews-for-the-new-marneus-calgar-cato-sicarius-and-victrix-honour-guard/) — explicitly distinguishes Calgar's Antilochus suit from the previous Gravis version; confirms Victrix three/six-model sizes, up to one each Chapter Ancient and Chapter Champion, and their specialised unit identity.
3. [Games Workshop Big Space Marines News, August 24, 2026](https://www.warhammer-community.com/en-gb/articles/bbnskauh/big-space-marines-news/) — explicitly separates **Legendary Proxies** (Tactical Squad, Devastator Squad, Suppressor Squad, Pedro Kantor, Uriel Ventris) from actual Legends datasheets and states competitive event permission requirements.
4. [Games Workshop downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/) — latest MFM publication October 14, 2026. The older faction pack and August example do not by themselves certify current November 2026 prices or updated Codex combat characteristics.

## Confirmed bug and implemented fix

- V2 already had **Marneus Calgar** under stable ID `space-marines:marneus-calgar` with a Terminator-keyword profile. The generic name did not exactly match the full Warhammer App export **“Marneus Calgar in Armour of Antilochus”**. The previous importer required *exact* name equivalence; the full-name export could therefore be dropped as unrecognized, leaving Calgar absent from the applied battle roster.
- Added explicit *exact* import aliases for **Marneus Calgar in Armour of Antilochus** and **Marneus Calgar (Armour of Antilochus)**, preserving the same datasheet ID, existing saved-list compatibility and a full-name display on newly imported units.
- The Calgar unit browser displays **Armour of Antilochus** and searches the full name; old short-name imports continue to work.
- Do **not** automatically match “Marneus Calgar in Gravis Armour” to this Terminator profile. Different variants are not interchangeable and need an independent current-Codex profile before use.
- Regression coverage verifies both import spellings, full-name search, opponent battle assignment, historical short-name compatibility, and explicit rejection of an unverified Gravis variant.

## Official classification corrections

The 176-name independent reference used in PR #507 had mixed **Legends** and **Legendary Proxies** in one category. Corrected classification while preserving the existing optional roster browser:
- **5 Legendary Proxy names:** Pedro Kantor and Uriel Ventris → **Captain**; Tactical Squad → **Intercessor Squad**; Devastator Squad → **Desolation Squad**; Suppressor Squad → **Inceptor Squad**. Keep reference-only and hidden unless the user enables Legends and Legendary Proxies, and show event permission warnings. Do not auto-apply or substitute wargear.
- **84 Legends names:** remain distinct reference-only entries with no invented profiles or prices.

## Unit composition notes, deliberately not over-certified

- Official 11e PDF and preview support Victrix Honour Guard sizes **3 or 6**, with at most one Chapter Ancient and one Chapter Champion in a unit. The local cost and full equipment options remain pending the **October 2026** MFM/Codex comparison; the metadata is informational, not an enabled unpriced unit-size selection.
- Wardens of Ultramar are listed as a **six-model** unit in the June 2026 official faction pack; full October recheck pending.
- The older Calgar profile may still contain weapons/abilities whose complete October Codex cross-check is outstanding; the name/identity review must not be mistaken for full weapon certification.

## Remaining Space Marines verification order

1. Reconcile PR #506 (currently out of date with `main`) against current catalog and then confirm its MFM entries directly against the latest GW live MFM, especially October points and unit copy tiers. No automatic merge.
2. Import full current **11th-edition Space Marines Codex wargear selections** for high-use units first: Victrix Honour Guard, Wardens, Calgar, Assault Terminators, Aggressors, Eradicators, Intercessors. Include per-model limits, alternate weapon modes, leader joins and conditional upgrade costs.
3. Replace provisional independent source values for the other 15 newly added names only when authenticated official data is available. Full current faction pack/Codex verification remains separate from the published June reference.
4. Verify on iPad during a later live test that the correct full Calgar name survives battle import and placement.

No changes to an existing saved roster, game state, secondary scoring or approved map geometry.
