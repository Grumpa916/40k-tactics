import fs from 'node:fs';

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`${label}: source not found in ${path}`);
  text = text.replace(before, after);
  fs.writeFileSync(path, text);
}

// 1) Remove the remaining white setup surface behind Select Armies and force
// compact A/B/C diagrams to remain side-by-side on tablet landscape.
fs.appendFileSync('src/ui/styles/prototype-workspace.css', `

/* Select Armies and battlefield-layout tablet refinements. */
.battle-shell__setup-tools:has([data-setup-workspace-panel="army-selection"]:not([hidden])) {
  background:#101820 !important;
  color:#edf4f7 !important;
  border-color:#304149 !important;
}
.battle-shell__setup-tools [data-setup-workspace-panel="army-selection"],
.battle-shell__setup-tools [data-army-selection-panel],
.battle-shell__setup-tools [data-army-selection-panel] > .army-selection {
  background:#101820 !important;
  color:#edf4f7 !important;
}
.event-companion-layout-buttons {
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:8px !important;
  width:100%;
}
.event-companion-layout-buttons .event-companion-layout-select { min-width:0; margin:0; }
.event-companion-layout-diagrams {
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:8px !important;
  width:100%;
  align-items:start;
}
.event-companion-layout-diagrams .event-companion-layout-preview {
  width:100%; max-width:100%; min-width:0; box-sizing:border-box; overflow:hidden;
}
.event-companion-layout-diagrams .event-companion-layout-thumbnail,
.event-companion-layout-diagrams .event-companion-layout-thumbnail [data-battlefield-map] {
  width:100% !important; max-width:100% !important; min-width:0 !important; overflow:hidden;
}
.event-companion-layout-diagrams .event-companion-layout-thumbnail .battlefield-map__meta,
.event-companion-layout-diagrams .event-companion-layout-thumbnail .battlefield-map__legend,
.event-companion-layout-diagrams .event-companion-layout-thumbnail .battlefield-map__notice { display:none !important; }
.event-companion-layout-diagrams .event-companion-layout-thumbnail .battlefield-map__board {
  width:100% !important; max-width:100% !important; min-width:0 !important;
  height:auto !important; min-height:0 !important; max-height:none !important; aspect-ratio:15/11 !important;
}
.battle-shell__player-summary time { font-variant-numeric:tabular-nums; font-weight:800; white-space:nowrap; }
/* Command uses the same full live-map workspace sizing as Movement. */
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .live-map > nav { display:none; }
@media (orientation:landscape) and (min-width:761px) {
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=command] .combat-workspace__map > header,
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=command] .combat-workspace__map > p { display:none; }
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=command] .combat-workspace__map { padding:4px; }
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=command] .battlefield-map__board { min-height:0; height:100%; }
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace[data-combat-phase=command] .battlefield-map__legend { margin:2px 0 0; padding:2px 0; }
}
`);

replaceOnce(
  'src/ui/army-selection-panel.js',
  '.army-selection{display:grid;gap:14px}.army-selection header h2{margin:0 0 8px}.army-selection{color:#edf4f7}',
  '.army-selection{display:grid;gap:14px;background:#101820;color:#edf4f7}.army-selection header h2{margin:0 0 8px}.army-selection{color:#edf4f7}',
  'army selection background'
);

// 2) Smaller objective labels and deterministic one-per-side expansion naming.
replaceOnce(
  'src/ui/battlefield-map.js',
  'min-width:42px;max-width:108px;min-height:24px;padding:4px 7px;display:flex;align-items:center;justify-content:center;border:2px solid #8c98a5;border-radius:999px;background:#2b3138;color:#f4f7fa;font-size:9px;font-weight:800;line-height:1.05;',
  'min-width:34px;max-width:88px;min-height:20px;padding:2px 5px;display:flex;align-items:center;justify-content:center;border:1.5px solid #8c98a5;border-radius:999px;background:#2b3138;color:#f4f7fa;font-size:8px;font-weight:800;line-height:1;',
  'objective label sizing'
);

replaceOnce(
  'src/ui/battlefield-map.js',
`  if (name === "Expansion 1" || name === "Expansion 2") {
    const positions = selectedLayoutGeometry(state)?.objectivePositions ?? {};
    const position = positions[name];
    const attackerHome = positions["Attacker Home"];
    const defenderHome = positions["Defender Home"];
    if (position && attackerHome && defenderHome && perspectivePlayerId) {
      const distance = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
      const expansionOwner = distance(position, attackerHome) < distance(position, defenderHome) ? attacker : defender;
      return expansionOwner === perspectivePlayerId ? "My Expansion" : "Opponent Expansion";
    }
  }`,
`  if (name === "Expansion 1" || name === "Expansion 2") {
    const positions = selectedLayoutGeometry(state)?.objectivePositions ?? {};
    const myHomeName = perspectivePlayerId === attacker ? "Attacker Home" :
      perspectivePlayerId === defender ? "Defender Home" : null;
    const myHome = myHomeName ? positions[myHomeName] : null;
    const expansion1 = positions["Expansion 1"];
    const expansion2 = positions["Expansion 2"];
    if (myHome && expansion1 && expansion2) {
      const distance = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
      const myExpansionName = distance(expansion1, myHome) <= distance(expansion2, myHome)
        ? "Expansion 1" : "Expansion 2";
      return name === myExpansionName ? "My Expansion" : "Opponent Expansion";
    }
  }`,
  'expansion perspective naming'
);

// 3) Automatically grant +1 CP to both players exactly when Command starts.
replaceOnce(
  'src/engine/state-transitions.js',
  'import { pauseTurnClock, startTurnClock } from "./turn-clock-transitions.js";',
  'import { pauseTurnClock, startTurnClock } from "./turn-clock-transitions.js";\nimport { recordCommandPointChange } from "./command-points-ledger.js";',
  'command point import'
);

replaceOnce(
  'src/engine/state-transitions.js',
`  const isShootingCompletion = state.phase === "shooting" && phase === "charge";`,
`  if (phase === "command") {
    let next = transition(state, "turn.phase_changed", {
      phase,
      round: state.battle.round,
      turn: state.turn
    }, (current) => ({ ...current, phase }));
    for (const player of state.players ?? []) {
      next = recordCommandPointChange(next, {
        playerId: player.id,
        amount: 1,
        reason: "gain",
        note: "Automatic Command phase gain",
        turn: state.turn ?? 0,
        round: state.battle?.round ?? 0
      });
    }
    return next;
  }

  const isShootingCompletion = state.phase === "shooting" && phase === "charge";`,
  'automatic command phase CP'
);

// 4) Surface each player's accumulated turn timer in the persistent player card.
replaceOnce(
  'src/ui/battle-shell.js',
`    const cp = getCommandPointBalance(state, player.id);
    const active = player.id === activePlayerId ? " is-active" : "";`,
`    const cp = getCommandPointBalance(state, player.id);
    const elapsed = formatElapsedTime(getTurnClockElapsedMs(state, player.id));
    const active = player.id === activePlayerId ? " is-active" : "";`,
  'player timer value'
);
replaceOnce(
  'src/ui/battle-shell.js',
`      '<span>' + vp + ' VP</span><span>' + cp + ' CP</span></button>';`,
`      '<span>' + vp + ' VP</span><span>' + cp + ' CP</span><time data-clock-player-elapsed="' + escapeHtml(player.id) + '">' + elapsed + '</time></button>';`,
  'player timer markup'
);

// 5) Remove manual card-name input from Command and use Movement's live map workspace.
replaceOnce(
  'src/ui/command-screen.js',
  'import { renderBattlefieldMap } from "./battlefield-map.js";',
  'import { renderBattlefieldMap } from "./battlefield-map.js";\nimport { createLiveMapView } from "./live-map-view.js";\nimport { renderCombatWorkspace } from "./combat-workspace.js";',
  'command workspace imports'
);
replaceOnce(
  'src/ui/command-screen.js',
`  scoringCheckpoint = null,
  scoringCheckpointActivePlayerId = null,
  scoringCheckpointPlayerId = null
} = {}) {`,
`  scoringCheckpoint = null,
  scoringCheckpointActivePlayerId = null,
  scoringCheckpointPlayerId = null,
  layoutMode = "tabletop"
} = {}) {`,
  'command layout option'
);
replaceOnce(
  'src/ui/command-screen.js',
`  let secondaryMissionMessage = "";
  let vpMessage = "";
  let objectiveMessage = "";`,
`  const mapView = createLiveMapView();
  let secondaryMissionMessage = "";
  let vpMessage = "";
  let objectiveMessage = "";`,
  'command map view'
);
replaceOnce(
  'src/ui/command-screen.js',
  `const secondaryDefinitionOptions = '<option value="">Enter a mission manually</option>' +`,
  `const secondaryDefinitionOptions = '<option value="">Select a mission…</option>' +`,
  'secondary catalog placeholder'
);
replaceOnce(
  'src/ui/command-screen.js',
  `          '<label>Mission from catalog<select data-secondary-definition>' + secondaryDefinitionOptions + '</select></label>' +
          '<label>Or enter card name<input data-secondary-name type="text" maxlength="160" placeholder="Name printed on your card"></label>' +
          '<button type="button" data-secondary-mission-add>Record secondary card</button>' +`,
  `          '<label>Mission from catalog<select data-secondary-definition>' + secondaryDefinitionOptions + '</select></label>' +
          '<button type="button" data-secondary-mission-add>Record secondary card</button>' +`,
  'remove command manual card input'
);
replaceOnce(
  'src/ui/command-screen.js',
  'secondaryMissionMessage = "Choose a catalog mission or enter a card name and its scoring checkpoint.";',
  'secondaryMissionMessage = "Choose a secondary mission from the catalog.";',
  'manual card error text'
);

const oldRender = `    container.innerHTML = '<main class="command-screen"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Review command points, objective control and command-phase scoring evidence. Mission scoring remains a table-side decision; the app does not award points automatically.</p>' +
      secondaryMissionManager +
      secondaryRedrawMarkup +
      secondaryVpForm +
      '<section><h2>Live battlefield map</h2>' +
      renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: perspectivePlayerId ?? playerId }) +
      '<p>Tap an objective label on the map to cycle Uncontrolled → My Army → Opponent → Contested.</p></section>' +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section>' + checkpointReview + '</main>';`;

const newRender = `    const commandControls = '<div class="command-screen command-screen--tabletop"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Tap objective labels on the live map to update control. Review cards and scoring here without shrinking the battlefield.</p>' +
      secondaryMissionManager + secondaryRedrawMarkup + secondaryVpForm +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section>' + checkpointReview + '</div>';
    if (layoutMode === "tabletop") {
      container.innerHTML = renderCombatWorkspace({
        state,
        phase: "command",
        perspectivePlayerId: perspectivePlayerId ?? playerId,
        selectedUnitId: null,
        interactivePlayerId: null,
        mapView,
        controls: commandControls,
        footer: '<small>Objective control, secondary cards and scoring controls remain available in this panel.</small>'
      });
      mapView.bind(container);
      return;
    }
    container.innerHTML = '<main class="command-screen"><header><div><div class="command-kicker">LIVE BATTLE</div>' +
      '<h1>Command Phase</h1><p>Round ' + escapeHtml(state.battle?.round ?? "—") + ' · Turn ' +
      escapeHtml(state.turn ?? "—") + ' · ' + escapeHtml(playerName(state, playerId)) +
      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Review command points, objective control and command-phase scoring evidence. Mission scoring remains a table-side decision; the app does not award points automatically.</p>' +
      secondaryMissionManager + secondaryRedrawMarkup + secondaryVpForm +
      '<section><h2>Live battlefield map</h2>' +
      renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: perspectivePlayerId ?? playerId }) +
      '<p>Tap an objective label on the map to cycle Uncontrolled → My Army → Opponent → Contested.</p></section>' +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section>' + checkpointReview + '</main>';`;
replaceOnce('src/ui/command-screen.js', oldRender, newRender, 'command live-map workspace');

// Focused regression tests.
fs.writeFileSync('tests/engine/command-phase-cp-gain.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import { changePhase } from '../../src/engine/state-transitions.js';
import { getCommandPointBalance, getCommandPointHistory } from '../../src/engine/command-points-ledger.js';

test('starting Command phase automatically grants 1 CP to both players', () => {
  const state = {
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{status:'active',round:1,activePlayerId:'p1'},
    activePlayer:'p1', phase:'start_turn', turn:1, history:[],
    commandPoints:{p1:0,p2:2}, units:[], objectives:[]
  };
  const next = changePhase(state,{phase:'command'});
  assert.equal(next.phase,'command');
  assert.equal(getCommandPointBalance(next,'p1'),1);
  assert.equal(getCommandPointBalance(next,'p2'),3);
  assert.equal(getCommandPointHistory(next).filter(x=>x.note==='Automatic Command phase gain').length,2);
});
`);

fs.writeFileSync('tests/ui/command-live-map-and-timers.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Command tabletop view reuses the combat live-map workspace and removes manual card-name entry',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');
  assert.match(src,/renderCombatWorkspace/);
  assert.match(src,/phase: \"command\"/);
  assert.doesNotMatch(src,/data-secondary-name type=\"text\"/);
});

test('persistent player summaries display separate accumulated timers',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
  assert.match(src,/data-clock-player-elapsed/);
  assert.match(src,/getTurnClockElapsedMs\(state, player\.id\)/);
});

test('battlefield objective labels are compact and expansion naming is perspective-stable',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/battlefield-map.js',import.meta.url),'utf8');
  assert.match(src,/min-width:34px;max-width:88px/);
  assert.match(src,/myExpansionName/);
});
`);
