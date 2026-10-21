import fs from 'node:fs';

function replaceOnce(path, oldText, newText, label) {
  const source = fs.readFileSync(path, 'utf8');
  const occurrences = source.split(oldText).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: expected 1 match, found ${occurrences}`);
  fs.writeFileSync(path, source.replace(oldText, newText));
}

replaceOnce(
  'src/ui/battle-shell.js',
  '      missionOpenStates = { ...missionOpenStates, ...openStates };',
  '      missionOpenStates = openStates;',
  'mission summary open-state persistence'
);

replaceOnce(
  'src/ui/command-screen.js',
  `          secondaryModeStatusMarkup + '</div></form>' +
          '<p>In Tactical mode, use this form during that player’s Command phase to record the two cards drawn from the physical deck. Choose the printed card from the catalog or type its name. Check the actual card before scoring; no VP is awarded automatically.</p>' +
          '<p>The catalog contains names and Fixed/Tactical availability, plus verified scoring-window references for a limited set of official sample cards. Other cards remain names-only until their text is checked.</p>';`,
  `          secondaryModeStatusMarkup + '</div></form>';`,
  'secondary entry help text'
);

replaceOnce(
  'src/ui/command-screen.js',
  `    const secondaryMissionManager = '<section class="command-secondary-missions"><h2>Enter secondary mission cards</h2>' +
      '<p>Record Fixed cards for the selected player, or record Tactical cards during that player’s Command phase. Each player has an independent Fixed/Tactical mode chosen during Mission &amp; Map setup.</p>' +
      secondaryEntryMarkup +
      (secondaryMissionMessage ? '<p role="status">' + escapeHtml(secondaryMissionMessage) + '</p>' : '') +
      '<h3>Secondary mission history</h3><ol class="command-ledger-history">' + secondaryHistoryMarkup + '</ol></section>';`,
  `    const secondaryMissionManager = state.phase === "command"
      ? '<section class="command-secondary-missions">' + secondaryEntryMarkup +
        (secondaryMissionMessage ? '<p role="status">' + escapeHtml(secondaryMissionMessage) + '</p>' : '') +
        '</section>'
      : '';`,
  'secondary mission manager cleanup'
);
