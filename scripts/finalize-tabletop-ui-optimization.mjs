import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const write = (path, text) => fs.writeFileSync(path, text);
function replace(path, before, after, label) {
  const src = read(path);
  if (!src.includes(before)) throw new Error(`${label}: source not found in ${path}`);
  write(path, src.replace(before, after));
}
function replaceRegex(path, regex, after, label) {
  const src = read(path);
  if (!regex.test(src)) throw new Error(`${label}: pattern not found in ${path}`);
  regex.lastIndex = 0;
  write(path, src.replace(regex, after));
}

// Direct-score controls should open only the matching adjustment surface.
replaceRegex(
  'src/ui/battle-shell.js',
  /function renderScoreAdjustOverlay\(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed = false, scoreAdjustMessage = ""\) \{[\s\S]*?\n\}\n\nfunction renderStatusSummaryContent/,
`function renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed = false, scoreAdjustMessage = "", scoreAdjustKind = "both") {
  const scorePlayer = players.find((player) => player.id === scoreAdjustPlayerId);
  if (!scorePlayer) return "";
  const showVp = scoreAdjustKind === "both" || scoreAdjustKind === "vp";
  const showCp = scoreAdjustKind === "both" || scoreAdjustKind === "cp";
  const current = (showVp ? '<strong>' + getVictoryPointScore(state, scorePlayer.id) + ' VP</strong>' : '') +
    (showCp ? '<strong>' + getCommandPointBalance(state, scorePlayer.id) + ' CP</strong>' : '');
  const controls = (showVp ? '<span>Victory Points</span><button type="button" data-score-adjust-kind="vp" data-score-adjust-amount="-1">−1</button><button type="button" data-score-adjust-kind="vp" data-score-adjust-amount="1">+1</button>' : '') +
    (showCp ? '<span>Command Points</span><button type="button" data-score-adjust-kind="cp" data-score-adjust-amount="-1">−1</button><button type="button" data-score-adjust-kind="cp" data-score-adjust-amount="1">+1</button>' : '');
  return '<div class="battle-shell__score-adjust-backdrop" data-score-adjust-backdrop><section class="battle-shell__score-adjust' + (scoreAdjustCollapsed ? ' is-collapsed' : '') + '" data-score-adjust-view="' + escapeHtml(scoreAdjustKind) + '" role="dialog" aria-modal="true"><header><h2>' + escapeHtml(scorePlayer.name ?? scorePlayer.id) + '</h2><div><button type="button" data-toggle-score-adjust-collapse aria-label="' + (scoreAdjustCollapsed ? 'Expand score adjustment' : 'Minimize score adjustment') + '">' + (scoreAdjustCollapsed ? '□' : '−') + '</button><button type="button" data-close-score-adjust aria-label="Close">×</button></div></header><div class="battle-shell__score-adjust-current">' + current + '</div><div class="battle-shell__score-adjust-grid">' + controls + '</div><p class="battle-shell__score-adjust-message" role="status">' + escapeHtml(scoreAdjustMessage) + '</p></section></div>';
}

function renderStatusSummaryContent`,
  'score-adjust overlay kind'
);
replace(
  'src/ui/battle-shell.js',
  '  scoreAdjustCollapsed = false,\n  scoreAdjustMessage = ""\n} = {}) {',
  '  scoreAdjustCollapsed = false,\n  scoreAdjustMessage = "",\n  scoreAdjustKind = "both"\n} = {}) {',
  'renderShell score kind option'
);
replace(
  'src/ui/battle-shell.js',
  'renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage)',
  'renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind)',
  'initial score overlay kind'
);
replace(
  'src/ui/battle-shell.js',
  '  let scoreAdjustMessage = "";\n',
  '  let scoreAdjustMessage = "";\n  let scoreAdjustKind = "both";\n',
  'score kind state'
);
// There are two overlay calls after the first replacement; ensure refresh is also kind-aware.
let shell = read('src/ui/battle-shell.js');
shell = shell.replaceAll(
  'renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage);',
  'renderScoreAdjustOverlay(state, players, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind);'
);
shell = shell.replace(
  'layoutMode, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage\n      });',
  'layoutMode, scoreAdjustPlayerId, scoreAdjustCollapsed, scoreAdjustMessage, scoreAdjustKind\n      });'
);
shell = shell.replace(
  'scoreAdjustPlayerId = open.getAttribute("data-open-score-adjust"); scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;',
  'scoreAdjustPlayerId = open.getAttribute("data-open-score-adjust"); scoreAdjustKind = open.getAttribute("data-open-score-adjust-kind") || "both"; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;'
);
shell = shell.replace(
  'scoreAdjustPlayerId = null; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;',
  'scoreAdjustPlayerId = null; scoreAdjustKind = "both"; scoreAdjustCollapsed = false; scoreAdjustMessage = ""; render(); return;'
);
write('src/ui/battle-shell.js', shell);

// Tabletop mode hides reference-only map copy; Review still has full information.
fs.appendFileSync('src/ui/styles/prototype-workspace.css', `
.battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace__map .battlefield-map__meta,
.battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace__map .battlefield-map__notice{display:none!important}
`);

// Update old tests whose asserted copy/zoom chrome was intentionally removed.
replace(
  'tests/ui/fight-map-controls.test.js',
  "test('fight phase hides map zoom controls while shooting keeps them', () => {",
  "test('Tabletop combat phases hide map zoom controls', () => {",
  'fight map test title'
);
replace(
  'tests/ui/fight-map-controls.test.js',
  '  assert.equal(calls[1].showZoomControls, true);',
  '  assert.equal(calls[1].showZoomControls, false);',
  'shooting zoom expectation'
);
replace(
  'tests/ui/live-phase-regressions.test.js',
  '    assert.match(root.innerHTML, /Position is handled only by dragging the map marker/);',
  "    assert.match(root.innerHTML, /data-move-stationary>Did Not Move<\\/button>/);\n    assert.match(root.innerHTML, /data-move-save>Normal Move<\\/button>/);\n    assert.match(root.innerHTML, /data-move-advance>Advance<\\/button>/);\n    assert.match(root.innerHTML, /data-move-fallback>Fall Back<\\/button>/);",
  'movement compact expectation'
);
replace(
  'tests/ui/mission-summary-panel.test.js',
  '  assert.match(html, /You 1 · Opponent 1/);',
  '  assert.match(html, /You: Behind Enemy Lines · Opp: Display of Might/);',
  'mission summary active names expectation'
);
replace(
  'tests/ui/requested-ui-cleanup-charge-scoring.test.js',
  "  assert.match(workspace, /showZoomControls: phase !== 'charge'/);",
  '  assert.match(workspace, /showZoomControls: false/);',
  'shared no-zoom expectation'
);
replace(
  'tests/ui/tabletop-shooting-layout.test.js',
  '    assert.match(root.innerHTML, /Battlefield · Shooting/);\n    assert.match(root.innerHTML, /TACTICAL ADVISOR/);\n    assert.match(root.innerHTML, /Tabletop measurements and eligibility take priority/);',
  '    assert.match(root.innerHTML, /data-tabletop-map-phase="shooting"/);\n    assert.match(root.innerHTML, /TACTICAL ADVISOR/);\n    assert.doesNotMatch(root.innerHTML, /Battlefield · Shooting|Tabletop measurements and eligibility take priority/);',
  'shooting map-first expectation'
);

// Rewrite the new source-level checks without slash-sensitive HTML regexes.
write('tests/ui/tabletop-optimization-pass.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Tabletop HUD exposes compact scores, phases, Review and separate timer controls', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.ok(src.includes('tabletop-live-strip'));
  assert.ok(src.includes('data-open-score-adjust-kind="vp"'));
  assert.ok(src.includes('data-open-score-adjust-kind="cp"'));
  assert.ok(src.includes('data-toggle-turn-clock'));
  assert.ok(src.includes('<summary>Phases</summary>'));
  assert.ok(src.includes("focus ? 'Review' : 'Tabletop'"));
});

test('shared Tabletop maps omit repeated banners and zoom controls', () => {
  const src = read('src/ui/combat-workspace.js');
  assert.equal(src.includes('Battlefield · ${phase'), false);
  assert.ok(src.includes('showZoomControls: false'));
});

test('mission bars expose current mission names while closed', () => {
  const src = read('src/ui/mission-summary-panel.js');
  assert.ok(src.includes('battle-mission-summary__active-names'));
  assert.ok(src.includes('mySecondaryNames.join'));
  assert.ok(src.includes('primary.myName'));
});

test('live map has compact objective labels and Battle-shock status styling', () => {
  const src = read('src/ui/battlefield-map.js');
  assert.ok(src.includes('compactObjectiveLabel'));
  assert.ok(src.includes('is-battle-shocked'));
  const css = read('src/ui/styles/prototype-workspace.css');
  assert.ok(css.includes('repeating-linear-gradient'));
});

test('Shooting presents target comparison before selected-target detail', () => {
  const src = read('src/ui/shooting-screen.js');
  const compare = src.indexOf('shoot-tabletop__target-comparisons');
  const detail = src.indexOf('shoot-tabletop__selected-target');
  assert.ok(compare >= 0 && detail > compare);
  assert.equal(src.includes('data-choice-not-shoot>Skip</button>'), false);
});

test('Movement, Command and Fight use compact action-first controls', () => {
  assert.ok(read('src/ui/movement-screen.js').includes('data-move-stationary>Did Not Move</button>'));
  assert.ok(read('src/ui/command-screen.js').includes('command-tabletop-section'));
  assert.ok(read('src/ui/fight-tabletop-screen.js').includes('fight-order__unit'));
});

test('scoreboard routes VP, CP and timer taps to their specific controls', () => {
  const src = read('src/ui/battle-shell.js');
  assert.ok(src.includes('data-score-adjust-kind="vp"'));
  assert.ok(src.includes('data-score-adjust-kind="cp"'));
  assert.ok(src.includes('scoreAdjustKind'));
  assert.ok(src.includes('data-toggle-turn-clock'));
});
`);
