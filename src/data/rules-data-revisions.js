import { SPACE_MARINES_RULES_DATA } from "./space-marines-rules.js";
import { ADEPTUS_CUSTODES_RULES_DATA } from "./adeptus-custodes-faction-rules.js";
import { TYRANID_DETACHMENTS } from "./faction-detachments.js";
import { TYRANID_DETACHMENT_STRATAGEM_DATA } from "./tyranid-detachment-stratagems.js";

const TYRANIDS_RULES_DATA_REVISION = Object.freeze({
  schemaVersion: 1,
  faction: "Tyranids",
  edition: "11th",
  revisionId: "tyranids-11e-fp1.3-mfm-2026-10-14-catalog-2026-11-11.1",
  reviewedAt: "2026-11-11",
  factionRules: Object.freeze({
    name: "Games Workshop Tyranids Faction Pack",
    version: "1.3",
    publicationType: "Faction Pack",
    legalFrom: "2026-10-14",
    sourceUrl: "https://assets.warhammer-community.com/eng_14-10_wh40k_faction_pack_tyranids-an12izciwp-np2hnkcsje.pdf",
    detachments: Object.freeze(TYRANID_DETACHMENTS.map((detachment) => {
      const imported = TYRANID_DETACHMENT_STRATAGEM_DATA[detachment.name];
      return Object.freeze({
        ...detachment,
        stratagemCatalogStatus: imported?.status ?? "not-imported",
        ...(imported ? {
          stratagems: imported.stratagems,
          stratagemSource: Object.freeze({
            sourceName: imported.sourceName,
            sourceUrl: imported.sourceUrl,
            reviewedAt: imported.reviewedAt,
            version: imported.version
          })
        } : {})
      });
    }))
  }),
  enhancementAudit: Object.freeze({
    checkedAt:"2026-11-11",totalEntries:34,ordinaryEnhancements:30,upgrades:4,
    sourceUrl:"https://tactical40k.com/codex/tyranids",
    officialMfmPointsDirectlyRetrieved:false,
    sourceStatus:"current-october-secondary-reference-pending-primary-certification"
  }),
  points: Object.freeze({
    name: "Games Workshop Munitorum Field Manual",
    revision: "2026-10-14",
    revisionLabel: "updated 14/10/2026 (official date; prices independently cross-checked)",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
    benchmarkDate: "2026-11-08",
    independentlyComparedDefaultRows: 57,
    officialOctoberPriceRowsCertified: 0,
    verificationStatus: "secondary-price-reconciled-official-mfm-numeric-rows-pending"
  }),
  catalog: Object.freeze({
    revision: "2026-11-11.1",
    description: "57 Tyranid profiles, 56 structured wargear choices, 34 enhancement/Upgrade choices with eligibility/cost validation. October MFM and Codex direct certification pending."
  })
});

const BY_FACTION = Object.freeze({
  tyranids: TYRANIDS_RULES_DATA_REVISION,
  "adeptus custodes": Object.freeze({
    schemaVersion: 1,
    faction: "Adeptus Custodes",
    edition: "11th",
    revisionId: "adeptus-custodes-11e-codex-2026-10-mfm-2026-10-14-catalog-2026-10-23.1",
    reviewedAt: "2026-10-23",
    factionRules: ADEPTUS_CUSTODES_RULES_DATA,
    points: Object.freeze({
      name: "Games Workshop Munitorum Field Manual",
      revision: "2026-10-14",
      revisionLabel: "v1.6 · updated 14/10/2026",
      sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"
    }),
    catalog: Object.freeze({
      revision: "2026-10-23.1",
      description: "October 2026 Custodes Codex profiles, MFM points, attachments, detachments and reviewed loadout mappings"
    })
  }),
  "space marines": Object.freeze({
    schemaVersion: 1, faction: "Space Marines", edition: "11th",
    revisionId: "space-marines-11e-codex-oct-2026-catalog-2026-11-11.2",
    reviewedAt: "2026-11-11", factionRules: SPACE_MARINES_RULES_DATA,
    officialRevisionCheck: Object.freeze({
      indexedOfficialUpdate: "2026-10-14", checkedAt:"2026-11-04",
      status:"pending-current-official-profile-and-points-comparison",
      description:"GW publishes a 14 October 2026 MFM and Codex errata; full current GW price table and October Codex are not directly accessible here. 48 changed first-copy and 23 changed extra-copy MFM price rows are independently cross-checked, with a limited direct GW September balance/datasheet-preview check. Do not label 87 independently reviewed datasheets officially certified.",
      partialPricingAuditAt:"2026-11-04", baselineCharacteristicAuditAt:"2026-11-04"
    }),
    points: Object.freeze({
      name: "Warhammer App export supplied for 40K Tactics Space Marines expansion",
      revision: "2026-10-23", revisionLabel: "export points; 87 independently reconciled; official MFM cross-check pending",
      sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
      benchmarkDate: "2026-11-08",
      independentlyComparedDefaultRows: 87,
      officialOctoberPriceRowsCertified: 0,
      verificationStatus: "secondary-price-reconciled-official-mfm-numeric-rows-pending"
    }),
    catalog: Object.freeze({ revision: "2026-11-11.2", description: "87 current unit types with independently reviewed equipment; 16 current Codex detachments, 33 current Enhancements/Upgrades, explicit Legends labeling. Direct October Codex/MFM certification remains pending." })
  })
});

function key(value) {
  return String(value ?? "").trim().toLowerCase();
}

function clone(value) {
  if (value == null) return null;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function getRulesDataRevisionForFaction(faction) {
  return BY_FACTION[key(faction)] ?? null;
}

export function createRulesDataRevisionStamp(faction) {
  return clone(getRulesDataRevisionForFaction(faction));
}

export function formatRulesDataRevision(revision) {
  if (!revision) return "Rules data not tracked";
  const rules = revision.factionRules ?? {};
  const pack = rules.publicationType === "Codex"
    ? `${rules.name ?? "Codex"} · ${rules.version ?? "current"}`
    : rules.version ? `Faction Pack v${rules.version}` : (rules.name ?? "Faction rules");
  const points = revision.points?.revisionLabel ?? revision.points?.revision ?? "points revision unknown";
  return `${revision.faction} · ${pack} · MFM ${points}`;
}
