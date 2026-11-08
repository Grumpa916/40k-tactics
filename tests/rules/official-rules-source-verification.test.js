import test from 'node:test';
import assert from 'node:assert/strict';

import { OFFICIAL_RULES_SOURCE_INDEX, MISSION_SOURCE_VERIFICATION, missionSourceNotice } from '../../src/data/official-rules-source-index.js';
import { PRIMARY_MISSION_MATRIX, PRIMARY_MISSION_CATALOG_SOURCE } from '../../src/data/primary-mission-catalog.js';
import { COMPLETE_SECONDARY_MISSION_CATALOG, SECONDARY_MISSION_IMPORT_SOURCE } from '../../src/data/secondary-mission-complete-catalog.js';
import { SECONDARY_MISSION_CATALOG_SOURCE } from '../../src/data/secondary-mission-catalog.js';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { VICTORY_POINT_CAPS } from '../../src/engine/victory-points-ledger.js';
import { getRulesDataRevisionForFaction } from '../../src/data/rules-data-revisions.js';

test('official publication index is dated and does not imply full document comparison', () => {
  const sources=OFFICIAL_RULES_SOURCE_INDEX;
  assert.equal(sources.checkedAt,'2026-11-03');
  assert.equal(sources.edition,'11th');
  assert.match(sources.downloadsUrl,/warhammer-community\.com\/en-gb\/downloads\/warhammer-40000/);
  assert.equal(sources.publications.eventCompanion.version,'1.2');
  assert.equal(sources.publications.eventCompanion.updatedAt,'2026-10-14');
  assert.equal(sources.publications.eventCompanion.status,'official-source-authenticated-content-partially-checked');
  assert.equal(sources.publications.eventCompanion.geometryStatus,'previously-reviewed-by-user');
  assert.equal(sources.publications.munitorumFieldManual.updatedAt,'2026-10-14');
  assert.equal(sources.publications.coreRules.updatedAt,'2026-06-01');
  assert.equal(sources.publications.universalRules.updatedAt,'2026-08-26');
  assert.equal(sources.nextScheduledOfficialBalanceWeek,'2026-12-07');
  assert.equal(EVENT_COMPANION_MAP_CATALOG.source.version,'1.2');
  assert.equal(EVENT_COMPANION_MAP_CATALOG.source.sourceUrl,sources.publications.eventCompanion.url);
});

test('all 25 primary and 18 secondary card records expose honest provenance', () => {
  assert.equal(PRIMARY_MISSION_CATALOG_SOURCE.verificationLevel,'community-structured-reference');
  assert.equal(PRIMARY_MISSION_CATALOG_SOURCE.officialCardVerified,false);
  let n=0;
  for(const row of Object.values(PRIMARY_MISSION_MATRIX)) for(const mission of Object.values(row)){
    n++;
    assert.equal(mission.rulesVerified,false);
    assert.equal(mission.officialCardVerified,false);
    assert.equal(mission.sourceVerification,'community-structured-reference');
  }
  assert.equal(n,25);
  assert.equal(COMPLETE_SECONDARY_MISSION_CATALOG.length,18);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.verificationLevel,'user-supplied-card-transcription');
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.officialCardVerified,false);
  assert.equal(SECONDARY_MISSION_IMPORT_SOURCE.officialCardVerified,false);
  const photographed = new Set(['Assassination','Bring it Down','Beacon','Defend Stronghold','Cleanse','Burden of Trust']);
  let physicalCount = 0;
  for(const card of COMPLETE_SECONDARY_MISSION_CATALOG){
    assert.equal(card.rulesVerified,true,'reviewed against supplied card transcription: '+card.name);
    const verified = photographed.has(card.name);
    assert.equal(card.officialCardVerified,verified,'physical photo status: '+card.name);
    assert.equal(card.sourceVerification,
      verified?'physical-official-card-photo-2026-11-08':'user-supplied-card-transcription');
    if(verified)physicalCount++;
    assert.equal(card.scoringAuthority,'manual-player-confirmation');
  }
  assert.equal(physicalCount,6);
});

test('reference wording separates physical official checking from user transcription', () => {
  assert.equal(MISSION_SOURCE_VERIFICATION.primary.officialCardChecked,false);
  assert.equal(MISSION_SOURCE_VERIFICATION.secondary.officialCardChecked,false);
  assert.match(missionSourceNotice({name:'Primary'},'primary'),/community-structured/);
  assert.match(missionSourceNotice({name:'Secondary'},'secondary'),/not yet photo-verified/);
  assert.match(missionSourceNotice({name:'Official',officialCardVerified:true},'secondary'),/official printed source/);
  assert.equal(missionSourceNotice(null,'primary'),'');
});

test('official procedural caps are unchanged by the provenance update',()=>{
  assert.deepEqual(VICTORY_POINT_CAPS,{
    primaryPerTurn:15,primaryPerGame:45,secondaryPerTurn:15,secondaryPerGame:45,fixedSecondaryPerCard:20
  });
});

test('Space Marines catalog is explicitly flagged for post-October official comparison',()=>{
  const marines=getRulesDataRevisionForFaction('Space Marines');
  assert.equal(marines.officialRevisionCheck.indexedOfficialUpdate,'2026-10-14');
  assert.equal(marines.officialRevisionCheck.status,'pending-current-official-profile-and-points-comparison');
  assert.equal(marines.points.revisionLabel,'export points; official MFM cross-check pending');
  const tyranids=getRulesDataRevisionForFaction('Tyranids');
  assert.equal(tyranids.points.revision,'2026-10-14');
});
