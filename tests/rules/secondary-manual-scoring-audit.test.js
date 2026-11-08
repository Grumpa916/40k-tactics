import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPLETE_SECONDARY_MISSION_CATALOG } from '../../src/data/secondary-mission-complete-catalog.js';
import { SECONDARY_MISSION_CATALOG_SOURCE } from '../../src/data/secondary-mission-catalog.js';
import { getMissionVpOptions, renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';
import { evaluateScoringCheckpoint } from '../../src/engine/scoring-check-coordinator.js';
import { recordSecondaryMissionScore } from '../../src/engine/secondary-mission-scoring.js';
import { recordVictoryPointsAward } from '../../src/engine/victory-points-ledger.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';

// Explicit review matrix: modes, checkpoints, and VP options are asserted for every
// card. These are based on the project's user-supplied 2026-27 card transcription.
// The physical deck and current official FAQs remain authoritative.
const MATRIX = [
  ['a-grievous-blow', { fixed: { 'end-of-turn':[4,5], 'end-of-opponent-turn':[4,5] }, tactical: { 'end-of-turn':[5], 'end-of-opponent-turn':[5] } }],
  ['a-tempting-target', { tactical: { 'end-of-turn':[5] } }],
  ['assassination', { fixed: { 'end-of-turn':[3,4,6,7,8,9,10,11,12,13,14,15], 'end-of-opponent-turn':[3,4,6,7,8,9,10,11,12,13,14,15] }, tactical: { 'end-of-turn':[5], 'end-of-opponent-turn':[5] } }],
  ['beacon', { tactical: { 'end-of-opponent-turn':[3,5] } }],
  ['behind-enemy-lines', { tactical: { 'end-of-turn':[3,5] } }],
  ['bring-it-down', { fixed: { 'end-of-turn':[4,8,12], 'end-of-opponent-turn':[4,8,12] }, tactical: { 'end-of-turn':[5], 'end-of-opponent-turn':[5] } }],
  ['burden-of-trust', { tactical: { 'end-of-opponent-turn':[2,4,5] } }],
  ['centre-ground', { tactical: { 'end-of-turn':[3,5] } }],
  ['cleanse', { tactical: { 'end-of-turn':[2,5] } }],
  ['defend-stronghold', { tactical: { 'end-of-opponent-turn':[3,5] } }],
  ['display-of-might', { tactical: { 'end-of-turn':[2], 'end-of-opponent-turn':[5] } }],
  ['engage-on-all-fronts', { fixed: { 'end-of-turn':[2,4] }, tactical: { 'end-of-turn':[3,5] } }],
  ['forward-position', { tactical: { 'end-of-turn':[5] } }],
  ['no-prisoners', { tactical: { 'end-of-turn':[2,4,5], 'end-of-opponent-turn':[2,4,5] } }],
  ['outflank', { tactical: { 'end-of-turn':[3,5] } }],
  ['overwhelming-force', { tactical: { 'end-of-turn':[3,5], 'end-of-opponent-turn':[3,5] } }],
  ['plunder', { tactical: { 'end-of-turn':[5] } }],
  ['secure-no-mans-land', { tactical: { 'end-of-turn':[5] } }]
];

const byId = new Map(COMPLETE_SECONDARY_MISSION_CATALOG.map(card => [card.id, card]));
const stateFor = (card, mode = 'tactical', round = 2, activePlayer = 'p1') => ({
  phase:'end_turn', turn:3, activePlayer, battle:{status:'active',round,activePlayerId:activePlayer},
  players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
  history:[], units:[], objectives:[],
  scoring:{secondaryMissionModeByPlayer:{p1:mode,p2:'tactical'}, secondaryMissions:[
    {instanceId:'reviewed-card',definitionId:card.id,playerId:'p1',status:'active',definition:card}
  ]}
});

test('audit matrix covers all 18 transcribed Secondary cards and their allowed modes', () => {
  assert.equal(COMPLETE_SECONDARY_MISSION_CATALOG.length,18);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.userSuppliedCardTextCount,18);
  assert.deepEqual([...byId.keys()].sort(),MATRIX.map(([id])=>'secondary-'+id).sort());
  assert.equal(new Set(MATRIX.map(([id])=>id)).size,18);
  for (const [slug,modes] of MATRIX) {
    const card=byId.get('secondary-'+slug);
    assert.equal(card.scoringAuthority,'manual-player-confirmation',slug);
    assert.equal(card.rulesVerified,true,slug+' must reflect its transcribed card rules');
    assert.deepEqual([...card.availableModes].sort(),Object.keys(modes).sort(),slug);
    assert.ok(card.scoringWindows.length>0,slug);
    for(const window of card.scoringWindows) {
      assert.ok(window.tiers.length,slug+' window needs rules');
      assert.equal(window.source,'user-provided-card-text',slug);
      assert.ok(['end-of-turn','end-of-opponent-turn'].includes(window.timing),slug);
      for(const tier of window.tiers) assert.ok(Number.isInteger(tier.vp)&&tier.vp>0,slug);
    }
  }
});

test('every Secondary mode and checkpoint exposes its correct manual VP choices', () => {
  for(const [slug,modes] of MATRIX) {
    const card=byId.get('secondary-'+slug);
    for(const [mode,byTiming] of Object.entries(modes)) {
      for(const timing of ['command-phase','end-of-turn','end-of-opponent-turn','end-of-battle']) {
        const selected=card.scoringWindows.filter(w=>w.timing===timing&&w.modes.includes(mode));
        const expected=byTiming[timing]??null;
        assert.equal(selected.length>0,expected!==null,slug+' '+mode+' '+timing);
        if(expected!==null) {
          const values=getMissionVpOptions({category:'secondary',instanceId:'reviewed-card',result:{scoringWindows:selected}});
          assert.deepEqual(values,expected,slug+' '+mode+' '+timing);
        }
        const game=stateFor(card,mode,2,timing==='end-of-opponent-turn'?'p2':'p1');
        const review=evaluateScoringCheckpoint(game,{checkpoint:timing,scoringPlayerId:'p1',activePlayerId:game.activePlayer});
        assert.equal(review.secondary.length > 0,expected!==null,slug+' '+mode+' '+timing+' review');
        if(review.secondary.length) {
          assert.equal(review.secondary[0].result.manualReviewRequired,true);
          assert.equal(review.secondary[0].result.eligible,false,'recorded evidence must not auto-score');
        }
      }
    }
  }
});

test('Defend Stronghold is not offered in battle round 1 and opens in round 2', () => {
  const card=byId.get('secondary-defend-stronghold');
  for(const round of [1,2]) {
    const game=stateFor(card,'tactical',round,'p2');
    const review=evaluateScoringCheckpoint(game,{checkpoint:'end-of-opponent-turn',scoringPlayerId:'p1',activePlayerId:'p2'});
    assert.equal(review.secondary.length,round===2?1:0);
  }
});

test('Fixed Assassination never offers standalone bonus VP and Fixed score remains active', () => {
  const card=byId.get('secondary-assassination'),game=stateFor(card,'fixed');
  const mission={category:'secondary',instanceId:'reviewed-card',definitionId:card.id,definitionName:card.name,
    result:{scoringWindows:card.scoringWindows.filter(w=>w.timing==='end-of-turn'&&w.modes.includes('fixed'))}};
  const html=renderCheckpointScore(game,{playerId:'p1',checkpoint:'end-of-turn'},mission);
  assert.match(html,/Choose agreed VP/);
  assert.match(html,/>4 VP</);
  assert.doesNotMatch(html,/<option value="1">/);
  assert.doesNotMatch(html,/remove card/);
  const scored=recordSecondaryMissionScore(game,{playerId:'p1',instanceId:'reviewed-card',amount:4,scoringTiming:'end-of-turn',retireAfterScoring:true});
  assert.equal(scored.scoring.secondaryMissions[0].status,'active','even legacy retire flag cannot retire Fixed');
  assert.throws(()=>recordSecondaryMissionScore(scored,{playerId:'p1',instanceId:'reviewed-card',amount:4,scoringTiming:'end-of-turn'}),/already been recorded/);
  const reminder=getScoringCheckpointReminder({...scored,battlefieldMap:null},{previousPhase:'fight'});
  assert.equal(reminder,null,'already-scored Fixed card does not create a receipt-only popup');
  const nextRound={...scored,turn:5,battle:{...scored.battle,round:3}};
  const again=recordSecondaryMissionScore(nextRound,{playerId:'p1',instanceId:'reviewed-card',amount:3,scoringTiming:'end-of-turn'});
  assert.equal(again.victoryPoints.p1,7);
  assert.equal(again.scoring.secondaryMissions[0].status,'active');
});

test('15 VP caps apply per battle round across both players turns, not separately by turn', () => {
  const base={battle:{round:2},turn:3,history:[],victoryPoints:{p1:0}};
  const award=(state,category,amount,turn,round,id)=>recordVictoryPointsAward(state,{
    playerId:'p1',amount,category,missionDefinitionId:id,reason:'Agreed score',
    scoringTiming:turn%2?'end-of-turn':'end-of-opponent-turn',opportunityKey:id+':'+round+':'+turn,turn,round
  });
  for(const category of ['secondary','primary']) {
    const one=award(base,category,12,3,2,'first');
    const two=award(one,category,8,4,2,'second');
    assert.equal(two.victoryPoints.p1,15,category+' combined round cap');
    assert.equal(two.history.at(-1).payload.amount,3,category+' capped second award');
    const three=award({...two,battle:{round:3},turn:5},category,5,5,3,'third');
    assert.equal(three.victoryPoints.p1,20,category+' new round resets cap');
  }
});


test('Beacon, Burden of Trust and Defend Stronghold offer end-of-fifth-round scoring when going second', () => {
  const alternatives = ['beacon','burden-of-trust','defend-stronghold'];
  for(const slug of alternatives) {
    const card = byId.get('secondary-'+slug);
    const lastPlayer = stateFor(card,'tactical',5,'p1');
    lastPlayer.battle.firstPlayerId = 'p2';
    const due=evaluateScoringCheckpoint(lastPlayer,{checkpoint:'end-of-turn',scoringPlayerId:'p1',activePlayerId:'p1'});
    assert.equal(due.secondary.length,1,slug+' final-round fallback');
    assert.equal(due.secondary[0].result.scoringWindow.timing,'end-of-turn');
    assert.match(due.secondary[0].result.scoringWindow.timingLabel,/fifth battle round/i);
    assert.equal(due.secondary[0].result.manualReviewRequired,true);
    const reminder=getScoringCheckpointReminder(lastPlayer,{previousPhase:'fight'});
    assert.equal(reminder.groups.find(group=>group.playerId==='p1').review.secondary.length,1,slug+' reminder');

    const firstPlayer=stateFor(card,'tactical',5,'p1');
    firstPlayer.battle.firstPlayerId='p1';
    const notYet=evaluateScoringCheckpoint(firstPlayer,{checkpoint:'end-of-turn',scoringPlayerId:'p1',activePlayerId:'p1'});
    assert.equal(notYet.secondary.length,0,slug+' first player waits until opponent turn');
    assert.equal(evaluateScoringCheckpoint(lastPlayer,{checkpoint:'end-of-battle',scoringPlayerId:'p1',activePlayerId:'p1'}).secondary.length,0,
      'end of fifth battle round must not be treated as uncapped end of battle');
  }
});

test('fifth-round alternative Secondary award respects remaining battle-round allowance',()=>{
  const card=byId.get('secondary-beacon');
  const game=stateFor(card,'tactical',5,'p1');
  game.battle.firstPlayerId='p2';
  const preexisting=recordVictoryPointsAward(game,{playerId:'p1',amount:13,category:'secondary',reason:'Other Secondary',
    missionDefinitionId:'other',opportunityKey:'other-r5',round:5,turn:3,scoringTiming:'end-of-turn'});
  const scored=recordSecondaryMissionScore(preexisting,{playerId:'p1',instanceId:'reviewed-card',amount:5,
    round:5,turn:3,scoringTiming:'end-of-turn'});
  assert.equal(scored.victoryPoints.p1,15);
  assert.equal(scored.history.at(-1)?.type,'victory_points.awarded');
  assert.equal(scored.history.at(-1)?.payload.amount,2);
  assert.equal(scored.scoring.secondaryMissions[0].status,'scored');
});


test('six physical Chapter Approved Secondary card faces are individually verified', () => {
  const checked = new Map([
    ['assassination','IMG_376981BB-993F-4503-9951-DE8CDC47D14F.jpeg'],
    ['bring-it-down','IMG_376981BB-993F-4503-9951-DE8CDC47D14F.jpeg'],
    ['beacon','IMG_376981BB-993F-4503-9951-DE8CDC47D14F.jpeg'],
    ['defend-stronghold','IMG_664C74BC-36BE-4F8F-AAA5-8948A805D60F.jpeg'],
    ['cleanse','IMG_664C74BC-36BE-4F8F-AAA5-8948A805D60F.jpeg'],
    ['burden-of-trust','IMG_664C74BC-36BE-4F8F-AAA5-8948A805D60F.jpeg']
  ]);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.physicalCardVerifiedCount,6);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.physicalCardVerificationDate,'2026-11-08');
  for(const [slug,card] of MATRIX.map(([id])=>[id,byId.get('secondary-'+id)])){
    const photo=checked.get(slug);
    assert.equal(card.officialCardVerified,Boolean(photo),slug);
    assert.equal(card.sourceVerification,photo?'physical-official-card-photo-2026-11-08':'user-supplied-card-transcription',slug);
    assert.equal(card.physicalCardEvidence?.photo??null,photo??null,slug);
    if(photo)assert.equal(card.physicalCardEvidence.verifiedAt,'2026-11-08');
  }
});

test('physical Bring It Down awards Fixed 4 VP per model, not a 5 VP cap',()=>{
  const card=byId.get('secondary-bring-it-down');
  for(const timing of ['end-of-turn','end-of-opponent-turn']) {
    const fixed=card.scoringWindows.filter(w=>w.timing===timing&&w.modes.includes('fixed'));
    assert.equal(fixed[0].tiers[0].maxVP,undefined,'5 VP maximum is Tactical only');
    assert.deepEqual(getMissionVpOptions({category:'secondary',instanceId:'x',result:{scoringWindows:fixed}}),[4,8,12]);
    const tactical=card.scoringWindows.filter(w=>w.timing===timing&&w.modes.includes('tactical'));
    assert.deepEqual(getMissionVpOptions({category:'secondary',instanceId:'x',result:{scoringWindows:tactical}}),[5]);
  }
  const game=stateFor(card,'fixed');
  const mission={category:'secondary',instanceId:'reviewed-card',definitionId:card.id,definitionName:card.name,
    result:{scoringWindows:card.scoringWindows.filter(w=>w.timing==='end-of-turn'&&w.modes.includes('fixed'))}};
  const html=renderCheckpointScore(game,{playerId:'p1',checkpoint:'end-of-turn'},mission);
  assert.match(html,/value="8"/);
  assert.doesNotMatch(html,/value="5"/);
  const scored=recordSecondaryMissionScore(game,{playerId:'p1',instanceId:'reviewed-card',amount:8,scoringTiming:'end-of-turn'});
  assert.equal(scored.victoryPoints.p1,8);
  assert.equal(scored.scoring.secondaryMissions[0].status,'active');
});
