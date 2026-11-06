import test from 'node:test';
import assert from 'node:assert/strict';
import { liveMapObjectiveLabel, perspectiveObjectiveName } from '../../src/rules/objective-display-labels.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { getBattlePrimaryMissions, getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';

const DISPOSITIONS = [
  'Take and Hold',
  'Disruption',
  'Purge the Foe',
  'Priority Assets',
  'Reconnaissance'
];

const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const boardCenter = { x: 30, y: 22 };

test('objective display roles follow verified battlefield geometry across every disposition/layout', () => {
  for (const myDisposition of DISPOSITIONS) {
    for (const opponentDisposition of DISPOSITIONS) {
      const missions = getBattlePrimaryMissions(myDisposition, opponentDisposition);
      assert.ok(missions, `${myDisposition} vs ${opponentDisposition} must resolve missions`);

      for (const layout of ['A', 'B', 'C']) {
        const geometry = getEventCompanionMapLayout(missions.myMission, missions.opponentMission, layout);
        assert.ok(geometry, `${missions.myMission} / ${missions.opponentMission} ${layout} must resolve geometry`);

        const state = {
          preGameSetup: { attackerPlayerId: 'p1', defenderPlayerId: 'p2' },
          battlefieldMap: { missionSetup: { myDisposition, opponentDisposition, layout } },
          objectives: Object.entries(geometry.objectivePositions).map(([name, position]) => ({
            id: `event-companion:${name}`,
            layoutObjective: name,
            position: { ...position }
          }))
        };

        assert.equal(liveMapObjectiveLabel(state, 'event-companion:Attacker Home', 'p1'), 'mH');
        assert.equal(liveMapObjectiveLabel(state, 'event-companion:Defender Home', 'p1'), 'oH');
        assert.equal(liveMapObjectiveLabel(state, 'event-companion:Attacker Home', 'p2'), 'oH');
        assert.equal(liveMapObjectiveLabel(state, 'event-companion:Defender Home', 'p2'), 'mH');

        const nonHome = Object.entries(geometry.objectivePositions).filter(([name]) => !/home/i.test(name));
        assert.ok(nonHome.length >= 2 && nonHome.length <= 4, 'verified layouts have one or two center objectives and one or two expansions');
        const centerCount = Math.max(1, nonHome.length - 2);
        const expectedCenterNames = new Set([...nonHome]
          .sort((a, b) => distanceSquared(a[1], boardCenter) - distanceSquared(b[1], boardCenter))
          .slice(0, centerCount)
          .map(([name]) => name));

        const centerLabels = [];
        const expansionLabelsP1 = [];
        const expansionLabelsP2 = [];
        for (const [name] of nonHome) {
          const labelP1 = liveMapObjectiveLabel(state, `event-companion:${name}`, 'p1');
          const labelP2 = liveMapObjectiveLabel(state, `event-companion:${name}`, 'p2');
          if (expectedCenterNames.has(name)) {
            centerLabels.push(labelP1);
            assert.equal(labelP2, labelP1, 'center numbering must not change with player perspective');
          } else {
            expansionLabelsP1.push(labelP1);
            expansionLabelsP2.push(labelP2);
          }
        }

        assert.deepEqual([...new Set(centerLabels)].sort(), Array.from({ length: centerCount }, (_, index) => `C${index + 1}`));
        const expectedExpansionLabels = ['mE', 'oE'];
        if (nonHome.length === 2) {
          assert.deepEqual([expansionLabelsP1[0], expansionLabelsP2[0]].sort(), expectedExpansionLabels);
        } else {
          assert.deepEqual(expansionLabelsP1.sort(), expectedExpansionLabels);
          assert.deepEqual(expansionLabelsP2.sort(), expectedExpansionLabels);
        }
      }
    }
  }
});


test('page 22 Layout B planning labels match six distinct terrain-grounded objectives before attacker selection',()=>{
  const missionSetup={myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout:'B'};
  const {myMission,opponentMission}=getBattlePrimaryMissions(missionSetup.myDisposition,missionSetup.opponentDisposition);
  const geometry=getEventCompanionMapLayout(myMission,opponentMission,'B');
  assert.equal(geometry.page,22);
  assert.equal(Object.keys(geometry.terrainGeometry).length,16);
  assert.equal(Object.keys(geometry.objectivePositions).length,6);
  const state={
    battlefieldMap:{missionSetup},
    preGameSetup:{},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    objectives:[],units:[]
  };
  // Source IDs are not their visual roles. The PDF-aligned vertical reflection
  // keeps both true central markers and numbers expansions from left to right.
  const expected={
    'Defender Home':'Defender Home',
    'Attacker Home':'Attacker Home',
    'Central 1':'Center 1',
    'Expansion 2':'Center 2',
    'Expansion 1':'Expansion 1',
    'Central 2':'Expansion 2'
  };
  for(const [name,label] of Object.entries(expected)){
    assert.equal(perspectiveObjectiveName(name,state,'p1'),label,name);
  }
  assert.equal(new Set(Object.values(expected)).size,6);

  const planning=renderBattlefieldMap(state,{mode:'planning',perspectivePlayerId:'p1',showUnits:false});
  const markers=[...planning.matchAll(/<button\b[^>]*data-layout-objective="([^"]+)"[^>]*>([^<]*)<\/button>/g)]
    .map(match=>({sourceId:match[1],label:match[2]}));
  assert.equal(markers.length,6);
  assert.equal(new Set(markers.map(item=>item.label)).size,6,'do not draw two Center 2 markers');
  for(const item of markers)assert.equal(item.label,expected[item.sourceId]);
  assert.equal((planning.match(/data-terrain="T\d+"/g)??[]).length,16,
    'label fix must not remove or redraw any of the verified terrain footprints');
  assert.match(planning,/data-zone="attackerDeployment"/);
  assert.match(planning,/data-zone="defenderDeployment"/);
});

test('page 22 objective labels switch to player-owned expansion names after assigning attacker and defender',()=>{
  const missionSetup={myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout:'B'};
  const state={battlefieldMap:{missionSetup},
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'}};
  const labels=Object.keys(getEventCompanionMapLayout('Inescapable Dominion','Secure Asset','B').objectivePositions);
  const playerOne=labels.map(name=>perspectiveObjectiveName(name,state,'p1'));
  const playerTwo=labels.map(name=>perspectiveObjectiveName(name,state,'p2'));
  assert.deepEqual(playerOne.slice().sort(),[
    'My Home','Opponent Home','Center 1','Center 2','My Expansion','Opponent Expansion'
  ].sort());
  assert.deepEqual(playerTwo.slice().sort(),playerOne.slice().sort());
  assert.equal(perspectiveObjectiveName('Central 2',state,'p1'),'Opponent Expansion');
  assert.equal(perspectiveObjectiveName('Expansion 1',state,'p1'),'My Expansion');
  assert.equal(perspectiveObjectiveName('Central 2',state,'p2'),'My Expansion');
  assert.equal(perspectiveObjectiveName('Expansion 1',state,'p2'),'Opponent Expansion');
});

test('all Event Companion maps have distinct planning objective labels before player roles are assigned',()=>{
  for(const myDisposition of DISPOSITIONS)for(const opponentDisposition of DISPOSITIONS)for(const layout of ['A','B','C']){
    const missions=getBattlePrimaryMissions(myDisposition,opponentDisposition);
    const geometry=getEventCompanionMapLayout(missions.myMission,missions.opponentMission,layout);
    const state={battlefieldMap:{missionSetup:{myDisposition,opponentDisposition,layout}},preGameSetup:{}};
    const names=Object.keys(geometry.objectivePositions);
    const labels=names.map(name=>perspectiveObjectiveName(name,state,'p1'));
    assert.equal(new Set(labels).size,labels.length,`page ${geometry.page}: ${labels.join(', ')}`);
  }
});
