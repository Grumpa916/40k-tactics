import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import {
  getTerritoryRegionsFromGeometry,
  getBattlefieldTerritoryContext,
  getTerritoryStatusForPosition,
  BATTLEFIELD_TERRITORY_MAP_UNCERTAINTY
} from '../../src/rules/battlefield-territory.js';

test('official Event Companion geometry yields vertical and horizontal territory dividers', () => {
  const vertical = EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) =>
    layout.deploymentZones?.attackerTerritory?.height === 44 &&
    layout.deploymentZones?.attackerTerritory?.width === 30
  );
  const horizontal = EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) =>
    layout.deploymentZones?.attackerTerritory?.width === 60 &&
    layout.deploymentZones?.attackerTerritory?.height === 22
  );

  assert.ok(vertical, 'expected at least one left/right territory layout');
  assert.ok(horizontal, 'expected at least one top/bottom territory layout');

  const verticalRegions = getTerritoryRegionsFromGeometry(vertical);
  const horizontalRegions = getTerritoryRegionsFromGeometry(horizontal);
  assert.equal(verticalRegions.divider.orientation, 'vertical');
  assert.equal(verticalRegions.divider.coordinate, 30);
  assert.equal(horizontalRegions.divider.orientation, 'horizontal');
  assert.equal(horizontalRegions.divider.coordinate, 22);
});

test('territory status uses player perspective and the established approximate-map uncertainty band', () => {
  const state = {
    battlefieldMap: {
      missionSetup: {
        myDisposition: 'Take and Hold',
        opponentDisposition: 'Take and Hold',
        layout: 'A'
      }
    },
    preGameSetup: {
      attackerPlayerId: 'p1',
      defenderPlayerId: 'p2'
    }
  };

  const context = getBattlefieldTerritoryContext(state, { playerId: 'p1' });
  assert.ok(context);
  assert.equal(context.perspectiveRole, 'attacker');
  assert.deepEqual(context.myTerritory, context.attacker);
  assert.deepEqual(context.opponentTerritory, context.defender);

  assert.equal(getTerritoryStatusForPosition(state, { playerId: 'p1', position: { x: 45, y: 22 } }).territory, 'mine');
  assert.equal(getTerritoryStatusForPosition(state, { playerId: 'p1', position: { x: 15, y: 22 } }).territory, 'opponent');
  assert.equal(getTerritoryStatusForPosition(state, { playerId: 'p1', position: { x: 30, y: 22 } }).territory, 'boundary');
  assert.equal(BATTLEFIELD_TERRITORY_MAP_UNCERTAINTY, 3);
});
