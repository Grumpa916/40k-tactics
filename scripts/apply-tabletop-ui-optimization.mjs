import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const write = (path, text) => fs.writeFileSync(path, text);

function replaceOnce(path, before, after, label) {
  const source = read(path);
  if (!source.includes(before)) throw new Error(`${label}: source not found in ${path}`);
  write(path, source.replace(before, after));
}

function replaceRegex(path, regex, replacement, label) {
  const source = read(path);
  if (!regex.test(source)) throw new Error(`${label}: pattern not found in ${path}`);
  regex.lastIndex = 0;
  write(path, source.replace(regex, replacement));
}

// Scoreboard: individual numeric controls instead of making the whole player card actionable.
replaceOnce(
  'src/ui/battle-shell.js',
`    return '<button type="button" class="battle-shell__player-summary' + active + '" data-open-score-adjust="' + escapeHtml(player.id) + '" aria-label="Adjust score for ' + escapeHtml(player.name ?? player.id) + '">' +
      '<strong>' + escapeHtml(player.name ?? player.id) + '</strong>' +
      '<span>' + vp + ' VP</span><span>' + cp + ' CP</span><time data-clock-player-elapsed="' + escapeHtml(player.id) + '">' + elapsed + '</time></button>';`,
`    return '<div class="battle-shell__player-summary' + active + '">' +
      '<strong>' + escapeHtml(player.name ?? player.id) + '</strong>' +
      '<button type="button" class="battle-shell__summary-value" data-open-score-adjust="' + escapeHtml(player.id) + '" data-open-score-adjust-kind="vp" aria-label="Adjust Victory Points for ' + escapeHtml(player.name ?? player.id) + '">' + vp + ' VP</button>' +
      '<button type="button" class="battle-shell__summary-value" data-open-score-adjust="' + escapeHtml(player.id) + '" data-open-score-adjust-kind="cp" aria-label="Adjust Command Points for ' + escapeHtml(player.name ?? player.id) + '">' + cp + ' CP</button>' +
      '<button type="button" class="battle-shell__summary-time" data-toggle-turn-clock aria-label="Open turn clock"><time data-clock-player-elapsed="' + escapeHtml(player.id) + '">' + elapsed + '</time></button></div>';`,
  'numeric scoreboard controls'
);
replaceOnce(
  'src/ui/battle-shell.js',
`  return '<div class="battle-shell__round-summary"><strong>Round ' + (round || "—") + '</strong>' +
    '<span>' + escapeHtml(phaseLabel(state.phase ?? viewedPhase)) + '</span></div>' +
    '<div class="battle-shell__player-summaries">' + playerSummary + '</div>' +
    '<button type="button" class="battle-shell__clock-button" data-toggle-turn-clock ' +
    'aria-expanded="' + String(clockPanelOpen) + '" aria-controls="battle-turn-clock-panel">' +
    '<span>Clock</span><time data-turn-clock-header-time>' + clockTime + '</time></button>';`,
`  return '<div class="battle-shell__round-summary"><strong>Round ' + (round || "—") + '</strong>' +
    '<span>' + escapeHtml(phaseLabel(state.phase ?? viewedPhase)) + '</span></div>' +
    '<div class="battle-shell__player-summaries">' + playerSummary + '</div>';`,
  'remove redundant global clock card'
);

// Compact bottom dock labels.
replaceOnce(
  'src/ui/battle-shell.js',
`    '<button type="button" data-open-army-roster="' + escapeHtml(yourPlayerId ?? "") + '"' +
    (yourPlayerId ? "" : " disabled") + '><strong>My Army</strong><span>' + escapeHtml(myName) + '</span></button>' +
    '<button type="button" data-open-army-roster="' + escapeHtml(opponentPlayerId ?? "") + '"' +
    (opponentPlayerId ? "" : " disabled") + '><strong>Opponent Army</strong><span>' + escapeHtml(opponentName) + '</span></button><button type="button" data-open-battle-log>☷ Log</button></nav>';`,
`    '<button type="button" data-open-army-roster="' + escapeHtml(yourPlayerId ?? "") + '"' +
    (yourPlayerId ? "" : " disabled") + '><strong>My Army</strong></button>' +
    '<button type="button" data-open-army-roster="' + escapeHtml(opponentPlayerId ?? "") + '"' +
    (opponentPlayerId ? "" : " disabled") + '><strong>Opponent</strong></button><button type="button" data-open-battle-log>☷ Log</button></nav>';`,
  'compact army dock labels'
);

// Mission bars show what is active while they remain closed.
replaceOnce(
  'src/ui/mission-summary-panel.js',
`  const mySecondaryCount = activeCount(primary.myPlayerId);
  const opponentSecondaryCount = activeCount(primary.opponentPlayerId);`,
`  const mySecondaryCount = activeCount(primary.myPlayerId);
  const opponentSecondaryCount = activeCount(primary.opponentPlayerId);
  const activeNames = (playerId) => secondaryHistory.filter((item) =>
    item.playerId === playerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE)
    .map((item) => item.definition?.name ?? item.definitionId);
  const mySecondaryNames = activeNames(primary.myPlayerId);
  const opponentSecondaryNames = activeNames(primary.opponentPlayerId);`,
  'mission active-name helpers'
);
replaceOnce(
  'src/ui/mission-summary-panel.js',
`    openAttribute(openStates, primaryKey) + '><summary><span>Primary Missions</span><span class="battle-context__count">' +
    knownPrimaryCount + ' assigned</span></summary><div class="battle-mission-summary__section-content">' +`,
`    openAttribute(openStates, primaryKey) + '><summary><span>Primary Missions</span><span class="battle-context__count battle-mission-summary__active-names">You: ' +
    escapeHtml(primary.myName ?? '—') + ' · Opp: ' + escapeHtml(primary.opponentName ?? '—') + '</span></summary><div class="battle-mission-summary__section-content">' +`,
  'primary mission names in closed bar'
);
replaceOnce(
  'src/ui/mission-summary-panel.js',
`    openAttribute(openStates, secondaryKey) + '><summary><span>Secondary Missions</span>' +
    '<span class="battle-context__count">You ' + mySecondaryCount + ' · Opponent ' + opponentSecondaryCount +
    '</span></summary><div class="battle-mission-summary__section-content">' +`,
`    openAttribute(openStates, secondaryKey) + '><summary><span>Secondary Missions</span>' +
    '<span class="battle-context__count battle-mission-summary__active-names">You: ' + escapeHtml(mySecondaryNames.join(', ') || '—') +
    ' · Opp: ' + escapeHtml(opponentSecondaryNames.join(', ') || '—') + '</span></summary><div class="battle-mission-summary__section-content">' +`,
  'secondary mission names in closed bar'
);

// Movement: action-first labels and no training copy.
replaceOnce('src/ui/movement-screen.js', '  "unit.stationary_recorded": "Remained stationary"', '  "unit.stationary_recorded": "Did Not Move"', 'stationary label');
replaceOnce(
  'src/ui/movement-screen.js',
`          ? \`<p><strong>\${escapeHtml(MOVEMENT_LABELS[action.type] ?? "Movement recorded")}</strong>. Drag this unit on the map as often as needed to refine its approximate position.</p>
             <div class="move-actions"><button type="button" data-reset-position>Undo Movement / Reset Position</button></div>\`
          : \`<p>Record the tabletop movement choice. Position is handled only by dragging the map marker; no X/Y coordinate entry is required.</p>
             <div class="move-actions">
               <button type="button" data-move-save>Record Normal Move</button>`,
`          ? \`<p class="move-editor__status"><strong>✓ \${escapeHtml(MOVEMENT_LABELS[action.type] ?? "Movement recorded")}</strong></p>
             <div class="move-actions"><button type="button" data-reset-position>Undo</button></div>\`
          : \`<div class="move-actions">
               <button type="button" data-move-stationary>Did Not Move</button>
               <button type="button" data-move-save>Normal Move</button>`,
  'movement compact action header'
);
replaceOnce('src/ui/movement-screen.js', '<button type="button" data-move-advance>Record Advance</button>', '<button type="button" data-move-advance>Advance</button>', 'advance label');
replaceOnce('src/ui/movement-screen.js', '<button type="button" data-move-fallback>Record Fall Back</button>\n               <button type="button" data-move-stationary>Did Not Move · Heavy</button>', '<button type="button" data-move-fallback>Fall Back</button>', 'movement compact choices');
replaceOnce('src/ui/movement-screen.js', '<details><summary>Select another unit · ${eligible.length} units</summary>', '<details><summary>Units · ${eligible.length}</summary>', 'movement unit list label');
replaceOnce('src/ui/movement-screen.js', "footer:'<small>Use End Movement above when tabletop movement is complete.</small>'", "footer:''", 'movement footer copy');
replaceOnce('src/ui/movement-screen.js', '<h2>${escapeHtml(reserved.name)}</h2><p>In reserves · tap an empty map position to place this unit when its tabletop arrival is permitted.</p>', '<h2>${escapeHtml(reserved.name)}</h2><p>In reserves</p>', 'reserve copy');

// Command: compact, action-oriented sections; the scoring reminder remains authoritative.
replaceOnce(
  'src/ui/command-screen.js',
`      '</p></div><div class="command-points"><span>Command Points</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<p class="command-note">Tap objective labels on the live map to update control. Review cards and scoring here without shrinking the battlefield.</p>' +
      secondaryMissionManager + secondaryRedrawMarkup + secondaryVpForm +
      '<section><h2>Command-phase scoring review</h2>' + scoring + '</section>' + checkpointReview + '</div>';`,
`      '</p></div><div class="command-points"><span>CP</span><strong>' +
      escapeHtml(commandPointsFor(state, playerId)) + '</strong></div></header>' +
      '<details class="command-tabletop-section"' + (secondaryMissionMode === 'tactical' && tacticalDrawCount < 2 ? ' open' : '') + '><summary>Secondaries</summary>' +
      secondaryMissionManager + secondaryRedrawMarkup + secondaryVpForm + '</details>' +
      '<details class="command-tabletop-section"><summary>Scoring review</summary><section>' + scoring + '</section>' + checkpointReview + '</details></div>';`,
  'compact command controls'
);
replaceOnce('src/ui/command-screen.js', "footer: '<small>Objective control, secondary cards and scoring controls remain available in this panel.</small>'", "footer: ''", 'command footer copy');

// Shooting: visible compact target comparison first, then selected-target detail.
replaceOnce('src/ui/shooting-screen.js', '<button type="button" data-choice-not-shoot>Skip</button>', '<button type="button" data-choice-not-shoot>Do not shoot</button>', 'shoot skip label');
replaceOnce(
  'src/ui/shooting-screen.js',
`            </div>\` : (!pendingUnit ? \`<p class="shoot-tabletop__selection-help">Select one of the active army's eligible units on the battlefield to choose Shoot, Action, or Skip.</p>\` : "")}`,
`            </div>\` : ""}`,
  'remove shooting instructional copy'
);
replaceOnce(
  'src/ui/shooting-screen.js',
`              <details class="shoot-tabletop__target-comparisons"><summary>Compare other targets</summary>\${targetComparison}</details>
              \${selectedAttackerId && selectedWeaponId && selectedTargetId ? \`<div class="shoot-tabletop__advisor-scroll">

                \${shootingAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, { openDetails: false })}
              </div>\` : '<p class="shoot-tabletop__empty-advice">Select a target to show probability, Primary/Secondary impact, recent threat, recommendation and assumptions.</p>'}`,
`              <div class="shoot-tabletop__target-comparisons">\${targetComparison}</div>
              \${selectedAttackerId && selectedWeaponId && selectedTargetId ? \`<details class="shoot-tabletop__selected-target" open><summary>Selected target details</summary><div class="shoot-tabletop__advisor-scroll">
                \${shootingAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, { openDetails: false })}
              </div></details>\` : ''}`,
  'shooting target comparison first'
);

// Charge: reduce prose; actions and distances remain authoritative.
replaceRegex('src/ui/charge-tabletop-screen.js', /\n      <p>Round \$\{esc\(model\.round\)\} · Charge · active army<\/p>/, '', 'charge round copy');
replaceOnce('src/ui/charge-tabletop-screen.js', '<h2>Declare targets</h2><p>Tap enemy markers to add or remove targets. Measure every declared target before recording the result.</p>', '<h2>Targets</h2>', 'charge target instruction');
replaceOnce('src/ui/charge-tabletop-screen.js', "        <small>Map uncertainty ±3″. Physical charge roll, movement and legal declaration are resolved on the table.</small>", '', 'charge advisor copy');

// Fight: make activation order scanable and color ownership directly in the activation rows.
replaceOnce(
  'src/ui/fight-tabletop-screen.js',
`    const chooseButtons = (units, blocked = false) => units.map(item => \`<button type="button" data-fight-select="\${esc(item.unitId)}" aria-pressed="\${item.unitId === attackerId}" \${blocked ? 'disabled' : ''}>\${esc(item.name)} · \${item.ownerId === perspectivePlayerId ? 'You' : 'Opponent'}</button>\`).join('');`,
`    const chooseButtons = (units, blocked = false) => units.map(item => \`<button type="button" class="fight-order__unit \${item.ownerId === perspectivePlayerId ? 'is-friendly' : 'is-opponent'}" data-fight-select="\${esc(item.unitId)}" aria-pressed="\${item.unitId === attackerId}" \${blocked ? 'disabled' : ''}>\${esc(item.name)}</button>\`).join('');`,
  'fight ownership rows'
);
replaceOnce('src/ui/fight-tabletop-screen.js', "      <p>Round ${esc(model.round)} · ${model.candidates.fightsFirst.length ? 'Fights First' : 'Remaining combats'} · either army</p>\n      <small>Follow tabletop activation order. The app enforces Fights First priority; alternating players remains a table-side decision.</small>", '', 'fight instructional copy');
replaceOnce('src/ui/fight-tabletop-screen.js', '<details ${attackerId ? \'\' : \'open\'}><summary>Fighters · ${available.length} available</summary>', '<details class="fight-order" ${attackerId ? \'\' : \'open\'}><summary>Fight order · ${available.length} available</summary>', 'fight order class');
replaceOnce('src/ui/fight-tabletop-screen.js', " : '<p>Tap a fighter, then an enemy. Target comparison does not record an activation.</p>'}", " : ''}", 'fight selection instructions');
replaceOnce('src/ui/fight-tabletop-screen.js', '<button type="button" data-fight-attack ${attackerId && weaponId && targetId ? \'\' : \'disabled\'}>Record weapon attack →</button><p>Record another weapon or target within this activation as needed.</p>', '<button type="button" data-fight-attack ${attackerId && weaponId && targetId ? \'\' : \'disabled\'}>Record weapon attack →</button>', 'fight repeat instruction');

// Live map status language: compact objective labels and Battle-shock marker treatment.
replaceOnce('src/ui/battlefield-map.js', "import { attachmentParent } from '../rules/event-preparation.js';", "import { attachmentParent } from '../rules/event-preparation.js';\nimport { isUnitBattleShocked } from '../rules/unit-status-summary.js';", 'battle shock import');
replaceOnce(
  'src/ui/battlefield-map.js',
`  if (name === "Central 2") return "Center 2";
  return name;
}

function objectiveControlClass`,
`  if (name === "Central 2") return "Center 2";
  return name;
}
function compactObjectiveLabel(label) {
  return ({
    "My Home": "MY HOME",
    "Opponent Home": "OPP HOME",
    "My Expansion": "MY EXP",
    "Opponent Expansion": "OPP EXP",
    "Center 1": "C1",
    "Center 2": "C2"
  })[label] ?? label;
}

function objectiveControlClass`,
  'compact objective helper'
);
replaceOnce('src/ui/battlefield-map.js', '    const modelCount = Array.isArray(unit.models) ? unit.models.length : 0; const isSelected = unit.id === selectedUnitId;', '    const modelCount = Array.isArray(unit.models) ? unit.models.length : 0; const isSelected = unit.id === selectedUnitId; const battleShocked = isUnitBattleShocked(unit);', 'battle shock marker state');
replaceOnce('src/ui/battlefield-map.js', "(unplaced ? ' is-unplaced' : '') + '\" data-map-unit-id=\"'", "(unplaced ? ' is-unplaced' : '') + (battleShocked ? ' is-battle-shocked' : '') + '\" data-map-unit-id=\"'", 'battle shock marker class');
replaceOnce('src/ui/battlefield-map.js', "(unplaced ? ' · not placed' : '') + (modelCount ? ' · ' + modelCount + ' models' : '')", "(unplaced ? ' · not placed' : '') + (battleShocked ? ' · Battle-shocked' : '') + (modelCount ? ' · ' + modelCount + ' models' : '')", 'battle shock marker title');
replaceOnce('src/ui/battlefield-map.js', '    const label = perspectiveObjectiveName(name, safeState, perspectivePlayerId);\n    const controlClass', '    const label = perspectiveObjectiveName(name, safeState, perspectivePlayerId);\n    const displayLabel = mode === "live" ? compactObjectiveLabel(label) : label;\n    const controlClass', 'compact live objective label');
replaceOnce('src/ui/battlefield-map.js', "+ escapeHtml(label) + '</button>';", "+ escapeHtml(displayLabel) + '</button>';", 'live objective display text');

// Shared tablet styling overrides. These are intentionally presentation-only.
fs.appendFileSync('src/ui/styles/prototype-workspace.css', `

/* Tabletop optimization pass: one-row HUD, map-first workspace, compact dock and context panels. */
.battle-shell.is-tabletop-experiment .prototype-workspace-tools{
  min-height:40px;height:40px;display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:6px;padding:0;
}
.tabletop-live-strip{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap}
.tabletop-live-round,.tabletop-live-phase{font-weight:850;text-transform:uppercase;letter-spacing:.04em}
.tabletop-live-phase{color:#a7b7ba;font-size:12px;margin-right:2px}
.tabletop-live-player{display:flex;align-items:center;gap:3px;min-width:0;padding:2px 5px;border:1px solid #304149;border-radius:8px;background:#152128}
.tabletop-live-player.is-active{border-color:#c4e99b}
.tabletop-live-player strong{font-size:12px;max-width:90px;overflow:hidden;text-overflow:ellipsis}
.tabletop-live-player button{min-height:28px!important;padding:2px 5px!important;border:0!important;background:transparent!important;font-size:11px!important;color:inherit!important}
.tabletop-live-player button:active{background:#2a3b43!important}
.prototype-phase-menu{position:relative}
.prototype-phase-menu>summary{list-style:none;cursor:pointer;min-height:34px;display:flex;align-items:center;padding:0 10px;border:1px solid #53676a;border-radius:9px;background:#19262d;font-size:12px}
.prototype-phase-menu>summary::-webkit-details-marker{display:none}
.prototype-phase-menu>div{position:absolute;right:0;top:38px;z-index:1200;display:grid;grid-template-columns:repeat(5,auto);gap:4px;padding:6px;border:1px solid #53676a;border-radius:9px;background:#10191f;box-shadow:0 12px 30px #0008}
.prototype-phase-menu button{min-height:36px!important;padding:5px 8px!important;font-size:11px!important}
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop,
.battle-shell.is-tabletop-experiment .combat-workspace{grid-template-columns:minmax(0,2.55fr) minmax(290px,1fr);gap:8px}
.battle-shell.is-tabletop-experiment .combat-workspace__map{padding:3px;overflow:hidden}
.battle-shell.is-tabletop-experiment .combat-workspace__map .live-map{height:100%;min-height:0}
.battle-shell.is-tabletop-experiment .combat-workspace__map .battlefield-map__board{min-height:0}
.battle-shell.is-tabletop-experiment .combat-workspace__scroll{padding:9px}
.battle-shell.is-tabletop-experiment .combat-workspace__panel footer{padding:6px 8px}
.battle-shell.is-tabletop-experiment .battle-shell__army-dock{gap:6px;padding:5px 8px;min-height:44px}
.battle-shell.is-tabletop-experiment .battle-shell__army-dock button{min-height:34px!important;padding:5px 10px!important;border-radius:8px;justify-content:center;font-size:12px}
.battle-shell.is-tabletop-experiment[data-battle-focus=true]{padding-bottom:calc(52px + env(safe-area-inset-bottom,0px))}
.battle-shell.is-tabletop-experiment .battle-shell__player-summary{display:flex;align-items:center;gap:6px;padding:7px 10px}
.battle-shell.is-tabletop-experiment .battle-shell__player-summary>strong{margin-right:auto}
.battle-shell.is-tabletop-experiment .battle-shell__summary-value,
.battle-shell.is-tabletop-experiment .battle-shell__summary-time{min-height:34px;padding:4px 8px;border:1px solid #42555f;border-radius:7px;background:#111c22;color:inherit;font:inherit;font-weight:750}
.battle-shell.is-tabletop-experiment .battle-shell__player-summary.is-active .battle-shell__summary-value,
.battle-shell.is-tabletop-experiment .battle-shell__player-summary.is-active .battle-shell__summary-time{background:#d8f3b8;color:#17212b;border-color:#9ebd7d}
.battle-mission-summary__active-names{min-width:0;max-width:72%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
.battle-shell.is-tabletop-experiment .battle-mission-summary__section>summary{gap:8px;padding:5px 10px;min-height:38px}
.battle-shell.is-tabletop-experiment .live-map .battlefield-map__unit.is-battle-shocked{background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.14) 0 4px,transparent 4px 8px);border-style:dashed}
.battle-shell.is-tabletop-experiment .live-map .battlefield-map__objective{min-width:28px;max-width:64px;min-height:18px;padding:2px 4px;font-size:7px}
.battle-shell.is-tabletop-experiment .move-editor h2,
.battle-shell.is-tabletop-experiment .combat-workspace__scroll>h1{margin:0 0 6px;font-size:20px}
.battle-shell.is-tabletop-experiment .move-editor__status{margin:4px 0 8px}
.battle-shell.is-tabletop-experiment .move-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.battle-shell.is-tabletop-experiment .move-actions .advance-choice{grid-column:1/-1;margin:0}
.battle-shell.is-tabletop-experiment .move-actions button{min-height:42px}
.command-screen--tabletop>header{padding:0 0 7px;margin:0;border:0}
.command-screen--tabletop .command-kicker,.command-screen--tabletop>header p{display:none}
.command-screen--tabletop .command-points{padding:4px 8px}
.command-screen--tabletop .command-tabletop-section{margin:6px 0;border:1px solid #304149;border-radius:9px;padding:0 8px}
.command-screen--tabletop .command-tabletop-section>summary{min-height:40px;display:flex;align-items:center;font-weight:800;cursor:pointer}
.command-screen--tabletop .command-secondary-missions,.command-screen--tabletop .command-checkpoint-review{margin:4px 0;padding:6px}
.fight-order{margin:4px 0 8px}
.fight-order>summary{font-weight:850}
.fight-order h3{margin:8px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a7b7ba}
.fight-order .combat-workspace__choices{display:flex;flex-wrap:wrap;gap:5px}
.fight-order__unit{min-height:38px!important;padding:6px 9px!important;font-weight:850}
.fight-order__unit.is-friendly{color:#a8d4ff!important;border-color:#79bbff!important;background:#213f60!important}
.fight-order__unit.is-opponent{color:#ffd0d0!important;border-color:#ff8585!important;background:#602e34!important}
.fight-order__unit[aria-pressed="true"]{outline:2px solid #c4e99b;outline-offset:1px}
@media (orientation:landscape) and (min-width:761px){
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .prototype-workspace-tools{flex:none}
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .battle-shell__workspace{min-height:0}
  .battle-shell.is-tabletop-experiment[data-battle-focus=true] .combat-workspace__map .battlefield-map__board{height:calc(100% - 24px);aspect-ratio:auto}
}
`);

fs.appendFileSync('src/ui/styles/shooting-panel.css', `

/* Target comparison stays visible first; selected-target detail expands below it. */
.battle-shell.is-tabletop-experiment .shoot-tabletop__target-comparisons{display:grid;gap:4px;margin-top:5px}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;min-height:42px;padding:5px 7px}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison>span:first-child{min-width:0}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison strong{font-size:12px}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison small{font-size:9px;line-height:1.1}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison-stats{display:grid;grid-template-columns:repeat(3,auto);gap:2px 5px;text-align:center}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison-stats b{font-size:11px}
.battle-shell.is-tabletop-experiment .shoot-tabletop__comparison-stats small{grid-row:2}
.battle-shell.is-tabletop-experiment .shoot-tabletop__selected-target{margin-top:6px;border-top:1px solid #465840}
`);

// Focused regression checks for the optimized Tabletop presentation.
fs.writeFileSync('tests/ui/tabletop-optimization-pass.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Tabletop HUD exposes compact scores, phases, Review and separate timer controls', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.match(src, /tabletop-live-strip/);
  assert.match(src, /data-open-score-adjust-kind="vp"/);
  assert.match(src, /data-open-score-adjust-kind="cp"/);
  assert.match(src, /data-toggle-turn-clock/);
  assert.match(src, /<summary>Phases<\/summary>/);
  assert.match(src, /focus \? 'Review' : 'Tabletop'/);
});

test('shared Tabletop maps omit repeated banners and zoom controls', () => {
  const src = read('src/ui/combat-workspace.js');
  assert.doesNotMatch(src, /Battlefield · \$\{phase/);
  assert.match(src, /showZoomControls: false/);
});

test('mission bars expose current mission names while closed', () => {
  const src = read('src/ui/mission-summary-panel.js');
  assert.match(src, /battle-mission-summary__active-names/);
  assert.match(src, /mySecondaryNames\.join/);
  assert.match(src, /primary\.myName/);
});

test('live map has compact objective labels and Battle-shock status styling', () => {
  const src = read('src/ui/battlefield-map.js');
  assert.match(src, /compactObjectiveLabel/);
  assert.match(src, /is-battle-shocked/);
  const css = read('src/ui/styles/prototype-workspace.css');
  assert.match(css, /repeating-linear-gradient/);
});

test('Shooting presents target comparison before selected-target detail', () => {
  const src = read('src/ui/shooting-screen.js');
  const compare = src.indexOf('shoot-tabletop__target-comparisons');
  const detail = src.indexOf('shoot-tabletop__selected-target');
  assert.ok(compare >= 0 && detail > compare);
  assert.doesNotMatch(src, /data-choice-not-shoot>Skip<\/button>/);
});

test('Movement, Command and Fight use compact action-first controls', () => {
  assert.match(read('src/ui/movement-screen.js'), /data-move-stationary>Did Not Move<\/button>/);
  assert.match(read('src/ui/command-screen.js'), /command-tabletop-section/);
  assert.match(read('src/ui/fight-tabletop-screen.js'), /fight-order__unit/);
});
`);
