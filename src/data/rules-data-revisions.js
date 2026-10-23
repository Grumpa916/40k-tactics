const TYRANIDS_RULES_DATA_REVISION = Object.freeze({
  schemaVersion: 1,
  faction: "Tyranids",
  edition: "11th",
  revisionId: "tyranids-11e-fp1.0-mfm-2026-10-14-catalog-2026-10-22.1",
  reviewedAt: "2026-10-22",
  factionRules: Object.freeze({
    name: "Games Workshop Tyranids Faction Pack",
    version: "1.0",
    legalFrom: "2026-06-20",
    sourceUrl: "https://assets.warhammer-community.com/eng_09-06_warhammer40000_faction_pack_tyranids-avhhzmcte8-j0kseag7td.pdf"
  }),
  points: Object.freeze({
    name: "Games Workshop Munitorum Field Manual",
    revision: "2026-10-14",
    revisionLabel: "updated 14/10/2026",
    sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/"
  }),
  catalog: Object.freeze({
    revision: "2026-10-22.1",
    description: "Tyranid roster profiles, points options and reviewed wargear mappings"
  })
});

const BY_FACTION = Object.freeze({
  tyranids: TYRANIDS_RULES_DATA_REVISION,
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
  const pack = revision.factionRules?.version ? `Faction Pack v${revision.factionRules.version}` : "Faction rules";
  const points = revision.points?.revisionLabel ?? revision.points?.revision ?? "points revision unknown";
  return `${revision.faction} · ${pack} · MFM ${points}`;
}
import { SPACE_MARINES_RULES_DATA } from "./space-marines-rules.js";

