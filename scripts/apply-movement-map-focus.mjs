import fs from 'node:fs';

function replace(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(label + ': source not found');
  text = text.replace(before, after);
  fs.writeFileSync(path, text);
}

replace('src/ui/phase-progression-panel.js',
`    '<button type="button" ' + (viewingOther ? 'data-return-current-phase' : 'data-advance-game-phase') + '>' + escapeHtml(viewingOther ? 'Return to current phase · ' + current : action.label) + '</button>' +\n    (['movement','end_turn'].includes(state.phase) ? '<button type="button" data-open-scoring-checkpoint>Scoring check</button>' : '') +\n    (message ? '<p role="status">' + escapeHtml(message) + '</p>' : '') + '</section>';`,
`    '<button type="button" ' + (viewingOther ? 'data-return-current-phase' : 'data-advance-game-phase') + '>' + escapeHtml(viewingOther ? 'Return to current phase · ' + current : action.label) + '</button>' +\n    (message ? '<p role="status">' + escapeHtml(message) + '</p>' : '') + '</section>';`,
'remove scoring check button');

replace('src/ui/movement-screen.js',
`  let advanceRoll = 1;\n  let livePointerDrag = null;`,
`  let advanceRoll = 1;\n  let livePointerDrag = null;\n  const movementStartPositions = new Map();`,
'add position snapshots');

replace('src/ui/movement-screen.js',
`    const eligible = state.units.filter((unit) => unit.ownerId === playerId && unit.status === "deployed");\n    if (!eligible.some((unit) => unit.id === selectedUnitId)) selectedUnitId = eligible[0]?.id ?? null;`,
`    const eligible = state.units.filter((unit) => unit.ownerId === playerId && unit.status === "deployed");\n    for (const unit of eligible) {\n      if (!movementStartPositions.has(unit.id)) movementStartPositions.set(unit.id, movesAtCurrentPositions(unit));\n    }\n    if (!eligible.some((unit) => unit.id === selectedUnitId)) selectedUnitId = eligible[0]?.id ?? null;`,
'capture movement start positions');

replace('src/ui/movement-screen.js',
`        \${action\n          ? \`<p><strong>\${escapeHtml(MOVEMENT_LABELS[action.type] ?? "Movement recorded")}</strong>. Drag this unit on the map as often as needed to refine its approximate position.</p>\`\n          : \`<p>Record the tabletop movement choice. Position is handled only by dragging the map marker; no X/Y coordinate entry is required.</p>\n             <div class="move-actions">\n               <button type="button" data-move-save>Record Normal Move</button>\n               <div class="advance-choice">\n                 <span>Advance roll</span>\n                 <div class="advance-roll-buttons">\${[1,2,3,4,5,6].map((value) => \`<button type="button" data-advance-roll="\${value}" class="\${value === advanceRoll ? "is-selected" : ""}">\${value}</button>\`).join("")}</div>\n                 <button type="button" data-move-advance>Record Advance</button>\n               </div>\n               <button type="button" data-move-fallback>Record Fall Back</button>\n               <button type="button" data-move-stationary>Remain Stationary</button>\n             </div>\`}\n      </div>\`;`,
`        \${action\n          ? \`<p><strong>\${escapeHtml(MOVEMENT_LABELS[action.type] ?? "Movement recorded")}</strong>. Drag this unit on the map as often as needed to refine its approximate position.</p>\n             <div class="move-actions"><button type="button" data-reset-position>Undo / Reset Position</button></div>\`\n          : \`<p>Record the tabletop movement choice. Position is handled only by dragging the map marker; no X/Y coordinate entry is required.</p>\n             <div class="move-actions">\n               <button type="button" data-move-save>Record Normal Move</button>\n               <div class="advance-choice">\n                 <span>Advance roll</span>\n                 <div class="advance-roll-buttons">\${[1,2,3,4,5,6].map((value) => \`<button type="button" data-advance-roll="\${value}" class="\${value === advanceRoll ? "is-selected" : ""}">\${value}</button>\`).join("")}</div>\n                 <button type="button" data-move-advance>Record Advance</button>\n               </div>\n               <button type="button" data-move-fallback>Record Fall Back</button>\n               <button type="button" data-move-stationary>Did Not Move · Heavy</button>\n             </div>\`}\n      </div>\`;`,
'add reset and heavy wording');

replace('src/ui/movement-screen.js',
`      if (button.hasAttribute("data-move-save")) {\n        session.dispatch({ type: COMMAND_TYPES.RESOLVE_NORMAL_MOVE, payload: { unitId: unit.id, moves } });`,
`      if (button.hasAttribute("data-reset-position")) {\n        const resetMoves = movementStartPositions.get(unit.id);\n        if (!Array.isArray(resetMoves) || !resetMoves.length) throw new Error("No earlier position is available for this unit.");\n        session.dispatch({ type: COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION, payload: { unitId: unit.id, playerId: unit.ownerId, moves: resetMoves.map((move) => ({ modelId: move.modelId, position: { ...move.position } })) } });\n      } else if (button.hasAttribute("data-move-save")) {\n        session.dispatch({ type: COMMAND_TYPES.RESOLVE_NORMAL_MOVE, payload: { unitId: unit.id, moves } });`,
'handle reset position');

fs.appendFileSync('src/ui/styles/prototype-workspace.css', `\n/* Movement focus: maximize the battlefield while retaining Battle view and side-panel controls. */\n.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=movement] .live-map > nav { display:none; }\n@media (orientation:landscape) and (min-width:761px) {\n  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=movement] .combat-workspace__map > header,\n  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=movement] .combat-workspace__map > p { display:none; }\n  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=movement] .combat-workspace__map { padding:4px; }\n  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=movement] .battlefield-map__board { min-height:0; height:100%; }\n  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=movement] .battlefield-map__legend { margin:2px 0 0; padding:2px 0; }\n}\n`);
