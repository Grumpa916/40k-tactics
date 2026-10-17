import { existsSync, readFileSync, writeFileSync } from 'node:fs';

function updateFile(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`Updated ${path}`);
  } else {
    console.log(`No change needed for ${path}`);
  }
}

updateFile('src/rules/battle-unit-reference.js', (source) => {
  if (source.includes('ARMY_UNIT_CATALOG') && source.includes('catalogUnit?.datasheet')) return source;

  const oldBlock = `// Saved battle roster data can fill missing live profiles, including older saves.\nexport function getBattleUnitDatasheet(state, unit) {\n  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);\n  return rosterUnit?.datasheet ?? null;\n}\n`;

  if (!source.includes(oldBlock)) {
    throw new Error('Refusing update: battle-unit-reference.js no longer matches the expected resolver block.');
  }

  const newBlock = `import { ARMY_UNIT_CATALOG } from "../data/army-unit-catalog.js";\n\n// Saved battle roster data can fill missing live profiles, including older saves.\n// Older in-progress battles can lack the embedded roster snapshot, so fall back to\n// the reviewed unit catalog using the battle unit's stable datasheet ID or name.\nexport function getBattleUnitDatasheet(state, unit) {\n  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);\n  if (rosterUnit?.datasheet) return rosterUnit.datasheet;\n\n  const datasheetId = unit?.metadata?.datasheetId;\n  if (datasheetId) {\n    const catalogUnit = ARMY_UNIT_CATALOG.find(item => item?.id === datasheetId);\n    if (catalogUnit?.datasheet) return catalogUnit.datasheet;\n  }\n\n  const unitName = String(unit?.name ?? "").trim().toLowerCase();\n  if (!unitName) return null;\n  const rosterFaction = String(state?.armyRosters?.[unit?.ownerId]?.faction ?? "").trim().toLowerCase();\n  const catalogUnit = ARMY_UNIT_CATALOG.find(item =>\n    String(item?.name ?? "").trim().toLowerCase() === unitName &&\n    (!rosterFaction || String(item?.faction ?? "").trim().toLowerCase() === rosterFaction)\n  );\n  return catalogUnit?.datasheet ?? null;\n}\n`;

  return source.replace(oldBlock, newBlock);
});

const testPath = 'tests/ui/fight-melee-catalog-fallback.test.js';
if (!existsSync(testPath)) {
  writeFileSync(testPath, `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { createGameState } from '../../src/state/game-state.js';\nimport { getFightWeaponOptions } from '../../src/application/fight-workflow.js';\n\nfunction legacyFightState(unit) {\n  return createGameState({\n    phase: 'fight',\n    turn: 1,\n    activePlayer: 'p1',\n    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],\n    battle: { id: 'b', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p1' },\n    armyRosters: {},\n    units: [\n      { id: 'friendly', ownerId: 'p1', status: 'deployed', profile: null, ...unit },\n      { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed', profile: null }\n    ]\n  });\n}\n\ntest('Fight melee weapons fall back to catalog by datasheetId for older battles', () => {\n  const state = legacyFightState({ name: 'Neurotyrant', metadata: { datasheetId: 'tyranids:neurotyrant' } });\n  const options = getFightWeaponOptions(state, { attackerId: 'friendly', gameData: { weapons: [] } });\n  assert.ok(options.some(option => option.name === 'Neurotyrant claws and lashes'));\n  assert.ok(options.every(option => option.type === 'melee'));\n});\n\ntest('Fight melee weapons fall back to catalog by unit name when datasheetId is missing', () => {\n  const state = legacyFightState({ name: 'Gargoyles', metadata: {} });\n  const options = getFightWeaponOptions(state, { attackerId: 'friendly', gameData: { weapons: [] } });\n  assert.ok(options.some(option => option.name === 'Blinding venom'));\n});\n`);
  console.log(`Added ${testPath}`);
} else {
  console.log(`No change needed for ${testPath}`);
}

console.log('Legacy/live-battle Fight melee weapon fallback update applied.');
