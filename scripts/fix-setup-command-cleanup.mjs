import fs from 'node:fs';

function replaceOnce(path, oldText, newText, label) {
  const text=fs.readFileSync(path,'utf8');
  const count=text.split(oldText).length-1;
  if(count!==1) throw new Error(`${label}: expected 1 match, found ${count}`);
  fs.writeFileSync(path,text.replace(oldText,newText));
}

// Keep the formations checkpoint in the engine/state model for reserve and transport rules,
// but make it UI-invisible so the user moves directly from secondary choices to deployment.
replaceOnce('src/rules/event-preparation.js',
"  ['secondaries', 'Reveal secondary choices', ''],\n  ['deployment', 'Deploy armies', ''],",
"  ['secondaries', 'Reveal secondary choices', ''],\n  ['formations', 'Declare battle formations', ''],\n  ['deployment', 'Deploy armies', ''],",
'restore engine formations checkpoint');

replaceOnce('src/engine/state-transitions.js',
'  requirePreparationComplete(state, "secondaries");',
'  requirePreparationComplete(state, "formations");',
'restore deployment guard');

// Do not render the formations page. When Secondary choices are confirmed, accept the default
// battlefield formations and immediately enter Deployment. Existing reserve/transport state remains
// supported by the engine and later rule-authorised reserve changes.
replaceOnce('src/ui/event-preparation-screen.js',
"      } else {\n        send({action:'confirm'});\n        if(stage!=='deployment'&&preparationStep(session.getState())==='deployment') {\n          try{session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});}catch(err){message=err.message;render();}\n        }\n      }",
"      } else {\n        send({action:'confirm'});\n        if(stage==='secondaries'&&preparationStep(session.getState())==='formations') {\n          try {\n            session.dispatch({type:COMMAND_TYPES.UPDATE_PREPARATION,payload:{action:'confirm'}});\n            session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});\n          } catch(err) { message=err.message; render(); }\n        } else if(stage==='formations'&&preparationStep(session.getState())==='deployment') {\n          try{session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});}catch(err){message=err.message;render();}\n        }\n      }",
'auto skip formations page');

// Update focused regression checks: formations remains an engine checkpoint but is never rendered.
const testPath='tests/ui/setup-command-cleanup.test.js';
let tests=fs.readFileSync(testPath,'utf8');
tests=tests.replace(
"test('formations page is removed from the guided preparation sequence',()=>{\n const src=fs.readFileSync(new URL('../../src/rules/event-preparation.js',import.meta.url),'utf8');\n assert.doesNotMatch(src,/\\['formations', 'Declare battle formations'/);\n});\n\ntest('deployment begins after the secondary-choice checkpoint',()=>{\n const state=fs.readFileSync(new URL('../../src/engine/state-transitions.js',import.meta.url),'utf8');\n assert.match(state,/requirePreparationComplete\\(state, \\\"secondaries\\\"\\)/);\n});",
"test('formations remains an engine checkpoint but its page is skipped by the UI',()=>{\n const rules=fs.readFileSync(new URL('../../src/rules/event-preparation.js',import.meta.url),'utf8');\n const ui=fs.readFileSync(new URL('../../src/ui/event-preparation-screen.js',import.meta.url),'utf8');\n assert.match(rules,/\\['formations', 'Declare battle formations'/);\n assert.match(ui,/stage==='secondaries'&&preparationStep\\(session.getState\\(\\)\\)==='formations'/);\n});\n\ntest('deployment still requires formations to be confirmed in engine state',()=>{\n const state=fs.readFileSync(new URL('../../src/engine/state-transitions.js',import.meta.url),'utf8');\n assert.match(state,/requirePreparationComplete\\(state, \\\"formations\\\"\\)/);\n});");
fs.writeFileSync(testPath,tests);
