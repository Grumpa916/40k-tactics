/**
 * Space Marines 11e publication/source audit (2026-11-04).
 *
 * Evidence grades must not be conflated:
 * - GW-publication: directly accessible GW article or dated downloads index.
 * - third-party-MFM-transcription: price numbers copied from a fan comparison.
 * - current-direct-MFM: NOT YET CHECKED; live faction page disallows retrieval.
 * - current-Codex-full-text: NOT YET CHECKED; printed/app Codex unavailable.
 *
 * Numeric transcriptions below permit repeatable automated comparison with
 * Army Builder, but do not confer official-data certification.
 */
import { SPACE_MARINES_WARGEAR_RULES } from './space-marines-wargear-rules.js';

const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const SPACE_MARINES_OFFICIAL_SOURCE_STATUS=Object.freeze({
  reviewedAt:'2026-11-04',
  currentUnitTypes:87,
  independentEleventhEditionLoadoutTypes:87,
  currentMfmGwPublishedDate:'2026-10-14',
  currentMfmDirectRowsVerified:false,
  codexOctober2026FullTextVerified:false,
  gwFactionErrataOctober14DirectTextVerified:false,
  gwSeptember2026ArticleChecked:true,
  gwSeptemberCodexPreviewChecked:true,
  staleMfmSearchIndexMustNeverOverrideLiveCosts:true,
  currentMfmUrl:'https://mfm.warhammer-community.com/en/space-marines',
  gwDownloadsUrl:'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/',
  gwCodexPreviewUrl:'https://www.warhammer-community.com/en-gb/articles/paxsnmde/first-look-space-marines-datasheets/',
  gwSeptemberBalanceUrl:'https://www.warhammer-community.com/en-gb/articles/rylbvfnv/warhammer-40000-balance-update-emboldened-astartes/',
  independentOctoberPriceUrl:'https://warpnexus.app/updates/2026-10-02/',
  independentOctoberNoChangeUrl:'https://warpnexus.app/updates/2026-10-14/',
  mfmDirectAccessResult:'HTTP 403 from automated live faction page; indexed copy is ~4 months older than GW current 14 October publication',
  codexAccessResult:'Public preview and downloads metadata available; full printed/electronic October 2026 Codex has not been supplied',
  nextOfficialBalanceWeekStart:'2026-12-07',
  certification:'pending-current-primary-source-verification'
});

/** Source: fan-published 2 October 2026 MFM price-change transcription.
 * Rows: [unit name, models, reported first-copy price].
 * These are secondary data checks, not verified live GW MFM rows.
 */
export const SPACE_MARINES_OCT02_INDEPENDENT_FIRST_COPY=freezeRows([
 ['Ancient',1,40],
 ['Assault Intercessor Squad',5,85],['Assault Intercessor Squad',10,170],
 ['Assault Intercessors with Jump Packs',5,95],
 ['Bladeguard Ancient',1,70],
 ['Bladeguard Veteran Squad',3,90],['Bladeguard Veteran Squad',6,180],
 ['Captain in Terminator Armour',1,90],
 ['Chaplain',1,60],['Chaplain in Terminator Armour',1,75],
 ['Chaplain on Bike',1,75],['Chaplain with Jump Pack',1,75],
 ['Company Heroes',4,125],['Desolation Squad',5,140],
 ['Eradicator Squad with Heavy Bolters',3,100],['Eradicator Squad with Heavy Bolters',6,215],
 ['Eradicator Squad with Melta Rifles',3,100],['Eradicator Squad with Melta Rifles',6,200],
 ['Gladiator Lancer',1,160],
 ['Heavy Intercessor Squad',5,115],['Heavy Intercessor Squad',10,230],
 ['Hellblaster Squad',5,115],['Hellblaster Squad',10,230],
 ['Inceptor Squad',3,130],['Inceptor Squad',6,260],
 ['Incursor Squad',5,90],['Incursor Squad',10,170],
 ['Infernus Squad',5,95],['Infernus Squad',10,190],
 ['Infiltrator Squad',5,85],
 ['Intercessor Squad',5,85],['Intercessor Squad',10,170],
 ['Invictor Tactical Warsuit',1,135],['Land Raider Crusader',1,230],
 ['Land Speeder',1,105],['Librarian in Terminator Armour',1,80],
 ['Lieutenant with Combi-Weapon',1,85],['Outrider Squad',3,80],
 ['Redemptor Dreadnought',1,170],['Repulsor Executioner',1,260],
 ['Storm Speeder Thunderstrike',1,140],['Techmarine',1,55],
 ['Terminator Assault Squad',5,170],['Terminator Assault Squad',10,340],
 ['Terminator Squad',5,190],['Terminator Squad',10,380],
 ['Vanguard Veteran Squad with Jump Packs',5,110],
 ['Vanguard Veteran Squad with Jump Packs',10,220]
]);

/** Source: same 2 October fan-published extra-copy change table.
 * Rows: [unit name, models, first copy number using increased price, points].
 */
export const SPACE_MARINES_OCT02_INDEPENDENT_EXTRA_COPY=freezeRows([
 ['Ballistus Dreadnought',1,3,170],
 ['Bladeguard Veteran Squad',3,3,110],['Bladeguard Veteran Squad',6,3,200],
 ['Brutalis Dreadnought',1,3,180],['Company Heroes',4,3,145],
 ['Eradicator Squad with Heavy Bolters',3,3,130],
 ['Eradicator Squad with Heavy Bolters',6,3,245],
 ['Eradicator Squad with Melta Rifles',3,3,120],
 ['Eradicator Squad with Melta Rifles',6,3,220],
 ['Gladiator Lancer',1,3,180],['Gladiator Reaper',1,3,185],
 ['Gladiator Valiant',1,3,185],
 ['Inceptor Squad',3,3,150],['Inceptor Squad',6,3,280],
 ['Invictor Tactical Warsuit',1,3,150],
 ['Land Raider',1,2,265],['Land Raider Crusader',1,2,250],
 ['Land Raider Redeemer',1,2,265],['Redemptor Dreadnought',1,3,190],
 ['Sternguard Veteran Squad',5,3,120],
 ['Sternguard Veteran Squad',10,3,225],
 ['Vanguard Veteran Squad with Jump Packs',5,3,130],
 ['Vanguard Veteran Squad with Jump Packs',10,3,240]
]);

// No current live MFM price is marked official until the dated source is
// directly read and its unit-size/copy/wargear rows individually compared.
export const SPACE_MARINES_PER_UNIT_SOURCE_STATUS=Object.freeze(
  Object.keys(SPACE_MARINES_WARGEAR_RULES).sort().map(id=>Object.freeze({
    datasheetId:id,
    independent11eWargearReviewed:true,
    currentOfficialCodexFullTextVerified:false,
    currentOfficialMfmPriceVerified:false,
    currentOfficialErrataCompared:false,
    status:'awaiting-current-GW-primary-source-comparison'
  }))
);
