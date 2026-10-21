import fs from 'node:fs';

function replaceOnce(path, oldText, newText, label) {
  const source = fs.readFileSync(path, 'utf8');
  const count = source.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  fs.writeFileSync(path, source.replace(oldText, newText));
}

replaceOnce('src/ui/army-unit-summary.js',
`  return \`<button type="button" class="prototype-roster-row" data-open-unit-details="\${esc(unit.id)}"><strong>\${esc(unit.name ?? unit.id)}\${Number.isFinite(unit.points ?? unit.metadata?.points) ? \`<small>\${esc(unit.points ?? unit.metadata.points)} pts</small>\` : ''}</strong><span class="prototype-unit-stats">\${stats.map(([key,val])=>\`<span><small>\${key}</small><b>\${esc(val)}</b></span>\`).join('')}</span><span class="prototype-roster-spacer"></span><span class="prototype-counter"\${!strength.known ? ' title="Model count not fully tracked"' : ''}><small>MODELS</small><b>\${esc(models)}</b></span><span class="prototype-counter"><small>WOUNDS</small><b>\${esc(unit.wounds ?? '—')}</b></span><span class="prototype-unit-status">\${esc(status)} ↗</span></button>\`;
`,
`  const shocked = isUnitBattleShocked(unit);
  return \`<div class="prototype-roster-row"><button type="button" class="prototype-roster-main" data-open-unit-details="\${esc(unit.id)}"><strong>\${esc(unit.name ?? unit.id)}\${Number.isFinite(unit.points ?? unit.metadata?.points) ? \`<small>\${esc(unit.points ?? unit.metadata.points)} pts</small>\` : ''}</strong><span class="prototype-unit-stats">\${stats.map(([key,val])=>\`<span><small>\${key}</small><b>\${esc(val)}</b></span>\`).join('')}</span><span class="prototype-roster-spacer"></span><span class="prototype-counter"\${!strength.known ? ' title="Model count not fully tracked"' : ''}><small>MODELS</small><b>\${esc(models)}</b></span><span class="prototype-counter"><small>WOUNDS</small><b>\${esc(unit.wounds ?? '—')}</b></span><span class="prototype-unit-status">\${esc(status)} ↗</span></button><button type="button" class="prototype-battleshock-toggle" data-manual-battle-shock="\${esc(unit.id)}" aria-pressed="\${shocked}">\${shocked ? 'Clear Battle-shock' : '+ Battle-shock'}</button></div>\`;
`, 'army roster Battle-shock control');

replaceOnce('src/ui/battle-context-panels.js',
`  const unit = getArmyUnitReference(state, original);
  const shocked = isUnitBattleShocked(unit);
  // The weapon and ability reference renderers accept embedded datasheet data.`,
`  const unit = getArmyUnitReference(state, original);
  // The weapon and ability reference renderers accept embedded datasheet data.`, 'detail shocked variable');
replaceOnce('src/ui/battle-context-panels.js',
`    '<p>' + (Number.isFinite(unit.points ?? unit.metadata?.points) ? escapeHtml(unit.points ?? unit.metadata.points) + ' pts · ' : '') + escapeHtml(unit.status) + ' · ' + escapeHtml(unit.wounds ?? '—') + ' Wounds remaining</p>' +
    '<button type="button" data-manual-battle-shock="' + escapeHtml(unit.id) + '" aria-pressed="' + shocked + '">' + (shocked ? 'Clear Battle-shock' : '+ Battle-shock') + '</button><p data-army-status role="status"></p>' +
    '<h3>Characteristics</h3>'`,
`    '<p>' + (Number.isFinite(unit.points ?? unit.metadata?.points) ? escapeHtml(unit.points ?? unit.metadata.points) + ' pts · ' : '') + escapeHtml(unit.status) + ' · ' + escapeHtml(unit.wounds ?? '—') + ' Wounds remaining</p>' +
    '<h3>Characteristics</h3>'`, 'remove detail Battle-shock control');

replaceOnce('src/ui/battle-setup-screen.js',
`        '<h3>Choose battlefield layout</h3><div role="group" aria-label="Battlefield layout choices">' +
        layoutOptions.layouts.map((item) => '<button type="button" data-event-companion-layout="' + item.layout + '" aria-pressed="' +
          (item.layout === missionSetup.layout ? 'true' : 'false') + '"' +
          (state.battle && state.battle.status !== "setup" ? " disabled" : "") + '>Layout ' + item.layout +
          ' · p. ' + item.page + (item.layout === missionSetup.layout ? ' — Selected' : '') + '</button>').join("") +
        '</div><p>Source pages refer to the official Event Companion. The map shows the verified terrain footprints, deployment zones, and objective locations for the selected layout.</p>' +
        renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id, selectedUnitId: selectedPlanUnitId, showUnits: false }) +
        '</div>'`,
`        '<h3>Choose battlefield layout</h3><p class="event-companion-layout-hint">Compare all three layouts at a glance, then tap the layout you want to use.</p>' +
        '<div class="event-companion-layout-previews" role="group" aria-label="Battlefield layout choices">' +
        layoutOptions.layouts.map((item) => {
          const previewState = { ...state, battlefieldMap: { ...(state.battlefieldMap ?? {}), missionSetup: { ...missionSetup, layout: item.layout } } };
          return '<article class="event-companion-layout-preview' + (item.layout === missionSetup.layout ? ' is-selected' : '') + '">' +
            '<button type="button" class="event-companion-layout-select" data-event-companion-layout="' + item.layout + '" aria-pressed="' +
            (item.layout === missionSetup.layout ? 'true' : 'false') + '"' +
            (state.battle && state.battle.status !== "setup" ? " disabled" : "") + '>Layout ' + item.layout + ' · p. ' + item.page +
            (item.layout === missionSetup.layout ? ' — Selected' : '') + '</button>' +
            '<div class="event-companion-layout-thumbnail" aria-hidden="true">' +
            renderBattlefieldMap(previewState, { mode: "planning", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id, selectedUnitId: null, showUnits: false }) +
            '</div></article>';
        }).join("") +
        '</div><p>Source pages refer to the official Event Companion. These previews keep the battlefield proportions while reducing each map to a quick comparison view.</p>' +
        '</div>'`, 'three layout previews');

fs.appendFileSync('src/ui/styles/prototype-workspace.css', `

/* Army-row Battle-shock control: status changes stay on the roster overview. */
.prototype-roster-row { grid-template-columns:minmax(0,1fr) auto; gap:10px; cursor:default; }
.prototype-roster-main { display:grid; grid-template-columns:minmax(150px,1fr) 280px minmax(0,.5fr) 65px 65px 130px; align-items:center; gap:12px; width:100%; min-height:48px; padding:0; background:transparent; color:inherit; border:0; font:inherit; text-align:left; cursor:pointer; }
.prototype-battleshock-toggle { min-width:126px; min-height:44px; padding:8px 10px; border:1px solid #53676a; border-radius:9px; background:#24343c; color:#f1f3e9; font:inherit; touch-action:manipulation; }
.prototype-battleshock-toggle[aria-pressed="true"] { border-color:#d98787; color:#ffd1d1; }
.prototype-roster-main:focus-visible,.prototype-battleshock-toggle:focus-visible { outline:2px solid #c4e99b; outline-offset:2px; }
@media (max-width:950px) { .prototype-roster-main { grid-template-columns:minmax(130px,1fr) 250px 60px 60px 100px; gap:6px; } .prototype-roster-main .prototype-roster-spacer { display:none; } }
@media (max-width:760px), (orientation:portrait) { .prototype-roster-row { grid-template-columns:1fr; } .prototype-roster-main { grid-template-columns:1fr auto auto; } .prototype-roster-main > strong,.prototype-roster-main .prototype-unit-stats { grid-column:1/-1; } .prototype-battleshock-toggle { width:100%; } }

.event-companion-layout-previews { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; align-items:start; margin:8px 0 14px; }
.event-companion-layout-preview { min-width:0; padding:8px; border:1px solid #43535c; border-radius:10px; background:#121d23; }
.event-companion-layout-preview.is-selected { border-color:#c4e99b; box-shadow:0 0 0 1px #c4e99b inset; }
.event-companion-layout-select { width:100%; min-height:42px; margin-bottom:7px; }
.event-companion-layout-thumbnail { pointer-events:none; overflow:hidden; }
.event-companion-layout-thumbnail [data-battlefield-map] { width:100%; margin:0; }
.event-companion-layout-thumbnail .battlefield-map__toolbar,.event-companion-layout-thumbnail .battlefield-map__legend,.event-companion-layout-thumbnail .battlefield-map__notice,.event-companion-layout-thumbnail [data-map-unit-list] { display:none !important; }
.event-companion-layout-thumbnail .battlefield-map__board { width:100%; height:auto !important; min-height:0 !important; max-height:none !important; aspect-ratio:15/11; }
@media (max-width:760px), (orientation:portrait) { .event-companion-layout-previews { grid-template-columns:1fr; } }
`);

replaceOnce('tests/ui/prototype-interface-restoration.test.js',
`  const detail=renderArmyUnitDialog(initial,'shooter');
  assert.match(detail,/Monstrous bonesword/);
  assert.match(detail,/Shadow in the Warp/);
  assert.match(detail,/data-manual-battle-shock="shooter"/);
  assert.doesNotMatch(renderArmyRosterOverlay(initial,'p2'),/undefined\\/undefined/);`,
`  const detail=renderArmyUnitDialog(initial,'shooter');
  assert.match(detail,/Monstrous bonesword/);
  assert.match(detail,/Shadow in the Warp/);
  assert.doesNotMatch(detail,/data-manual-battle-shock="shooter"/);
  assert.match(renderArmyRosterOverlay(initial,'p1'),/data-manual-battle-shock="shooter"/);
  assert.doesNotMatch(renderArmyRosterOverlay(initial,'p2'),/undefined\\/undefined/);`, 'Battle-shock control test location');
