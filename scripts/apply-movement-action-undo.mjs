import fs from 'node:fs';

function replace(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(label + ': source not found');
  text = text.replace(before, after);
  fs.writeFileSync(path, text);
}

replace('src/commands/game-commands.js',
`  RECORD_STATIONARY: "unit.record_stationary",\n  RECORD_FALL_BACK: "unit.record_fall_back",`,
`  RECORD_STATIONARY: "unit.record_stationary",\n  RECORD_FALL_BACK: "unit.record_fall_back",\n  UNDO_MOVEMENT_ACTION: "unit.undo_movement_action",`,
'add movement undo command');

replace('src/engine/register-core-commands.js',
`import { resolveNormalMove, resolveAdvance, recordFallBack, recordStationary } from "./movement-transitions.js";`,
`import { resolveNormalMove, resolveAdvance, recordFallBack, recordStationary, undoMovementAction } from "./movement-transitions.js";`,
'import movement undo');

replace('src/engine/register-core-commands.js',
`    [COMMAND_TYPES.RECORD_STATIONARY, (state, command) => recordStationary(state, command.payload)],\n    [COMMAND_TYPES.RECORD_CHARGE_OUTCOME,`,
`    [COMMAND_TYPES.RECORD_STATIONARY, (state, command) => recordStationary(state, command.payload)],\n    [COMMAND_TYPES.UNDO_MOVEMENT_ACTION, (state, command) => undoMovementAction(state, command.payload)],\n    [COMMAND_TYPES.RECORD_CHARGE_OUTCOME,`,
'register movement undo');

fs.appendFileSync('src/engine/movement-transitions.js', `\nconst MOVEMENT_ACTION_EVENT_TYPES = new Set([\n  "unit.normal_move_resolved", "unit.fell_back", "unit.advanced", "unit.stationary_recorded"\n]);\n\n/** Undo the selected unit's current-turn Movement action.\n * Normal Move and Advance restore the positions recorded before the action.\n * Fall Back and Stationary only remove their gameplay fact.\n */\nexport function undoMovementAction(state, { unitId } = {}) {\n  if (!unitId) throw new TypeError("Unit id is required.");\n  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");\n  if (state.phase !== "movement") throw new Error("Movement actions may only be undone in the Movement phase.");\n  const unit = state.units.find((item) => item.id === unitId);\n  if (!unit) throw new Error("Unit not found: " + unitId);\n  if (unit.ownerId !== state.activePlayer) throw new Error("Only the active player's movement action may be undone.");\n\n  const history = Array.isArray(state.history) ? state.history : [];\n  let eventIndex = -1;\n  for (let index = history.length - 1; index >= 0; index -= 1) {\n    const event = history[index];\n    if (MOVEMENT_ACTION_EVENT_TYPES.has(event?.type) && event.payload?.unitId === unitId && event.payload?.turn === state.turn) {\n      eventIndex = index;\n      break;\n    }\n  }\n  if (eventIndex < 0) throw new Error("This unit has no movement action to undo this turn.");\n\n  const event = history[eventIndex];\n  let nextUnit = unit;\n  if (["unit.normal_move_resolved", "unit.advanced"].includes(event.type)) {\n    const records = Array.isArray(event.payload?.moves) ? event.payload.moves : [];\n    if (!records.length || records.some((record) => !record?.modelId || !positionIsValid(record.from))) {\n      throw new Error("The original movement positions are unavailable for this action.");\n    }\n    const originals = new Map(records.map((record) => [record.modelId, { ...record.from }]));\n    if (Array.isArray(unit.models) && unit.models.length > 0) {\n      nextUnit = {\n        ...unit,\n        models: unit.models.map((model) => {\n          const position = originals.get(model.id);\n          if (!position) throw new Error("The original movement position is unavailable for model " + model.id + ".");\n          return { ...model, position };\n        })\n      };\n    } else {\n      const position = originals.get(unit.id) ?? records[0]?.from;\n      if (!positionIsValid(position)) throw new Error("The original movement position is unavailable.");\n      nextUnit = { ...unit, position: { ...position } };\n    }\n  }\n\n  return {\n    ...state,\n    units: state.units.map((item) => item.id === unitId ? nextUnit : item),\n    history: history.filter((_, index) => index !== eventIndex)\n  };\n}\n`);

replace('src/ui/movement-screen.js',
`  let livePointerDrag = null;\n  const movementStartPositions = new Map();`,
`  let livePointerDrag = null;`,
'remove local position snapshots');

replace('src/ui/movement-screen.js',
`    const eligible = state.units.filter((unit) => unit.ownerId === playerId && unit.status === "deployed");\n    for (const unit of eligible) {\n      if (!movementStartPositions.has(unit.id)) movementStartPositions.set(unit.id, movesAtCurrentPositions(unit));\n    }\n    if (!eligible.some((unit) => unit.id === selectedUnitId)) selectedUnitId = eligible[0]?.id ?? null;`,
`    const eligible = state.units.filter((unit) => unit.ownerId === playerId && unit.status === "deployed");\n    if (!eligible.some((unit) => unit.id === selectedUnitId)) selectedUnitId = eligible[0]?.id ?? null;`,
'remove snapshot capture');

replace('src/ui/movement-screen.js',
`             <div class="move-actions"><button type="button" data-reset-position>Undo / Reset Position</button></div>`,
`             <div class="move-actions"><button type="button" data-reset-position>Undo Movement / Reset Position</button></div>`,
'clarify undo label');

replace('src/ui/movement-screen.js',
`      if (button.hasAttribute("data-reset-position")) {\n        const resetMoves = movementStartPositions.get(unit.id);\n        if (!Array.isArray(resetMoves) || !resetMoves.length) throw new Error("No earlier position is available for this unit.");\n        session.dispatch({ type: COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION, payload: { unitId: unit.id, playerId: unit.ownerId, moves: resetMoves.map((move) => ({ modelId: move.modelId, position: { ...move.position } })) } });\n      } else if (button.hasAttribute("data-move-save")) {`,
`      if (button.hasAttribute("data-reset-position")) {\n        session.dispatch({ type: COMMAND_TYPES.UNDO_MOVEMENT_ACTION, payload: { unitId: unit.id } });\n      } else if (button.hasAttribute("data-move-save")) {`,
'use authoritative movement undo');

fs.writeFileSync('tests/engine/movement-action-undo.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { resolveNormalMove, resolveAdvance, recordStationary, undoMovementAction } from '../../src/engine/movement-transitions.js';\n\nfunction state() {\n  return {\n    battle: { status: 'active', round: 1 }, phase: 'movement', turn: 1, activePlayer: 'p1',\n    players: [{id:'p1'},{id:'p2'}], history: [],\n    units: [{ id:'u1', ownerId:'p1', status:'deployed', position:{x:10,y:10}, movement:6 }]\n  };\n}\n\ntest('undo Normal Move restores the pre-move position and permits Did Not Move', () => {\n  const moved = resolveNormalMove(state(), { unitId:'u1', moves:[{modelId:'u1',position:{x:14,y:10}}] });\n  assert.deepEqual(moved.units[0].position,{x:14,y:10});\n  assert.equal(moved.history.at(-1).type,'unit.normal_move_resolved');\n  const undone = undoMovementAction(moved,{unitId:'u1'});\n  assert.deepEqual(undone.units[0].position,{x:10,y:10});\n  assert.equal(undone.history.some(event=>event.type==='unit.normal_move_resolved'),false);\n  const stationary = recordStationary(undone,{unitId:'u1'});\n  assert.equal(stationary.history.at(-1).type,'unit.stationary_recorded');\n});\n\ntest('undo Advance restores the pre-advance position', () => {\n  const advanced = resolveAdvance(state(), { unitId:'u1', advanceRoll:4, moves:[{modelId:'u1',position:{x:16,y:10}}] });\n  const undone = undoMovementAction(advanced,{unitId:'u1'});\n  assert.deepEqual(undone.units[0].position,{x:10,y:10});\n  assert.equal(undone.history.some(event=>event.type==='unit.advanced'),false);\n});\n`);
