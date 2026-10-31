import { execSync } from 'node:child_process';
import fs from 'node:fs';

function run(command, { allowFailure = false, stdio = 'pipe' } = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'] }) ?? '';
  } catch (error) {
    if (allowFailure) {
      const stdout = error.stdout?.toString?.() ?? '';
      const stderr = error.stderr?.toString?.() ?? '';
      return `${stdout}${stderr}`;
    }
    throw error;
  }
}

function replaceRequired(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`Missing merge marker: ${label}`);
  return text.replace(search, replacement);
}

function insertBeforeInSection(text, sectionStart, marker, insertion, label) {
  const sectionIndex = text.indexOf(sectionStart);
  if (sectionIndex < 0) throw new Error(`Missing section: ${label}`);
  const markerIndex = text.indexOf(marker, sectionIndex);
  if (markerIndex < 0) throw new Error(`Missing section marker: ${label}`);
  return text.slice(0, markerIndex) + insertion + text.slice(markerIndex);
}

function write(path, transform) {
  const current = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, transform(current));
}

run('git fetch --unshallow origin', { allowFailure: true });
run('git fetch origin main');
run('git config user.name "Grumpa916"');
run('git config user.email "gonogono@gmail.com"');
console.log(`MERGE_BASE ${run('git merge-base HEAD origin/main').trim()}`);

const mergeOutput = run('git merge --no-commit --no-ff origin/main', { allowFailure: true });
console.log(mergeOutput);

const conflicts = run('git diff --name-only --diff-filter=U').trim().split(/\r?\n/).filter(Boolean);
const expected = new Set([
  'src/engine/shooting-transitions.js',
  'src/rules/tactical-movement-router.js',
  'src/rules/tactical-primary-strategy-router.js',
  'src/ui/mission-action-picker.js'
]);
for (const path of conflicts) {
  if (!expected.has(path)) throw new Error(`Unexpected merge conflict: ${path}`);
}
for (const path of expected) {
  if (!conflicts.includes(path)) console.log(`No conflict remains for ${path}; preserving merged result.`);
}

if (conflicts.includes('src/engine/shooting-transitions.js')) {
  run('git checkout --theirs -- src/engine/shooting-transitions.js');
  write('src/engine/shooting-transitions.js', (text) => {
    text = replaceRequired(
      text,
      'import { getVanguardOperationTerrainOptions, getVanguardOperationState } from "../rules/vanguard-operation-state.js";\n',
      'import { getVanguardOperationTerrainOptions, getVanguardOperationState } from "../rules/vanguard-operation-state.js";\nimport { getSabotageObjectiveOptions } from "../rules/sabotage-state.js";\n',
      'shooting Sabotage import'
    );
    text = replaceRequired(
      text,
      '    if (linkedMission.definitionId === "primary-extract-relic") {',
      '    if (linkedMission.definitionId === "primary-sabotage") {\n      if (reviewTiming !== "end-of-turn") throw new Error("Sabotage completes at the end of your turn.");\n      if (!objectiveId || !getSabotageObjectiveOptions(state, { playerId: activePlayerId }).some(item => item.objectiveId === objectiveId)) {\n        throw new Error("Select a different non-home objective that has not already been selected for another Sabotage attempt this turn.");\n      }\n    }\n    if (linkedMission.definitionId === "primary-extract-relic") {',
      'shooting Sabotage validation'
    );
    return text;
  });
}

if (conflicts.includes('src/rules/tactical-movement-router.js')) {
  run('git checkout --theirs -- src/rules/tactical-movement-router.js');
  write('src/rules/tactical-movement-router.js', (text) => {
    text = replaceRequired(
      text,
      'import { enhanceVanguardOperationMovementRecommendations } from "./tactical-vanguard-operation-movement.js";\n',
      'import { enhanceVanguardOperationMovementRecommendations } from "./tactical-vanguard-operation-movement.js";\nimport { isSabotageMissionForPlayer } from "./sabotage-state.js";\nimport { enhanceSabotageMovementRecommendations } from "./tactical-sabotage-movement.js";\n',
      'movement Sabotage imports'
    );
    text = replaceRequired(
      text,
      '  if (isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId)) {\n    return enhanceVanguardOperationMovementRecommendations(state, base, { playerId, perspectivePlayerId });\n  }\n\n  return base;',
      '  if (isVanguardOperationMissionForPlayer(state, playerId, perspectivePlayerId)) {\n    return enhanceVanguardOperationMovementRecommendations(state, base, { playerId, perspectivePlayerId });\n  }\n\n  if (isSabotageMissionForPlayer(state, playerId, perspectivePlayerId)) {\n    return enhanceSabotageMovementRecommendations(state, base, { playerId, perspectivePlayerId });\n  }\n\n  return base;',
      'movement Sabotage route'
    );
    return text;
  });
}

if (conflicts.includes('src/rules/tactical-primary-strategy-router.js')) {
  run('git checkout --ours -- src/rules/tactical-primary-strategy-router.js');
}

if (conflicts.includes('src/ui/mission-action-picker.js')) {
  run('git checkout --theirs -- src/ui/mission-action-picker.js');
  write('src/ui/mission-action-picker.js', (text) => {
    text = replaceRequired(
      text,
      "import { getVanguardOperationTerrainOptions } from '../rules/vanguard-operation-state.js';\n",
      "import { getVanguardOperationTerrainOptions } from '../rules/vanguard-operation-state.js';\nimport { getSabotageObjectiveOptions } from '../rules/sabotage-state.js';\n",
      'picker Sabotage import'
    );
    text = text.replace(/^(\s*)const isVanguardOperation=option\?\.definitionId==='primary-vanguard-operation';$/gm,
      (_, indent) => `${indent}const isVanguardOperation=option?.definitionId==='primary-vanguard-operation';\n${indent}const isSabotage=option?.definitionId==='primary-sabotage';`);
    text = replaceRequired(
      text,
      '      const vanguardTerrain=isVanguardOperation ? getVanguardOperationTerrainOptions(state,{playerId}) : [];\n',
      '      const vanguardTerrain=isVanguardOperation ? getVanguardOperationTerrainOptions(state,{playerId}) : [];\n      const sabotageObjectives=isSabotage ? getSabotageObjectiveOptions(state,{playerId}) : [];\n',
      'picker Sabotage objective options'
    );
    text = replaceRequired(
      text,
      "      if (isVanguardOperation && terrainArea && !vanguardTerrain.some(item=>item.terrainAreaId===terrainArea)) terrainArea='';\n",
      "      if (isVanguardOperation && terrainArea && !vanguardTerrain.some(item=>item.terrainAreaId===terrainArea)) terrainArea='';\n      if (isSabotage && objective && !sabotageObjectives.some(item=>item.objectiveId===objective)) objective='';\n",
      'picker Sabotage selection validation'
    );
    text = insertBeforeInSection(
      text,
      '      const targetControl=setupMode',
      ': isLocateAndDeny',
      ': isSabotage\n                            ? `<label class="mission-action-picker__field"><span>Objective to Sabotage</span><select data-action-objective><option value="">Choose eligible objective…</option>${sabotageObjectives.map(item=>`<option value="${esc(item.objectiveId)}" ${item.objectiveId===objective?\'selected\':\'\'}>${esc(item.name)} · ${item.enemyTerritory?\'enemy territory · \':item.territoryUncertain?\'territory uncertain · \':\'\'}${item.potentialVp} VP</option>`).join(\'\')}</select><small>Your home objective and objectives already selected by another Sabotage attempt this turn are hidden. Confirm this unit is within range on the physical tabletop.</small></label>`\n                            ',
      'picker Sabotage target control'
    );
    text = insertBeforeInSection(
      text,
      '      const completionNote=locateSetupMode',
      ': isLocateAndDeny',
      ': isSabotage\n                              ? \'<p class="mission-action-picker__note">Sabotage is unlimited, but each unit starting it this phase must use a different non-home objective. At end of turn, confirm completion only if the selected objective is controlled. Each completed Action is 3 VP, plus 2 VP when the completing unit is at an objective in the opponent’s territory.</p>\'\n                              ',
      'picker Sabotage completion note'
    );
    text = replaceRequired(
      text,
      ': isExtractRelic ? !!objective && !!terrainArea : isVanguardOperation ? !!terrainArea : isLocateAndDeny',
      ': isExtractRelic ? !!objective && !!terrainArea : isVanguardOperation ? !!terrainArea : isSabotage ? !!objective : isLocateAndDeny',
      'picker Sabotage target ready'
    );
    text = replaceRequired(
      text,
      '||(isExtractRelic&&(!objective||!terrainArea))||(isVanguardOperation&&!terrainArea)||(isLocateAndDeny',
      '||(isExtractRelic&&(!objective||!terrainArea))||(isVanguardOperation&&!terrainArea)||(isSabotage&&!objective)||(isLocateAndDeny',
      'picker Sabotage submit guard'
    );
    return text;
  });
}

run('git add src/engine/shooting-transitions.js src/rules/mission-action-state.js src/rules/tactical-movement-router.js src/rules/tactical-primary-strategy-router.js src/ui/mission-action-picker.js');

// Remove all temporary diagnostics from the final merge tree.
run('git show origin/main:package.json > package.json');
run('git show origin/main:.github/workflows/v2-tests.yml > .github/workflows/v2-tests.yml');
if (fs.existsSync('scripts/diagnose-pr462-merge.mjs')) run('git rm -f scripts/diagnose-pr462-merge.mjs');
run('git add package.json .github/workflows/v2-tests.yml');

const unresolved = run('git diff --name-only --diff-filter=U').trim();
if (unresolved) throw new Error(`Unresolved conflicts remain:\n${unresolved}`);

console.log('Running full verification on merged tree...');
run('npm test', { stdio: 'inherit' });
run('npm run build', { stdio: 'inherit' });
console.log('Full verification passed on merged tree.');

run('git add -A');
run('git commit -m "Merge current main into Sabotage strategy"');
console.log(`MERGE_COMMIT ${run('git rev-parse HEAD').trim()}`);
console.log(run('git push origin HEAD:feature/sabotage-strategy', { allowFailure: true }));
