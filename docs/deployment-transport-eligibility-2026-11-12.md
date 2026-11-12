# Transport declarations — 12 November 2026

The combined Deploy & Begin workspace now hides Transport assignments unless a roster contains a TRANSPORT unit. The guided preparation flow uses the same eligibility rules. A non-Transport friendly unit is never offered as a carrier.

For reviewed Space Marine transport profiles, each candidate passenger must have a compatible ADEPTUS ASTARTES INFANTRY (or allowed Thunderhawk MOUNTED) keyword, and **the whole unit** including attached Leaders must fit remaining capacity. Checked 11e classes: Rhino, Impulsor, Drop Pod, Land Raider / Crusader / Redeemer, Repulsor / Executioner and Thunderhawk. The source-scoped space/keyword matrix is in `src/rules/deployment-transport-eligibility.js`. The profiles follow the repository's reviewed October Codex transcription and independent November checks. They are **not a blanket official Codex certification**.

Invalid/legacy assignments remain visible for correction but prevent deployment from completing. Dedicated Transports require an embarked unit at deployment. When a carrier is reserved, its embarked passengers and attached models remain off-map and count toward reserves. Unknown transport datasheets cannot silently accept passengers; review their current datasheet before extending structured coverage.

The physical event rules remain authoritative for unusual passenger exceptions, special attachments, and transport-specific deployment/disembarkation abilities. This change affects only pre-game assignment/validation, not live-phase embark/disembark commands or mission/scoring rules.

Sources: https://www.40k.app/995/factions/space-marines/units/impulsor and https://www.40k.app/995/factions/space-marines/units/rhino; current reviewed profiles in the repository.
