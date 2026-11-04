/**
 * Selected Space Marines price/size rows cross-checked against the 2026-10-02
 * Munitorum Field Manual changes recorded by Warp Nexus. Their 2026-10-14
 * update report says GW did not change Space Marine points again that day.
 *
 * This is an independent transcription cross-check, not a direct capture of
 * the latest official MFM page; faction rules/datasheets and wargear options
 * remain separately pending full official Codex verification.
 *
 * GW live MFM: https://mfm.warhammer-community.com/en/space-marines
 * Price changes: https://warpnexus.app/updates/2026-10-02/
 * October 14 no-change confirmation: https://warpnexus.app/updates/2026-10-14/
 */
const option=(models,points,condition=null)=>Object.freeze({
  models,points,...(condition?{condition}:{})
});
const fixed=(...rows)=>Object.freeze(rows.map(([models,points])=>option(models,points)));
const copies=(base,additional,from=3)=>Object.freeze([
  ...base.map(([models,points])=>option(models,points,from===2?'1st unit':'1st–2nd units')),
  ...additional.map(([models,points])=>option(models,points,from===2?'2nd+ units':'3rd+ units'))
]);

export const SPACE_MARINES_MFM_PRICE_SOURCES=Object.freeze({
  gwLiveMfm:"https://mfm.warhammer-community.com/en/space-marines",
  independentPriceReview:"https://warpnexus.app/updates/2026-10-02/",
  followupNoChangeReview:"https://warpnexus.app/updates/2026-10-14/",
  sourceReviewDate:"2026-11-03",
  applicableMfmPublicationDate:"2026-10-14",
  officialPdfCurrentContentsIndependentlyChecked:false,
  verificationLevel:"independent-mfm-pricing-cross-check"
});

export const SPACE_MARINES_MFM_PRICE_OPTIONS=Object.freeze({
  // Core infantry options with known, explicitly published alternative sizes.
  "Assault Intercessor Squad":fixed([5,85],[10,170]),
  "Heavy Intercessor Squad":fixed([5,115],[10,230]),
  "Intercessor Squad":fixed([5,85],[10,170]),
  "Assault Intercessors with Jump Packs":copies([[5,95],[10,190]],[[5,105],[10,200]]),
  "Hellblaster Squad":copies([[5,115],[10,230]],[[5,130],[10,245]]),
  "Incursor Squad":copies([[5,90],[10,170]],[[5,100],[10,180]]),
  "Infiltrator Squad":fixed([5,85],[10,150]),
  "Reiver Squad":fixed([5,85],[10,165]),
  "Infernus Squad":copies([[5,95],[10,190]],[[5,105],[10,200]]),
  "Desolation Squad":copies([[5,140]],[[5,150]]),
  "Scout Squad":fixed([5,65],[10,120]),
  // 3-model 80 vs 85 remains disputed between independent current sources;
  // retain the imported 80 rather than pretending an official MFM check.
  "Outrider Squad":fixed([3,80],[6,160]),
  // Current 11e datasheet also records a 3rd+ copy tier. A storm shield
  // costs an additional 5 points per equipped model (handled by cost resolver).
  "Terminator Assault Squad":copies([[5,170],[10,340]],[[5,210],[10,380]]),
  "Terminator Squad":copies([[5,190],[10,380]],[[5,230],[10,420]]),
  // Named unit groups with both size and additional-copy pricing.
  "Aggressor Squad":copies([[3,90],[6,180]],[[3,100],[6,190]]),
  "Bladeguard Veteran Squad":copies([[3,90],[6,180]],[[3,110],[6,200]]),
  "Eradicator Squad with Melta Rifles":copies([[3,100],[6,200]],[[3,120],[6,220]]),
  "Eradicator Squad with Heavy Bolters":copies([[3,100],[6,215]],[[3,130],[6,245]]),
  "Inceptor Squad":copies([[3,130],[6,260]],[[3,150],[6,280]]),
  "Vanguard Veteran Squad with Jump Packs":copies([[5,110],[10,220]],[[5,130],[10,240]]),
  "Sternguard Veteran Squad":copies([[5,105],[10,210]],[[5,120],[10,225]]),
  // Vehicles and fixed-size units with copy-order cost bands.
  "Firestrike Servo-turrets":fixed([1,80],[2,160]),
  "Invader ATVs":copies([[1,65],[2,130]],[[1,75],[2,140]]),
  "Ballistus Dreadnought":copies([[1,150]],[[1,170]]),
  "Brutalis Dreadnought":copies([[1,160]],[[1,180]]),
  "Company Heroes":copies([[4,125]],[[4,145]]),
  "Gladiator Lancer":copies([[1,160]],[[1,180]]),
  "Gladiator Reaper":copies([[1,165]],[[1,185]]),
  "Gladiator Valiant":copies([[1,165]],[[1,185]]),
  "Invictor Tactical Warsuit":copies([[1,135]],[[1,150]]),
  "Land Raider":copies([[1,245]],[[1,265]],2),
  "Land Raider Crusader":copies([[1,230]],[[1,250]],2),
  "Land Raider Redeemer":copies([[1,245]],[[1,265]],2),
  "Redemptor Dreadnought":copies([[1,170]],[[1,190]]),
  // Confirmed October 2 first-copy change that the old import missed.
  "Repulsor Executioner":fixed([1,260])
});
