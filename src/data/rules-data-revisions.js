import { SPACE_MARINES_RULES_DATA } from "./space-marines-rules.js";
import { ADEPTUS_CUSTODES_RULES_DATA } from "./adeptus-custodes-faction-rules.js";
import { TYRANID_DETACHMENTS } from "./faction-detachments.js";
import { TYRANID_DETACHMENT_STRATAGEM_DATA } from "./tyranid-detachment-stratagems.js";

const TYRANIDS_RULES_DATA_REVISION = Object.freeze({
  schemaVersion: 1,
  faction: "Tyranids",
  edition: "11th",
  revisionId: "tyranids-11e-fp1.3-mfm-2026-10-14-catalog-2026-10-24.2",
  reviewedAt: "2026-10-24",
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
  points: Object.freeze({
    name: "Games Workshop Munitorum Field Manual",
    revision: "2026-10-14",
    revisionLabel: "updated 14/10/2026",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"
  }),
  catalog: Object.freeze({
    revision: "2026-10-24.2",
    description: "Tyranid roster profiles, points options, reviewed wargear mappings and complete 40K.app detachment stratagem references"
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
    revisionId: "space-marines-11e-faction-pack-2026-06-catalog-2026-10-23",
    reviewedAt: "2026-10-23", factionRules: SPACE_MARINES_RULES_DATA,
    points: Object.freeze({
      name: "Warhammer App export supplied for 40K Tactics Space Marines expansion",
      revision: "2026-10-23", revisionLabel: "export points; official MFM cross-check pending",
      sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"
    }),
    catalog: Object.freeze({ revision: "2026-10-23.1", description: "Space Marines unit catalog and official detachment dispositions" })
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
