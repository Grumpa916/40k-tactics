import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

const source = `Faction: Space Marines\nDetachment: Gravis Siege Force\nBattle Size: Onslaught (3000 pts)\nTotal: 9195 / 3000 pts\n\nEPIC HERO\nAdrax Agatone (90 pts)\n   · Drakkis, Malleus Noctum\n\nBATTLELINE\nAssault Intercessor Squad ×5 (85 pts)\n   · 5× Heavy Bolt Pistol, 5× Chainsword\n\nVEHICLE\nLand Raider (245 pts)\n   · 2× Godhammer Lascannon`;

test('Space Marines catalog imports trailing quantity notation and points', () => {
  assert.ok(findArmyUnitCandidates({ faction: 'Space Marines' }).length >= 70);
  const result = importWarhammerAppRoster({ text: source, faction: 'Space Marines', name: 'Marine test', pointsLimit: 3000, id: 'marines' });
  assert.equal(result.roster.units.length, 3);
  assert.equal(result.roster.units[1].modelCount, 5);
  assert.equal(result.roster.units[1].points, 85);
  assert.equal(result.roster.units[2].points, 245);
  assert.match(result.roster.notes, /Drakkis, Malleus Noctum/);
});
