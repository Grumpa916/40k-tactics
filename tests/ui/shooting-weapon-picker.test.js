import test from 'node:test';
import assert from 'node:assert/strict';
import { getShootingWeaponEffects, renderShootingWeaponChoices } from '../../src/ui/shooting-weapon-picker.js';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
const stylesheet = readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');
const profilesSource = readFileSync(new URL('../../src/rules/saved-roster-combat-profile.js', import.meta.url), 'utf8');

const bolter = {id:'bolter',name:'Bolt rifle',type:'ranged',abilities:'Heavy, Rapid Fire 1',
  characteristics:{range:24,attacks:2,strength:4,ap:-1,damage:1,rapidFire:1}};
const melta = {id:'melta',name:'Multi-melta',type:'ranged',abilities:'Melta 2, Twin-linked, Assault',
  characteristics:{range:18,attacks:2,strength:9,ap:-4,damage:6,melta:2,twinLinked:true,assault:true}};

test('ranged weapon boxes match Fight selection with a highlighted pressed tile',()=>{
  const html=renderShootingWeaponChoices([bolter,melta],'melta');
  assert.equal((html.match(/data-shoot-weapon-choice=/g)??[]).length,2);
  assert.match(html,/role="group" aria-label="Ranged weapon"/);
  assert.match(html,/data-shoot-weapon-choice="melta" aria-pressed="true"/);
  assert.match(html,/data-shoot-weapon-choice="bolter" aria-pressed="false"/);
  assert.doesNotMatch(html,/data-weapon|<select/);
  assert.match(html,/Selected weapon · Multi-melta/);
  assert.doesNotMatch(html,/Selected weapon · Bolt rifle/);
  assert.match(stylesheet,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(stylesheet,/min-height:48px/);
});

test('selected weapon details show its actual saved special rules without duplicates',()=>{
  const effects=getShootingWeaponEffects(melta);
  assert.deepEqual(effects.map(item=>item.label),['Melta 2','Twin-linked','Assault']);
  assert.match(renderShootingWeaponChoices([bolter,melta],'melta'),/Check bonus damage within half range/);
  assert.match(renderShootingWeaponChoices([bolter,melta],'melta'),/Re-roll Wound rolls/);
  assert.match(renderShootingWeaponChoices([bolter,melta],'bolter'),/Heavy/);
  assert.match(renderShootingWeaponChoices([bolter,melta],'bolter'),/Rapid Fire 1/);
});

test('conditional weapon rules are not misreported as unconditional',()=>{
  const conditional={id:'c',name:'Conditional cannon',
    abilities:'Lethal Hits vs Psyker, Anti-Monster 4+, Torrent',
    characteristics:{conditionalAbilities:[{label:'Lethal Hits vs Psyker'}],anti:[{keyword:'monster',threshold:4}],torrent:true}};
  const labels=getShootingWeaponEffects(conditional).map(effect=>effect.label);
  assert.ok(labels.includes('Lethal Hits vs Psyker'));
  assert.ok(!labels.includes('Lethal Hits'));
  assert.ok(labels.includes('Anti-Monster 4+'));
  assert.equal(labels.filter(label=>label==='Torrent').length,1);
  assert.match(renderShootingWeaponChoices([conditional],'c'),/Applies only against the stated target type/);
});

test('unreviewed effects do not imply a rule and user-provided labels are escaped',()=>{
  const html=renderShootingWeaponChoices([{id:'bad" id',name:'Heavy <danger>',
    abilities:'Unverified special <effect>',characteristics:{}}],'bad" id');
  assert.match(html,/data-shoot-weapon-choice="bad&amp;quot; id"|data-shoot-weapon-choice="bad&quot; id"/);
  assert.match(html,/Heavy &lt;danger&gt;/);
  assert.match(html,/Unverified special &lt;effect&gt;/);
  assert.doesNotMatch(html,/<danger>|<effect>/);
  const noEffects=renderShootingWeaponChoices([{id:'plain',name:'Plain',characteristics:{}}],'plain');
  assert.match(noEffects,/No special effects listed in the saved profile/);
});

test('Shooting selections use tile events but the existing target picker and recording flow remain',()=>{
  assert.match(source,/querySelectorAll\("\[data-shoot-weapon-choice\]"\)/);
  assert.doesNotMatch(source,/querySelectorAll\("\[data-weapon\]"\)/);
  assert.match(source,/const weaponId = selectedWeaponId;/);
  assert.match(source,/resolveShootingAttack\(session/);
  assert.match(source,/data-target/);
  assert.match(source,/data-shoot-precision/);
  assert.match(source,/data-finish-unit/);
  assert.match(profilesSource,/abilities: weapon\?\.abilities \?\? weapon\?\.characteristics\?\.abilities \?\? ''/);
});

test('disabled classic choices cannot be activated before shooter selection',()=>{
  const html=renderShootingWeaponChoices([bolter,melta],null,{disabled:true});
  assert.equal((html.match(/disabled/g)??[]).length,2);
  assert.doesNotMatch(html,/Selected weapon ·/);
});
