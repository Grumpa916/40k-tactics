import fs from 'node:fs';

function replaceOnce(path,before,after,label){let text=fs.readFileSync(path,'utf8');if(!text.includes(before))throw new Error(`${label}: source not found`);fs.writeFileSync(path,text.replace(before,after));}

// Compact deployment unit rows to one line each.
fs.appendFileSync('src/ui/styles/deploy-begin.css', `

/* Compact deployment roster: one line per unit on iPad landscape. */
@media (orientation:landscape) and (min-width:761px) {
  .deploy-unit-list { gap:4px; }
  .deploy-unit-row { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:5px; padding:4px 5px; }
  .deploy-unit-row > button { min-height:36px; padding:4px 6px; flex-direction:row; align-items:center; gap:6px; overflow:hidden; }
  .deploy-unit-row > button strong { flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .deploy-unit-row > button small { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; }
  .deploy-unit-row > div { display:flex; gap:4px; }
  .deploy-unit-row > div button { min-height:36px; padding:4px 7px; font-size:11px; }
  .deploy-reserve-tray { max-height:92px; }
  .deploy-reserve-tray button { min-height:34px; padding:4px 7px; flex-direction:row; align-items:center; gap:5px; }
  .deploy-reserve-tray button small { display:inline; }
}
`);

// Remove the crossed-out Movement instructions from the phase side panel.
replaceOnce('src/ui/movement-screen.js',
`        controls:\`<div class="movement-screen"><h1>Movement</h1><p>Drag an active player's marker to refine its approximate position. The first drag records a Normal Move unless another movement choice was recorded first. Later drags only refine map position.</p>${errorMessage ? \`<p class="move-error" role="alert">${escapeHtml(errorMessage)}</p>\` : ''}${editor}<details><summary>Select another unit · ${eligible.length} units</summary><div class="move-units">${unitCards}</div></details></div>\`,footer:'<small>Use End Movement above when tabletop movement is complete.</small>'});`,
`        controls:\`<div class="movement-screen">${errorMessage ? \`<p class="move-error" role="alert">${escapeHtml(errorMessage)}</p>\` : ''}${editor}<details><summary>Select another unit · ${eligible.length} units</summary><div class="move-units">${unitCards}</div></details></div>\`,footer:'<small>Use End Movement above when tabletop movement is complete.</small>'});`,
'movement side-panel intro');

// Make Command secondary controls fit within the narrow phase panel; maximize Shooting map.
fs.appendFileSync('src/ui/styles/prototype-workspace.css', `

/* iPad phase-panel fit and Shooting map refinements. */
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-screen--tabletop,
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form { min-width:0; width:100%; }
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form { display:grid !important; grid-template-columns:minmax(0,1fr) !important; gap:7px !important; }
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form label,
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form select,
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form button { min-width:0 !important; max-width:100% !important; width:100% !important; box-sizing:border-box; }
.battle-shell.is-tabletop-experiment .combat-workspace[data-combat-phase=command] .command-vp-form select { overflow:hidden; text-overflow:ellipsis; }

.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .combat-workspace__map > header,
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .combat-workspace__map > p,
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .live-map > nav { display:none !important; }
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .combat-workspace__map { padding:4px !important; }
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .live-map { height:100%; min-height:0; }
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .battlefield-map { height:100%; min-height:0; }
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .battlefield-map__board { min-height:0 !important; height:100% !important; max-height:none !important; }
.battle-shell.is-tabletop-experiment .shoot-screen--tabletop .battlefield-map__legend { margin:2px 0 0 !important; padding:2px 0 !important; }
`);

// Correct Command checkpoint Primary rendering and explicitly present scoring due now.
replaceOnce('src/ui/scoring-checkpoint-review.js',
`    const missions=[...group.review.primary,...group.review.secondary];
    const actions=getMissionActionReviews(state,{playerId:group.playerId,checkpoint:group.checkpoint});
    return \`<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${group.primaryReference?\`<p>Primary: <strong>${esc(group.primaryReference)}</strong> · check the printed card's timing and conditions.</p>\`:''}
      ${missions.map(mission=>\`<details><summary>${esc(mission.definitionName??mission.definitionId)}</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card.</p>':''}
        ${(mission.result.scoringWindows??[]).flatMap(window=>(window.tiers??[]).map(tier=>\`<p>${esc(tier.vp)} VP · ${esc(tier.summary)}</p>\`)).join('')}
        ${(mission.result.referenceNotes??[]).map(note=>\`<p>${esc(note)}</p>\`).join('')}
      </details>\`).join('')||'<p>No configured mission scoring windows are due.</p>'}`, 
`    const missions=[...group.review.primary,...group.review.secondary];
    const actions=getMissionActionReviews(state,{playerId:group.playerId,checkpoint:group.checkpoint});
    const primaryName=typeof group.primaryReference==='string'?group.primaryReference:(group.primaryReference?.name??group.primaryReference?.title??null);
    const primaryWindows=group.primaryScoringWindows??[];
    const primaryDue=primaryName&&primaryWindows.length?\`<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · score now</summary>${primaryWindows.map(window=>\`<p><strong>${esc(window.when)}</strong></p>${(window.items??[]).map(item=>\`<p>${esc(item.vp)} VP · ${esc(item.summary)}</p>\`).join('')}\`).join('')}</details>\`:'';
    const secondaryDue=missions.map(mission=>\`<details open class="checkpoint-mission"><summary>${esc(mission.definitionName??mission.definitionId)} · score now</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card.</p>':''}
        ${(mission.result.scoringWindows??[]).flatMap(window=>(window.tiers??[]).map(tier=>\`<p>${esc(tier.vp)} VP · ${esc(tier.summary)}</p>\`)).join('')}
        ${(mission.result.referenceNotes??[]).map(note=>\`<p>${esc(note)}</p>\`).join('')}
      </details>\`).join('');
    return \`<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${primaryDue}${secondaryDue}${!primaryDue&&!secondaryDue?'<p>No Primary or Secondary mission scores are due at this checkpoint.</p>':''}`,
'checkpoint due scoring');

// Remove generic text that duplicates the specific due-now list.
replaceOnce('src/ui/scoring-checkpoint-dialog.js',
`    '<p>' + escapeHtml(scoringReminder.label) + '. Check any Primary or Secondary mission due now.</p>' +`,
`    '<p>' + escapeHtml(scoringReminder.label) + '. Record any Primary or Secondary score shown below before continuing.</p>' +`,
'scoring dialog prompt');

// Mark selected-target state and auto-scroll the right panel to Tactical Advisor.
replaceOnce('src/ui/shooting-screen.js',
`      container.innerHTML = \`<main class="shoot-screen shoot-screen--tabletop">`,
`      container.innerHTML = \`<main class="shoot-screen shoot-screen--tabletop${selectedTargetId ? ' is-target-selected' : ''}">`,
'shooting selected-target class');
replaceOnce('src/ui/shooting-screen.js',
`      container.querySelectorAll?.("[data-advisor-target]").forEach((button) => button.addEventListener?.("click", () => {
        selectedTargetId = button.getAttribute?.("data-advisor-target") || null;
        attackError = "";
        render();
      }));`,
`      container.querySelectorAll?.("[data-advisor-target]").forEach((button) => button.addEventListener?.("click", () => {
        selectedTargetId = button.getAttribute?.("data-advisor-target") || null;
        attackError = "";
        render();
      }));
      if (selectedTargetId) {
        const scroll = container.querySelector?.('.shoot-tabletop__control-scroll');
        const advisor = container.querySelector?.('.shoot-tabletop__advisor');
        if (scroll && advisor) scroll.scrollTop = Math.max(0, advisor.offsetTop - 8);
      }`,
'shooting advisor auto-scroll');

fs.writeFileSync('tests/ui/ipad-phase-layout-scoring.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('movement tabletop panel omits duplicated instructional heading text',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/movement-screen.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/controls:\\`<div class="movement-screen"><h1>Movement<\\/h1><p>Drag an active player/);
});

test('shooting tabletop view auto-scrolls Tactical Advisor after target selection',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
 assert.match(src,/shoot-tabletop__advisor/);
 assert.match(src,/scroll\.scrollTop = Math\.max\(0, advisor\.offsetTop - 8\)/);
});

test('checkpoint rendering names Primary missions and shows due windows',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/scoring-checkpoint-review.js',import.meta.url),'utf8');
 assert.match(src,/primaryReference\?\.name/);
 assert.match(src,/primaryScoringWindows/);
 assert.match(src,/score now/);
});

test('tablet CSS compacts deployment rows and hides shooting map chrome',()=>{
 const deploy=fs.readFileSync(new URL('../../src/ui/styles/deploy-begin.css',import.meta.url),'utf8');
 const proto=fs.readFileSync(new URL('../../src/ui/styles/prototype-workspace.css',import.meta.url),'utf8');
 assert.match(deploy,/grid-template-columns:minmax\(0,1fr\) auto/);
 assert.match(proto,/shoot-screen--tabletop \.live-map > nav/);
 assert.match(proto,/command-vp-form/);
});
`);
