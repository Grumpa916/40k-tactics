/**
 * Authoritative publication index vs independently checked rules content.
 * Last publication-listing check: 2026-11-08.
 *
 * A current download listing does NOT mean the app's mission-card transcript
 * or the whole Event Companion PDF was independently compared with that edition.
 * Do not upgrade sourceVerification to official-checked without that comparison.
 */
export const OFFICIAL_RULES_SOURCE_INDEX = Object.freeze({
  checkedAt: "2026-11-08",
  edition: "11th",
  downloadsUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/",
  publications: Object.freeze({
    coreRules: Object.freeze({ name:"Core Rules", updatedAt:"2026-06-01", status:"publication-listed" }),
    universalRules: Object.freeze({ name:"Universal Rules Updates", updatedAt:"2026-08-26", status:"publication-listed" }),
    eventCompanion: Object.freeze({
      name:"Warhammer Event Companion", version:"1.3", updatedAt:"2026-10-14",
      url:"https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf",
      officialSourceAuthority:"verified-games-workshop-publication-link",
      inspectedDocumentVersion:"1.2",
      inspectedPages:Object.freeze([1,2,8,9]),
      verifiedProcedures:Object.freeze(["event mission sequence","40K 44x60 battlefield","Fixed/Tactical timing","VP caps","layout legend"]),
      currentFaqCrossCheck:"v1.3 reproduced mission FAQ compared with earlier official v1.2; v1.3 full PDF not retrieved",
      status:"official-version-1.3-identified-faq-content-crosschecked-full-pdf-pending",
      geometryStatus:"v1.2-previously-reviewed-by-user-v1.3-geometry-not-rechecked"
    }),
    munitorumFieldManual: Object.freeze({
      name:"Munitorum Field Manual", updatedAt:"2026-10-14",
      url:"https://mfm.warhammer-community.com/",
      status:"publication-listed-data-not-fully-rechecked"
    }),
    custodes: Object.freeze({ name:"Adeptus Custodes", updatedAt:"2026-10-14", status:"publication-listed" }),
    tyranids: Object.freeze({ name:"Faction Pack: Tyranids", updatedAt:"2026-10-14", status:"publication-listed" }),
    spaceMarines: Object.freeze({ name:"Space Marines", updatedAt:"2026-10-14", status:"publication-listed" }),
    worldChampionships2026: Object.freeze({
      name:"World Championships Rules Updates - November 2026",
      url:"https://warcomprod2024productionstorage.s3.eu-west-2.amazonaws.com/worldchamps2026faqs/wcw2026_40k_update-z28qslftvl-ooradhsjdb.pdf",
      applicability:"world-championships-2026-only",
      status:"official-event-only-clarifications-not-general-rules-or-errata"
    })
  }),
  pendingPublicationCheck: "https://www.warhammer-community.com/en-gb/articles/cumo9vbg/the-warhammer-40000-updates-update/",
  nextScheduledOfficialBalanceWeek: "2026-12-07"
});

export const MISSION_SOURCE_VERIFICATION = Object.freeze({
  primary: Object.freeze({
    level:"community-structured-reference",
    officialCardChecked:false,
    description:"Primary reference remains community-structured, but all 25 printed scoring faces and 11 printed Action faces have been compared with the physical deck. Full current official PDF/FAQ certification remains separate."
  }),
  secondary: Object.freeze({
    level:"physical-official-card-photo-2026-11-08",
    officialCardChecked:true,
    description:"This individual Secondary card has no verified physical-photo record; review the printed card. All 18 catalog entries were directly photo-compared on 2026-11-08, subject to later FAQ/errata."
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
