import { readFileSync, writeFileSync } from 'node:fs';

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
  if (source.includes('ARMY_UNIT_CATALOG') && source.includes('datasheetId')) return source;

  const oldBlock = `// Saved battle roster data can fill missing live profiles, including older saves.\nexport function getBattleUnitDatasheet(state, unit) {\n  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);\n  return rosterUnit?.datasheet ?? null;\n}\n`;

  if (!source.includes(oldBlock)) {
    throw new Error('Refusing update: battle-unit-reference.js no longer matches the expected resolver block.');
  }

  const newBlock = `import { ARMY_UNIT_CATALOG } from "../data/army-unit-catalog.js";\n\n// Saved battle roster data can fill missing live profiles, including older saves.\n// Older in-progress battles can lack the embedded roster snapshot, so fall back to\n// the reviewed unit catalog using the battle unit's stable datasheet ID or name.\nexport function getBattleUnitDatasheet(state, unit) {\n  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);\n  if (rosterUnit?.datasheet) return rosterUnit.datasheet;\n\n  const datasheetId = unit?.metadata?.datasheetId;\n  if (datasheetId) {\n    const catalogUnit = ARMY_UNIT_CATALOG.find(item => item?.id === datasheetId);\n    if (catalogUnit?.datasheet) return catalogUnit.datasheet;\n  }\n\n  const unitName = String(unit?.name ?? "").trim().toLowerCase();\n  if (!unitName) return null;\n  const rosterFaction = String(state?.armyRosters?.[unit?.ownerId]?.faction ?? "").trim().toLowerCase();\n  const catalogUnit = ARMY_UNIT_CATALOG.find(item =>\n    String(item?.name ?? "").trim().toLowerCase() === unitName &&\n    (!rosterFaction || String(item?.faction ?? "").trim().toLowerCase() === rosterFaction)\n  );\n  return catalogUnit?.datasheet ?? null;\n}\n`;

  return source.replace(oldBlock, newBlock);
});

updateFile('tests/ui/shooting-skip-and-opponent-movement.test.js', (source) => {
  const marker = "Fight melee weapons fall back to the reviewed catalog when an older battle lacks a roster snapshot";
  if (source.includes(marker)) return source;
  if (!source.includes("saved-roster melee weapons populate Fight weapon choices")) {
    throw new Error('Refusing update: expected Fight weapon regression tests are missing.');
  }

  return source + `\n\ntest('Fight melee weapons fall back to the reviewed catalog when an older battle lacks a roster snapshot', () => {\n  const initial = state('fight');\n  initial.units[0] = {\n    ...initial.units[0],\n    name: 'Neurotyrant',\n    profile: null,\n    metadata: { datasheetId: 'tyranids:neurotyrant' }\n  };\n  initial.armyRosters = {};\n  const options = getFightWeaponOptions(initial, { attackerId: 'friendly', gameData: { weapons: [] } });\n  assert.ok(options.length > 0);\n  assert.ok(options.some(option => option.name === 'Neurotyrant claws and lashes'));\n  assert.ok(options.every(option => option.type === 'melee'));\n});\n\ntest('Fight melee weapons can recover by unit name when legacy battle metadata lacks datasheetId', () => {\n  const initial = state('fight');\n  initial.units[0] = { ...initial.units[0], name: 'Gargoyles', profile: null, metadata: {} };\n  initial.armyRosters = {};\n  const options = getFightWeaponOptions(initial, { attackerId: 'friendly', gameData: { weapons: [] } });\n  assert.ok(options.some(option => option.name === 'Blinding venom'));\n});\n`;
});

console.log('Legacy/live-battle Fight melee weapon fallback update applied.');
