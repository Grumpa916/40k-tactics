import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../../src/ui/styles/'+p,import.meta.url),'utf8');
test('live footer clearance covers the phase and panel buttons in browser and installed layouts',()=>{
 const css=read('prototype-workspace.css'),pwa=read('pwa.css');
 const reserve=Number(css.match(/--live-phase-footer-clearance:(\d+)px/)[1]);
 for(const selector of ['.prototype-workspace-tools > [data-workspace-panel]', '> [data-phase-progression-host]']){
  const rule=css.split(selector+' {').slice(1).map(s=>s.slice(0,s.indexOf('}'))).find(s=>s.includes('position:fixed'));
  assert.ok(rule);
  const offset=Number(rule.match(/bottom:calc\((\d+)px/)[1]);
  assert.ok(reserve>=offset+56+8);assert.doesNotMatch(rule,/bottom:calc\(66px/);
 }
 assert.match(css,/\.battle-phase-progress button \{ box-sizing:border-box; width:100%; height:56px;/);
 assert.match(pwa,/padding-bottom: var\(--live-phase-footer-clearance, 78px\)/);
 assert.match(css,/padding-bottom:calc\(var\(--live-phase-footer-clearance,78px\)/);
});
