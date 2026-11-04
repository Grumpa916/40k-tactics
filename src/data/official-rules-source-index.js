/**
 * Authoritative publication index vs independently checked rules content.
 * Last publication-listing check: 2026-11-03.
 *
 * A current download listing does NOT mean the app's mission-card transcript
 * or the whole Event Companion PDF was independently compared with that edition.
 * Do not upgrade sourceVerification to official-checked without that comparison.
 */
export const OFFICIAL_RULES_SOURCE_INDEX = Object.freeze({
  checkedAt: "2026-11-03",
  edition: "11th",
  downloadsUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
  publications: Object.freeze({
    coreRules: Object.freeze({ name:"Core Rules", updatedAt:"2026-06-01", status:"publication-listed" }),
    universalRules: Object.freeze({ name:"Universal Rules Updates", updatedAt:"2026-08-26", status:"publication-listed" }),
    eventCompanion: Object.freeze({
      name:"Warhammer Event Companion", version:"1.2", updatedAt:"2026-10-14",
      url:"https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf",
      officialSourceAuthority:"verified-games-workshop-publication",
      inspectedDocumentVersion:"1.2",
      inspectedPages:Object.freeze([1,2,8,9]),
      verifiedProcedures:Object.freeze(["event mission sequence","40K 44x60 battlefield","Fixed/Tactical timing","VP caps","layout legend"]),
      status:"official-source-authenticated-content-partially-checked",
      geometryStatus:"previously-reviewed-by-user"
    }),
    munitorumFieldManual: Object.freeze({
      name:"Munitorum Field Manual", updatedAt:"2026-10-14",
      url:"https://mfm.warhammer-community.com/",
      status:"publication-listed-data-not-fully-rechecked"
    }),
    custodes: Object.freeze({ name:"Adeptus Custodes", updatedAt:"2026-10-14", status:"publication-listed" }),
    tyranids: Object.freeze({ name:"Faction Pack: Tyranids", updatedAt:"2026-10-14", status:"publication-listed" }),
    spaceMarines: Object.freeze({ name:"Space Marines", updatedAt:"2026-10-14", status:"publication-listed" })
  }),
  pendingPublicationCheck: "https://www.warhammer-community.com/en-gb/articles/cumo9vbg/the-warhammer-40000-updates-update/",
  nextScheduledOfficialBalanceWeek: "2026-12-07"
});

export const MISSION_SOURCE_VERIFICATION = Object.freeze({
  primary: Object.freeze({
    level:"community-structured-reference",
    officialCardChecked:false,
    description:"Primary scoring reference is community-structured; official printed-card comparison remains outstanding."
  }),
  secondary: Object.freeze({
    level:"user-supplied-card-transcription",
    officialCardChecked:false,
    description:"Secondary rules are transcribed from supplied card text; independent official-card comparison is on hold."
  }),
  eventCompanion: Object.freeze({
    level:"previous-user-reviewed-geometry",
    currentEditionRechecked:false,
    description:"Terrain geometry was previously accepted; the latest official October PDF has not been re-compared."
  })
});

export function missionSourceNotice(definition, category) {
  if (!definition) return "";
  if (category === "primary") {
    return MISSION_SOURCE_VERIFICATION.primary.description;
  }
  if (category === "secondary") {
    return definition?.officialCardVerified === true
      ? "Secondary card checked against an official printed source."
      : MISSION_SOURCE_VERIFICATION.secondary.description;
  }
  return "";
}
