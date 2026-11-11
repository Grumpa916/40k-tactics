import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventCompanionMapForForceDispositions } from '../../src/rules/event-companion-map-catalog.js';
import { getSmokeAndMirrorsObjectiveOptions } from '../../src/rules/smoke-and-mirrors-state.js';
import { objectiveMapDisplayName, perspectiveObjectiveName } from '../../src/rules/objective-display-labels.js';
import { createMissionActionPicker } from '../../src/ui/mission-action-picker.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { readFileSync } from 'node:fs';

function stateFor(layout) {
  const geometry = getEventCompanionMapForForceDispositions('Disruption','Reconnaissance',layout);
  assert.ok(geometry, 'Event Companion Smoke and Mirrors layout '+layout+' exists');
  return {
    phase: 'shooting', turn: 1, activePlayer: 'p1',
    battle: { id:'b', status:'active', round:1, activePlayerId:'p1', firstPlayerId:'p1' },
    preGameSetup:{ attackerPlayerId:'p1', defenderPlayerId:'p2' },
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Reconnaissance',layout}},
    objectives:Object.entries(geometry.objectivePositions).map(([name,position])=>({
      id:'event-companion:'+name,name,layoutObjective:name,position:{...position}
    })),
    units:[{id:'runner',ownerId:'p1',name:'Scout',status:'deployed',position:{x:25,y:20}}],
    history:[],
    scoring:{turnSnapshots:[],secondaryMissions:[],secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'}}
  };
}

function markerLabels(state,perspectivePlayerId) {
  const html=renderBattlefieldMap(state,{mode:'live',perspectivePlayerId,plannerStyleObjectives:true});
  return new Map([...html.matchAll(/<button\\b[^>]*data-layout-objective="([^"]+)"[^>]*>([^<]*)<\\/button>/g)]
    .map(([,id,label])=>[id,label]));
}

test('Smoke and Mirrors dropdown uses precisely the visible map objective names for all layouts and both viewer perspectives',()=>{
  for(const layout of ['A','B','C']) {
    const state=stateFor(layout);
    const options=getSmokeAndMirrorsObjectiveOptions(state,{playerId:'p1'});
    assert.ok(options.length>=3,layout+' offers non-home objectives');
    for(const perspective of ['p1','p2']) {
      const markers=markerLabels(state,perspective);
      assert.ok(markers.size>=4,layout+' has visible objectives');
      const html=createMissionActionPicker({mapPerspectivePlayerId:perspective}).render(state,'runner');
      assert.match(html,/Objective to Decoy/);
      for(const item of options) {
        const canonical=state.objectives.find(obj=>obj.id===item.objectiveId)?.layoutObjective;
        assert.ok(canonical,'stable Event Companion objective ID');
        const displayed=markers.get(canonical);
        assert.ok(displayed,layout+' '+canonical+' appears on the map');
        assert.equal(objectiveMapDisplayName(state,item.objectiveId,perspective),displayed);
        const optionHtml=[...html.matchAll(/<option\\b[^>]*value="([^"]+)"[^>]*>([^<]*)<\\/option>/g)]
          .find(([,id])=>id===item.objectiveId)?.[2];
        assert.ok(optionHtml,layout+' '+item.objectiveId+' is a selectable mission option');
        assert.equal(optionHtml,
          displayed+' · '+(item.enemyTerritory?'enemy territory · ':'')+item.recurringVpIfDecoyed+' VP/turn',
          layout+' '+canonical+' text matches the map and retains VP/territory detail');
      }
      assert.equal(new Set([...markers.values()]).size,markers.size,
        layout+' map objective names remain unique');
    }
  }
});

test('geometry-derived labels follow map semantics rather than assuming canonical Central and Expansion labels',()=>{
  const state=stateFor('B');
  for(const objective of state.objectives) {
    const id=objective.id;
    assert.equal(objectiveMapDisplayName(state,id,'p1'),
      perspectiveObjectiveName(objective.layoutObjective,state,'p1'));
  }
  assert.equal(objectiveMapDisplayName(state,'event-companion:Attacker Home','p1'),'My Home');
  assert.equal(objectiveMapDisplayName(state,'event-companion:Defender Home','p1'),'Opponent Home');
  assert.equal(objectiveMapDisplayName(state,'event-companion:Defender Home','p2'),'My Home');
});

test('the Shooting picker uses the same map perspective, without changing target IDs or mission scoring',()=>{
  const source=readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
  assert.match(source,/createMissionActionPicker\\(\\{ mapPerspectivePlayerId: perspectivePlayerId \\}\\)/);
  const state=stateFor('A');
  const options=getSmokeAndMirrorsObjectiveOptions(state,{playerId:'p1'});
  const primaryIds=options.map(item=>item.objectiveId);
  const html=createMissionActionPicker({mapPerspectivePlayerId:'p1'}).render(state,'runner');
  for(const id of primaryIds)assert.ok(html.includes('value="'+id+'"'),'saved source IDs unchanged');
  const mine=state.objectives.find(item=>item.layoutObjective==='Attacker Home');
  assert.ok(!primaryIds.includes(mine.id),'acting player home remains ineligible');
  assert.ok(!html.includes('value="'+mine.id+'"'),'home remains excluded from mission picker');
});
