import fs from 'node:fs';

function replace(path, oldText, newText, label) {
  const src = fs.readFileSync(path,'utf8');
  if (!src.includes(oldText)) throw new Error(`${label}: source text not found`);
  fs.writeFileSync(path, src.replace(oldText,newText));
}

// Remove the standalone formations checkpoint and trim redundant setup instructions.
replace('src/rules/event-preparation.js',
"  ['secondaries', 'Reveal secondary choices', 'First make choices privately on paper or physical cards. Reveal together, then record both players below. Tactical players shuffle their decks; draw in Command.'],\n  ['formations', 'Declare battle formations', 'Privately note passengers first, then strategic reserves. Reveal together and record below. Confirm transport eligibility/capacity and reserve exceptions against the tabletop rules.'],\n  ['deployment', 'Deploy armies', 'Alternate placements starting with Defender. After placing a Titanic unit, skip your next placement. Infiltrators apply here; confirm distances on the table.'],",
"  ['secondaries', 'Reveal secondary choices', ''],\n  ['deployment', 'Deploy armies', ''],",
'preparation steps');

replace('src/engine/state-transitions.js',
'  requirePreparationComplete(state, "formations");',
'  requirePreparationComplete(state, "secondaries");',
'deployment prerequisite');

replace('src/ui/event-preparation-screen.js',
"        if(stage==='formations'&&preparationStep(session.getState())==='deployment') {\n          try{session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});}catch(err){message=err.message;render();}\n        }",
"        if(stage!=='deployment'&&preparationStep(session.getState())==='deployment') {\n          try{session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});}catch(err){message=err.message;render();}\n        }",
'enter deployment after secondaries');

// Remove redundant copy from the secondary-choice setup panel.
replace('src/ui/battle-setup-screen.js',
"    const missionMapMarkup =\n      '<section class=\"secondary-mission-setup\"><h2>Secondary missions</h2>' +\n      '<p>Set each player’s mode independently. Both players remain visible so you can configure both sides without switching a selector.</p>' +\n      '<div class=\"secondary-player-panels\">' + secondaryPlayerPanels + '</div>' +\n      '<p>Card rules remain manual-review-only unless their scoring windows are verified from official card text. This screen records the physical cards; it does not award VP.</p></section>';",
"    const missionMapMarkup =\n      '<section class=\"secondary-mission-setup\"><h2>Secondary missions</h2>' +\n      '<div class=\"secondary-player-panels\">' + secondaryPlayerPanels + '</div></section>';",
'secondary setup copy');

// Deployment page should be map-first without repeated explanatory blocks.
replace('src/ui/deployment-screen.js',
"    let markup = '<main class=\"deployment-screen\"><header><div class=\"command-kicker\">BATTLE SETUP</div>' +\n      '<h1>Actual Deployment</h1><p>Record where both armies actually deploy. Planned positions are a guide only and are not copied automatically.</p></header>' +\n      '<p class=\"battlefield-map__notice\">The map is approximate context, not a measurement tool. Follow the mission pack and tabletop rules for legal deployment, terrain, and reserve restrictions.</p>' +\n      '<section class=\"battlefield-map-section\"><h2>Deployment Map</h2>' +",
"    let markup = '<main class=\"deployment-screen\">' +\n      '<section class=\"battlefield-map-section\"><h2>Deployment Map</h2>' +",
'deployment intro');

let path='src/ui/command-screen.js';
let src=fs.readFileSync(path,'utf8');
src=src.replace(/function commandPointsFor\(state, playerId\) \{[\s\S]*?\n\}/,
`function commandPointsFor(state, playerId) {\n  return playerId ? String(getCommandPointBalance(state, playerId)) : "0";\n}`);
src=src.replace('  let selectedSecondaryPlayerId = null;\n','');
src=src.replace('      const playerId = container.querySelector("[data-secondary-player]")?.value ||\n        perspectivePlayerId || state.activePlayer;','      const playerId = state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId;');
src=src.replace(/    if \(target\?\.matches\?\.\("\[data-secondary-player\]"\)\) \{[\s\S]*?      return;\n    \}\n/,'');
src=src.replace('        selectedSecondaryPlayerId = playerId;\n','');
src=src.replace(/    if \(!selectedSecondaryPlayerId \|\| !players\.some\(\(player\) => player\.id === selectedSecondaryPlayerId\)\) \{[\s\S]*?    \}\n    const objectives/,
'    const selectedSecondaryPlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId ?? players[0]?.id ?? null;\n    const objectives');
src=src.replace(/    const secondaryPlayerOptions = players\.map\([\s\S]*?    \)\.join\(""\);\n/,'');
src=src.replace("          '<p>Secondary mode for ' + escapeHtml(playerName(state, selectedSecondaryPlayerId)) + ': <strong>' +\n           escapeHtml(secondaryMissionMode || \"Not set\") + '</strong>. Set each player’s mode in Mission &amp; Map setup.</p>' +\n          '<label>Player<select data-secondary-player>' + secondaryPlayerOptions + '</select></label>' +",
"          '<p><strong>Secondary mode:</strong> ' + escapeHtml(secondaryMissionMode || \"Not set\") + '</p>' +");
src=src.replace("          '<label>Card scoring checkpoint<select data-secondary-timing>' + manualTimingOptions + '</select></label>' +\n",'');
fs.writeFileSync(path,src);

// Add regression checks for this requested UI behavior.
fs.writeFileSync('tests/ui/setup-command-cleanup.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\ntest('formations page is removed from the guided preparation sequence',()=>{\n const src=fs.readFileSync(new URL('../../src/rules/event-preparation.js',import.meta.url),'utf8');\n assert.doesNotMatch(src,/\\['formations', 'Declare battle formations'/);\n});\n\ntest('deployment begins after the secondary-choice checkpoint',()=>{\n const state=fs.readFileSync(new URL('../../src/engine/state-transitions.js',import.meta.url),'utf8');\n assert.match(state,/requirePreparationComplete\\(state, \\\"secondaries\\\"\\)/);\n});\n\ntest('command screen uses active player for secondary entry and ledger CP balance',()=>{\n const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');\n assert.match(src,/String\\(getCommandPointBalance\\(state, playerId\\)\\)/);\n assert.doesNotMatch(src,/Player<select data-secondary-player/);\n assert.doesNotMatch(src,/Card scoring checkpoint<select data-secondary-timing/);\n});\n\ntest('redundant setup and deployment copy is removed',()=>{\n const setup=fs.readFileSync(new URL('../../src/ui/battle-setup-screen.js',import.meta.url),'utf8');\n const deploy=fs.readFileSync(new URL('../../src/ui/deployment-screen.js',import.meta.url),'utf8');\n assert.doesNotMatch(setup,/Set each player’s mode independently/);\n assert.doesNotMatch(setup,/Card rules remain manual-review-only/);\n assert.doesNotMatch(deploy,/Record where both armies actually deploy/);\n assert.doesNotMatch(deploy,/map is approximate context, not a measurement tool/);\n});\n`);
