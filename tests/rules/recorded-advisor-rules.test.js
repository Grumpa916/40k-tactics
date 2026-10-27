import test from 'node:test';
import assert from 'node:assert/strict';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as catalog } from '../../src/data/adeptus-custodes-datasheet-details.js';
import { getDatasheetWeaponOptions, getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';
import { getDamageOutcomeDistribution } from '../../src/rules/damage-outcome-distribution.js';
import { getAttackDamageForecast } from '../../src/rules/attack-damage-forecast.js';
import { getShootingTargetPriorities } from '../../src/rules/tactical-shooting-targets.js';
import { getFightOpportunityRecommendations } from '../../src/rules/tactical-fight-opportunities.js';
import { getCustodesChargeAdvisorContext } from '../../src/rules/custodes-tactical-advisor.js';
import { getChargeOpportunity } from '../../src/rules/tactical-charge-opportunity.js';
import { renderAdvisorAppliedRules } from '../../src/ui/advisor-applied-rules.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const weapon = (changes = {}, type = 'melee') => ({ id:'test', name:'Test weapon', type,
  characteristics:{attacks:3, skill:3, strength:8, ap:-2, damage:3, range:24, ...changes} });
const enemy = {id:'enemy',ownerId:'p2',status:'deployed',wounds:15,modelCount:3,position:{x:6,y:0},keywords:['Infantry'],
  characteristics:{toughness:8,save:3,weaponSkill:3,ballisticSkill:3}};
function battle(slug, { wargear = [], models = 1 } = {}) {
  const datasheetId = `adeptus-custodes:${slug}`;
  const roster = {id:'r1',datasheetId,datasheet:catalog[datasheetId],modelCount:models,equippedWargear:wargear};
  assert.ok(roster.datasheet, slug);
  return {turn:3,phase:'fight',battle:{round:2,activePlayerId:'p1',firstPlayerId:'p1'},history:[],objectives:[],
    armyRosters:{p1:{faction:'Adeptus Custodes',units:[roster]}},
    units:[{id:'custodes',name:slug,ownerId:'p1',status:'deployed',metadata:{rosterUnitId:'r1',modelCount:models},position:{x:0,y:0}},structuredClone(enemy)]};
}
function calculation(state, w = weapon(), reverse = false) {
  const [custodes, enemy] = state.units.map(unit => getProbabilisticUnitProfile(state, unit));
  const args = {attacker:reverse ? enemy : custodes,target:reverse ? custodes : enemy,weapon:w};
  const mean = getExpectedDamage(args), distribution = getDamageOutcomeDistribution(args);
  close(mean.expectedDamage,distribution.expectedDamage);
  close(distribution.totalProbability,1);
  return mean;
}
function charge(state, turn = state.turn, round = state.battle.round) {
  state.history.push({type:'charge.outcome_recorded',payload:{unitId:'custodes',targetIds:['enemy'],outcome:'successful',turn,round}});
}

test('Lance and Quicksilver Execution require a successful current-turn charge', () => {
  const state = battle('vertus-praetors');
  const lance = getDatasheetWeaponOptions(state,state.units[0],{type:'melee'})[0];
  assert.equal(lance.characteristics.lance,true);
  const baseline = calculation(state,lance);
  charge(state,2); close(calculation(state,lance).expectedDamage,baseline.expectedDamage);
  charge(state,3,1); close(calculation(state,lance).expectedDamage,baseline.expectedDamage);
  charge(state);
  const before = JSON.stringify(state), boosted = calculation(state,lance);
  assert.ok(boosted.expectedDamage > baseline.expectedDamage);
  assert.equal(boosted.contextualAbilities.appliedRules.length,2);
  assert.equal(JSON.stringify(state),before);
});

test('charge projection includes charge bonuses only for the charging side and does not record a charge', () => {
  const state = battle('vertus-praetors'); state.phase='charge';
  const projection = getChargeOpportunity(state,{playerId:'p1',attackerId:'custodes',targetUnitId:'enemy',measuredDistance:6});
  const lance = getDatasheetWeaponOptions(state,state.units[0],{type:'melee'})[0];
  assert.ok(projection.projectedFight.expectedDamage > calculation(state,lance).expectedDamage);
  assert.equal(state.history.length,0);
  assert.match(projection.assumption,/assumes a successful charge/);
});

test('Death Blow, Slayer of Tyrants, Dread Foe and Destructor Optics obey their conditions', () => {
  const cases = [
    ['gyrfalcon-jetbike-sodality','Death Blow',state => charge(state),weapon()],
    ['allarus-custodians','Slayer of Tyrants',state => {state.units[1].characteristics.toughness=9;},weapon()],
    ['aquilon-terminators-with-solarite-power-gauntlets','Dread Foe',() => {},weapon()],
    ['caladius-grav-tank','Destructor Optics',() => {},weapon({},'ranged')]
  ];
  for (const [slug,label,configure,w] of cases) {
    const state = battle(slug); configure(state);
    assert.ok(calculation(state,w).contextualAbilities.appliedRules.some(rule => rule.startsWith(label)),label);
    if (label==='Dread Foe' || label==='Destructor Optics') {
      state.units[1].keywords=['Vehicle'];
      assert.ok(!calculation(state,w).contextualAbilities.appliedRules.some(rule => rule.startsWith(label)));
      state.units[1].keywords=[];
      assert.ok(!calculation(state,w).contextualAbilities.appliedRules.some(rule => rule.startsWith(label)));
    }
  }
});

test('Reap a Terrible Tally applies only against Infantry and does not weaken Twin-linked', () => {
  const state = battle('aquilon-terminators-with-solarite-power-talons');
  const result = calculation(state,weapon({twinLinked:true}));
  assert.equal(result.hitReroll,'ones'); assert.equal(result.woundReroll,'failed');
  state.units[1].keywords=['Vehicle'];
  assert.equal(calculation(state,weapon({twinLinked:true})).hitReroll,'none');
});

test('conditional weapon text is not an unconditional bonus', () => {
  for (const [slug,keyword,flag] of [
    ['contemptor-galatus-dreadnought','Infantry','sustainedHits'],
    ['knight-centura','Psyker','devastatingWounds']
  ]) {
    const state = battle(slug);
    const w = getDatasheetWeaponOptions(state,state.units[0],{type:'melee'}).find(item => item.characteristics.conditionalAbilities?.length);
    assert.ok(w); assert.equal(w.characteristics[flag],undefined);
    state.units[1].keywords=[keyword]; const matched = calculation(state,w);
    state.units[1].keywords=['Vehicle']; const unmatched = calculation(state,w);
    assert.ok(matched.expectedDamage > unmatched.expectedDamage);
  }
});

test('Sentinel shields and Unyielding Ancient protect only against higher Strength', () => {
  for (const slug of ['sentinel-guard-sodality','contemptor-galatus-dreadnought','contemptor-achillus-dreadnought']) {
    const state = battle(slug), t = getProbabilisticUnitProfile(state,state.units[0]).characteristics.toughness;
    assert.equal(calculation(state,weapon({strength:t}),true).contextualAbilities.appliedRules.length,0);
    assert.match(calculation(state,weapon({strength:t+1}),true).contextualAbilities.appliedRules.join(),/-1 to Wound/);
  }
});

test('Living Fortress and Golden Laurels worsen incoming AP without improving AP 0', () => {
  for (const slug of ['custodian-wardens','valerian']) {
    const state = battle(slug), result = calculation(state,weapon({ap:0}),true);
    assert.ok(result.contextualAbilities.appliedRules.some(rule => rule.includes('incoming AP')));
    close(result.saveFailureProbability,1/6);
  }
});

test('Captain shield requires known equipped wargear and Guardian Eternal is ranged-only', () => {
  const state = battle('shield-captain');
  assert.equal(calculation(state,weapon(),true).contextualAbilities.damageReduction,0);
  state.armyRosters.p1.units[0].equippedWargear=[{name:'Praesidium Shield',quantity:1}];
  assert.equal(calculation(state,weapon(),true).contextualAbilities.damageReduction,1);
  state.armyRosters.p1.units[0].loadoutValidation={status:'rules-invalid'};
  assert.equal(calculation(state,weapon(),true).contextualAbilities.damageReduction,0);
  const telemon = battle('telemon-heavy-dreadnought');
  assert.equal(calculation(telemon,weapon(),true).contextualAbilities.damageReduction,0);
  assert.equal(calculation(telemon,weapon({},'ranged'),true).contextualAbilities.damageReduction,1);
});

test('model-specific protection does not spread to an attached bodyguard', () => {
  const state = battle('sentinel-guard-sodality');
  state.armyRosters.p1.units.push({id:'captain',attachedToBodyguardId:'r1',datasheet:catalog['adeptus-custodes:shield-captain'],equippedWargear:[{name:'Praesidium Shield',quantity:1}]});
  const captain = {id:'captain',ownerId:'p1',status:'deployed',metadata:{rosterUnitId:'captain',modelCount:1}};
  state.units.push(captain);
  assert.ok(!getProbabilisticUnitProfile(state,state.units[0]).combatRules.effects.includes('captain-shield'));
  assert.ok(getProbabilisticUnitProfile(state,captain).combatRules.effects.includes('captain-shield'));
  state.armyRosters.p1.units[1].datasheet=catalog['adeptus-custodes:trajann-valoris'];
  assert.equal(getProbabilisticUnitProfile(state,captain).combatRules.feelNoPain,5);
  assert.equal(getProbabilisticUnitProfile(state,state.units[0]).combatRules.feelNoPain,0);
});

test('older saved ability text is not silently assigned a different modern effect', () => {
  const state = battle('allarus-custodians');
  state.armyRosters.p1.units[0].datasheet=structuredClone(state.armyRosters.p1.units[0].datasheet);
  state.armyRosters.p1.units[0].datasheet.abilities.find(ability => ability.name==='Slayer of Tyrants').description='An older rule with different conditions.';
  state.units[1].characteristics.toughness=12;
  assert.ok(!calculation(state).contextualAbilities.appliedRules.some(rule => rule.startsWith('Slayer')));
});

test('Swift Onslaught charge re-roll is available without Dread Host and never stacks', () => {
  const state = battle('blade-champion');
  const context = () => getCustodesChargeAdvisorContext(state,{playerId:'p1',unitId:'custodes',baseProbability:10/36});
  assert.equal(context().ruleName,'Swift Onslaught'); close(context().adjustedProbability,1-(26/36)**2);
  state.armyRosters.p1.detachment='Dread Host';
  close(context().adjustedProbability,1-(26/36)**2);
});

test('Shooting and Fight forecasts use reviewed defence and expose included rules', () => {
  const state = battle('custodian-wardens');
  const w = weapon({},'ranged');
  const forecast = getAttackDamageForecast(state,{attackerId:'enemy',targetId:'custodes',weapon:w});
  assert.ok(forecast.appliedRules.some(rule => rule.startsWith('Living Fortress')));
  const ranking = getShootingTargetPriorities(state,{playerId:'p2',attackerId:'enemy',weapon:w}).priorities[0];
  close(ranking.expectedDamage,forecast.expectedDamage);
  const fight = getFightOpportunityRecommendations(state,{playerId:'p2',options:[{unitId:'enemy',targetUnitId:'custodes',weapon:weapon()}]})[0];
  assert.ok(fight.appliedRules.some(rule => rule.startsWith('Living Fortress')));
  const html = renderAdvisorAppliedRules(['Living Fortress','<script>']);
  assert.match(html,/Rules included · 2/); assert.ok(!html.includes('<script>'));
});

 test('Caladius Annihilator Lethal Hits requires a known Monster or Vehicle target', () => {
  const state = battle('caladius-annihilator-grav-tank');
  const w = getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'}).find(item => item.characteristics.conditionalAbilities?.some(rule => rule.lethalHits));
  assert.ok(w);
  assert.equal(w.characteristics.lethalHits,undefined);
  const baseline = calculation(state,w).expectedDamage;
  for (const keyword of ['Monster','Vehicle']) {
    state.units[1].keywords=[keyword];
    assert.ok(calculation(state,w).expectedDamage > baseline);
  }
  state.units[1].keywords=[];
  close(calculation(state,w).expectedDamage,baseline);
});
