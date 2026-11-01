import test from 'node:test';
import assert from 'node:assert/strict';
import { liveMapObjectiveLabel } from '../../src/rules/objective-display-labels.js';
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
