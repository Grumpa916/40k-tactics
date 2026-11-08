import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_MISSION_MATRIX,
  getPrimaryMissionDefinition,
  listPrimaryMissionDefinitions
} from '../../src/data/primary-mission-catalog.js';
import {
  PRIMARY_PHOTOGRAPHED_SCORING_FACES,
  PRIMARY_PHOTOGRAPHED_ACTION_FACES,
  PRIMARY_OFFICIAL_FAQ_NOTES,
  PRIMARY_MISSION_EVIDENCE_SOURCES
} from '../../src/data/primary-mission-evidence.js';
import { primaryWindowDue } from '../../src/rules/checkpoint-mission-evidence.js';
import { renderPersistentMissionSummary } from '../../src/ui/mission-summary-panel.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

// Numeric cross-check independently transcribed from photographs of 25 official
// launch cards by wn-mitch/40kdc-data (commit 709ecd9f, September 2026).
// The reference is community-maintained: agreement is NOT official certification.
// Immovable Object: the same 5VP condition is printed at Command R2-4 and
// end of turn R5; the app models it as one time-qualified row.
// Purge and Secure: two alternative kill predicates share one 3VP award;
// the app models the two OR alternatives as one review row.
const EXPECTED_VP_VALUES = {
  "battlefield-dominance": [
    2,
    2,
    3
  ],
  "determined-acquisition": [
    2,
    3,
    3
  ],
  "immovable-object": [
    3,
    5
  ],
  "inescapable-dominion": [
    4,
    4,
    5,
    5
  ],
  "purge-and-secure": [
    3,
    3,
    4
  ],
  "unstoppable-force": [
    3,
    3,
    4,
    5
  ],
  "punishment": [
    4,
    5,
    5,
    8
  ],
  "meatgrinder": [
    3,
    4,
    5,
    5
  ],
  "destroyers-wrath": [
    3,
    4,
    4,
    6
  ],
  "consecrate": [
    3,
    4,
    4,
    5,
    6
  ],
  "death-trap": [
    2,
    3,
    3,
    4
  ],
  "outmanoeuvre": [
    4,
    5,
    6,
    10
  ],
  "delaying-action": [
    2,
    3,
    4
  ],
  "locate-and-deny": [
    4,
    4,
    4,
    5
  ],
  "smoke-and-mirrors": [
    2,
    2,
    4,
    10
  ],
  "secure-asset": [
    2,
    4,
    4,
    4
  ],
  "extract-relic": [
    3,
    4,
    4,
    4,
    5
  ],
  "vital-link": [
    1,
    2,
    4,
    4,
    10
  ],
  "sabotage": [
    2,
    3,
    4
  ],
  "vanguard-operation": [
    2,
    4,
    4,
    10
  ],
  "reconnaissance-sweep": [
    1,
    3,
    3,
    6
  ],
  "surveil-the-foe": [
    4,
    4,
    4,
    5
  ],
  "triangulation": [
    3,
    4,
    6,
    10,
    10
  ],
  "search-and-scour": [
    2,
    3,
    4,
    5
  ],
  "gather-intel": [
    4,
    5,
    5,
    6,
    7
  ]
};

const EXPECTED_MISSION_PAIRINGS = {
  "Take and Hold": {
    "Take and Hold": "battlefield-dominance",
    "Disruption": "determined-acquisition",
    "Purge the Foe": "immovable-object",
    "Priority Assets": "inescapable-dominion",
    "Reconnaissance": "purge-and-secure"
  },
  "Disruption": {
    "Take and Hold": "death-trap",
    "Disruption": "outmanoeuvre",
    "Purge the Foe": "delaying-action",
    "Priority Assets": "locate-and-deny",
    "Reconnaissance": "smoke-and-mirrors"
  },
  "Purge the Foe": {
    "Take and Hold": "unstoppable-force",
    "Disruption": "punishment",
    "Purge the Foe": "meatgrinder",
    "Priority Assets": "destroyers-wrath",
    "Reconnaissance": "consecrate"
  },
  "Priority Assets": {
    "Take and Hold": "secure-asset",
    "Disruption": "extract-relic",
    "Purge the Foe": "vital-link",
    "Priority Assets": "sabotage",
    "Reconnaissance": "vanguard-operation"
  },
  "Reconnaissance": {
    "Take and Hold": "reconnaissance-sweep",
    "Disruption": "surveil-the-foe",
    "Purge the Foe": "triangulation",
    "Priority Assets": "search-and-scour",
    "Reconnaissance": "gather-intel"
  }
};

const actualCards = listPrimaryMissionDefinitions();
const bySlug = Object.fromEntries(actualCards.map(card=>[card.id.replace(/^primary-/,''),card]));

test('all 25 disposition pairings independently match the official-deck transcription', () => {
  assert.equal(actualCards.length,25);
  assert.equal(Object.keys(bySlug).length,25);
  assert.equal(Object.keys(EXPECTED_VP_VALUES).length,25);
  for (const [own, opponents] of Object.entries(EXPECTED_MISSION_PAIRINGS)) {
    for (const [other, slug] of Object.entries(opponents)) {
      assert.equal(getPrimaryMissionDefinition(own,other)?.id,'primary-'+slug,own+' vs '+other);
    }
  }
});

test('25 complete primary scoring VP sets agree with independent transcription', () => {
  for (const [slug,expected] of Object.entries(EXPECTED_VP_VALUES)) {
    const card=bySlug[slug];
    assert.ok(card,slug);
    const actual=card.scoring.flatMap(window=>window.items.map(item=>item.vp)).sort((a,b)=>a-b);
    assert.deepEqual(actual,expected,slug+' VP values changed without a source check');
    assert.equal(card.officialCardVerified,false,slug+' must not be given a full official certificate');
    assert.equal(card.rulesVerified,false,slug+' is not fully certified from official cards');
  }
});

test('previously photographed primary faces distinguish scoring from action verification', () => {
  assert.equal(Object.keys(PRIMARY_PHOTOGRAPHED_SCORING_FACES).length,25);
  assert.equal(Object.keys(PRIMARY_PHOTOGRAPHED_ACTION_FACES).length,11);
  for (const card of actualCards) {
    const slug=card.id.replace(/^primary-/,'');
    assert.equal(card.photographedScoringFace,PRIMARY_PHOTOGRAPHED_SCORING_FACES[slug]??null,slug+' scoring photo evidence');
    assert.equal(card.photographedActionFace,PRIMARY_PHOTOGRAPHED_ACTION_FACES[slug]??null,slug+' Action photo evidence');
    if(card.photographedActionFace){
      assert.equal(card.action?.phase,'shooting',slug+' photographed Action should appear in mission reference');
      assert.equal(card.action?.reviewTiming,'end-of-turn',slug+' photographed Action completion timing');
    }
  }
  assert.equal(bySlug['triangulation'].action.minRound,2);
  assert.equal(bySlug['gather-intel'].action.minRound,2);
  assert.match(bySlug['locate-and-deny'].action.summary,/central objective/);
});

test('official Event Companion v1.2 primary FAQ notes remain scoped and visible in metadata', () => {
  assert.equal(PRIMARY_MISSION_EVIDENCE_SOURCES.officialCompanionVersion,'1.2');
  assert.equal(PRIMARY_MISSION_EVIDENCE_SOURCES.officialFullCardCertificateCount,0);
  for (const [slug,notes] of Object.entries(PRIMARY_OFFICIAL_FAQ_NOTES)) {
    assert.deepEqual(bySlug[slug].officialCompanionFaqNotes,notes);
  }
  assert.match(bySlug['death-trap'].officialCompanionFaqNotes.join(' '),/does not have to be trapped/);
  assert.match(bySlug['surveil-the-foe'].officialCompanionFaqNotes.join(' '),/later in the same turn/);
  assert.match(bySlug['vital-link'].officialCompanionFaqNotes.join(' '),/different central objectives/);
});

test('command-phase primary checks are not due before round 2; fifth-round end-turn replacements stay due', () => {
  for (const card of actualCards) {
    for (const window of card.scoring) {
      if (/Command phase/i.test(window.when)) {
        assert.equal(primaryWindowDue(window.when,'command-phase',1),false,card.name+' Command R1');
        if (/R5 end of turn/i.test(window.when)) {
          assert.equal(primaryWindowDue(window.when,'end-of-turn',5),true,card.name+' final turn');
        }
      }
    }
  }
});

test('official FAQ clarifications appear in expanded mission and scoring checkpoint views', () => {
  const state={phase:'end_turn',turn:3,activePlayer:'p1',battle:{round:2,activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],units:[],objectives:[],history:[],
    scoring:{secondaryMissions:[]},
    battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Take and Hold',layout:'A'}}};
  const summary=renderPersistentMissionSummary(state,{perspectivePlayerId:'p1'});
  assert.match(summary,/Official Event Companion FAQ/);
  assert.match(summary,/does not have to be trapped/);
  const definition=getPrimaryMissionDefinition('Disruption','Take and Hold');
  const reminder={timing:'end-of-turn',activePlayerId:'p1',groups:[{
    playerId:'p1',playerName:'You',checkpoint:'end-of-turn',
    primaryReference:definition,primaryScoringWindows:definition.scoring.filter(w=>primaryWindowDue(w.when,'end-of-turn',2)),
    review:{primary:[],secondary:[]}
  }]};
  const dialog=renderScoringCheckpointDialog(state,reminder);
  assert.match(dialog,/Official Event Companion FAQ/);
  assert.match(dialog,/does not have to be trapped/);
});

test('primary scoring reminders describe alternative kills, last-marker requirements, and protected Surveil targets', () => {
  const details=(id)=>bySlug[id].scoring.flatMap(window=>window.items.map(item=>item.summary));
  assert.match(details('purge-and-secure').join(' '),/OR an enemy unit that began the turn/);
  assert.match(details('purge-and-secure').join(' '),/not cumulative/);
  assert.equal(details('extract-relic').filter(text=>/Exactly one opponent operation marker/.test(text)).length,2);
  assert.equal(details('locate-and-deny').filter(text=>/Exactly one of your operation markers/.test(text)).length,2);
  assert.match(details('surveil-the-foe').join(' '),/still has an operation marker/);
  assert.match(details('reconnaissance-sweep').join(' '),/6 inches of the battlefield centre/);
  assert.match(details('reconnaissance-sweep').join(' '),/instead of the three-quarter tier/);
});

test('Nov 8 scoring and repeat Action photos retain distinct evidence identities',()=>{
  assert.equal(PRIMARY_PHOTOGRAPHED_SCORING_FACES['reconnaissance-sweep'],'IMG_036DC38C-9A7B-42B0-8253-F2849AECE7F7.jpeg');
  assert.equal(PRIMARY_PHOTOGRAPHED_SCORING_FACES['secure-asset'],'IMG_9AABC8D9-D31D-4874-8521-07E4C8F38BA3.jpeg');
  assert.equal(PRIMARY_PHOTOGRAPHED_ACTION_FACES['triangulation'],'IMG_036DC38C-9A7B-42B0-8253-F2849AECE7F7.jpeg');
  assert.equal(PRIMARY_PHOTOGRAPHED_ACTION_FACES['surveil-the-foe'],'IMG_9AABC8D9-D31D-4874-8521-07E4C8F38BA3.jpeg');
  for(const slug of ['locate-and-deny','triangulation','surveil-the-foe']){
    assert.equal(PRIMARY_PHOTOGRAPHED_SCORING_FACES[slug],
      'IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg',slug+' scoring photo');
  }
  assert.equal(new Set(Object.keys(PRIMARY_PHOTOGRAPHED_SCORING_FACES)).size,25);
});
