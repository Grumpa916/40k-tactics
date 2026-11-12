import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  APP_THEME_STORAGE_KEY, DEFAULT_APP_THEME, normalizeAppTheme,
  readAppTheme, saveAppTheme, nextAppTheme,
  renderAppThemeToggle, applyAppThemeToShell
} from '../../src/ui/app-theme-preference.js';
import { renderPrototypeWorkspaceTools } from '../../src/ui/prototype-workspace.js';

const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');

test('Custodes is the default palette and Classic remains an explicit, persistent fallback',()=>{
  assert.equal(DEFAULT_APP_THEME,'custodes');
  assert.equal(readAppTheme(null),'custodes');
  assert.equal(normalizeAppTheme('corrupt-value'),'custodes');
  assert.equal(nextAppTheme('custodes'),'classic');
  assert.equal(nextAppTheme('classic'),'custodes');
  const storage=new Map();
  const store={
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,value)
  };
  assert.equal(saveAppTheme('classic',store),'classic');
  assert.equal(storage.get(APP_THEME_STORAGE_KEY),'classic');
  assert.equal(readAppTheme(store),'classic');
  assert.equal(saveAppTheme('custodes',store),'custodes');
  assert.equal(readAppTheme(store),'custodes');
  const blocked={getItem(){throw Error('private mode')},setItem(){throw Error('blocked')}};
  assert.equal(readAppTheme(blocked),'custodes');
  assert.equal(saveAppTheme('classic',blocked),'classic');
});

test('theme control has readable label and correct accessibility state',()=>{
  const custodes=renderAppThemeToggle('custodes');
  assert.match(custodes,/type="button"/);
  assert.match(custodes,/aria-pressed="true"/);
  assert.match(custodes,/data-app-theme-toggle/);
  assert.match(custodes,/Switch to Classic color theme/);
  assert.match(custodes,/Theme: Custodes/);
  const classic=renderAppThemeToggle('classic');
  assert.match(classic,/aria-pressed="false"/);
  assert.match(classic,/Switch to Custodes color theme/);
  assert.match(classic,/Theme: Classic/);
});

test('switch updates only shell presentation and labels, without dispatching game actions',()=>{
  const button={
    attrs:{},textContent:'',
    setAttribute(k,v){this.attrs[k]=v;}
  };
  const shell={
    attrs:{},
    setAttribute(k,v){this.attrs[k]=v;}
  };
  const root={
    querySelector(s){return s==='.battle-shell'?shell:null;},
    querySelectorAll(s){return s==='[data-app-theme-toggle]'?[button]:[];}
  };
  assert.equal(applyAppThemeToShell(root,'classic'),'classic');
  assert.equal(shell.attrs['data-app-theme'],'classic');
  assert.equal(button.attrs['aria-pressed'],'false');
  assert.equal(button.textContent,'Theme: Classic');
  assert.equal(applyAppThemeToShell(root,'custodes'),'custodes');
  assert.equal(shell.attrs['data-app-theme'],'custodes');
  assert.equal(button.attrs['aria-pressed'],'true');
  assert.equal(button.textContent,'Theme: Custodes');
});

test('landscape iPad phase HUD keeps five phase chips and places the theme only under More tools',()=>{
  const html=renderPrototypeWorkspaceTools({appTheme:'custodes'});
  assert.equal((html.match(/data-battle-phase-button=/g)??[]).length,6);
  assert.match(html,/<details class="prototype-phase-menu">[\s\S]*data-app-theme-toggle/);
  assert.match(html,/More tools/);
  assert.match(html,/data-workspace-panel/);
  assert.equal((html.match(/data-app-theme-toggle/g)??[]).length,1);
  assert.match(renderPrototypeWorkspaceTools({appTheme:'classic'}),/Theme: Classic/);
});

test('theme stylesheet is loaded last, scoped to selection, and does not change map geometry or unit allegiance colors',()=>{
  const html=read('battle.html');
  const css=read('src/ui/styles/custodes-theme.css');
  const shell=read('src/ui/battle-shell.js');
  const start=html.indexOf('movement-dashboard.css');
  const end=html.indexOf('custodes-theme.css');
  assert.ok(start>=0 && end>start,'Custodes CSS follows existing tabletop styles');
  assert.match(css,/\.battle-shell\[data-app-theme="custodes"\]/);
  assert.match(css,/--custodes-gold/);
  assert.match(css,/--custodes-ivory/);
  assert.match(css,/--custodes-red/);
  assert.match(css,/\.combat-workspace__advisor/);
  assert.match(css,/\.prototype-phase-chips button\[aria-pressed="true"\]/);
  assert.doesNotMatch(css,/\.battlefield-map__board\s*\{/,'real terrain board geometry remains unchanged');
  assert.doesNotMatch(css,/\.battlefield-map__unit\.friendly\s*\{/,'friendly base color is retained');
  assert.doesNotMatch(css,/\.battlefield-map__unit\.opponent\s*\{/,'opponent base color is retained');
  assert.match(shell,/appTheme = saveAppTheme\(nextAppTheme\(appTheme\)\)/);
  assert.match(shell,/applyAppThemeToShell\(container, appTheme\)/);
  assert.match(shell,/Do not rerender the battle/);
  assert.match(css,/button:disabled/);
  assert.match(css,/:focus-visible/);
});
