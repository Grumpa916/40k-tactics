import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Tabletop HUD exposes compact scores, phases, Overview and separate timer controls', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.ok(src.includes('tabletop-live-strip'));
  assert.ok(src.includes('data-open-score-adjust-kind="vp"'));
  assert.ok(src.includes('data-open-score-adjust-kind="cp"'));
  assert.ok(src.includes('data-toggle-turn-clock'));
  assert.ok(src.includes('<summary>Phases</summary>'));
  assert.ok(src.includes("focus ? 'Overview' : 'Tabletop'"));
});

test('Command battle view exposes a guarded next-phase button for Movement', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.ok(src.includes('data-workspace-next-phase data-advance-game-phase hidden'));
  assert.ok(src.includes("nextPhaseButton.hidden = !(combat && state.phase === 'command')"));
  assert.ok(src.includes("Next phase → Movement"));
});

test('shared Tabletop maps omit repeated banners and zoom controls', () => {
  const src = read('src/ui/combat-workspace.js');
  assert.equal(src.includes('Battlefield · ' + '$' + '{phase'), false);
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
