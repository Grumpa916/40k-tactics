import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVENT_COMPANION_MAP_CATALOG} from '../../src/data/event-companion-map-catalog.js';
import {getEventCompanionMapForForceDispositions} from '../../src/rules/event-companion-map-catalog.js';
import {mapObjectiveMarkerLabel,objectiveMapDisplayName,objectivePickerLabel} from '../../src/rules/objective-display-labels.js';
import {renderBattlefieldMap} from '../../src/ui/battlefield-map.js';
import {renderPersistentMissionSummary} from '../../src/ui/mission-summary-panel.js';
import {getSecondaryMissionCardChoiceOptions} from '../../src/rules/secondary-mission-lifecycle.js';
import {SECONDARY_MISSION_CATALOG} from '../../src/data/secondary-mission-catalog.js';
import {getSecondaryObjectivePlanningSignal} from '../../src/rules/secondary-mission-intelligence.js';
import {getTemptingTargetScoringEvidence} from '../../src/rules/tempting-target-state.js';
import {getBurdenOfTrustScoringEvidence} from '../../src/rules/burden-of-trust-state.js';
import {summarizeGameEvent} from '../../src/ui/battle-context-panels.js';
const dispositions=Object.keys(EVENT_COMPANION_MAP_CATALOG.forceDispositionMissionMatrix);

function stateFor(mine,theirs,layout){
  const geo=getEventCompanionMapForForceDispositions(mine,theirs,layout);
  assert.ok(geo,'Map exists: '+mine+'/'+theirs+'/'+layout);
  return {
    phase:'shooting',turn:3,activePlayer:'p1',
    battle:{id:'test',status:'active',round:3,activePlayerId:'p1',firstPlayerId:'p1'},
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battlefieldMap:{missionSetup:{myDisposition:mine,opponentDisposition:theirs,layout}},
    objectives:Object.entries(geo.objectivePositions).map(([name,position])=>({
      id:'event-companion:'+name,layoutObjective:name,name,position:{...position},
      control:{controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}
    })),
    units:[{id:'guard',name:'Guard Unit',ownerId:'p1',status:'deployed',position:{x:30,y:19},
      startingStrength:1,currentStrength:1,profile:{characteristics:{movement:6,objectiveControl:2,wounds:3}}}],
    scoring:{secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'},secondaryMissions:[],turnSnapshots:[]},
    history:[],armyRosters:{}
  };
}
function markersFor(state,perspective){
  const html=renderBattlefieldMap(state,{mode:'live',perspectivePlayerId:perspective,plannerStyleObjectives:true});
  const nodes=[...html.matchAll(/<button\b[^>]*data-layout-objective="([^"]+)"\s+data-map-objective-id="([^"]+)"[^>]*>([^<]*)<\/button>/g)];
  return new Map(nodes.map(([,canonical,id,label])=>[id,{canonical,label}]));
}
function addCard(state,id,cardState){
  const definition=SECONDARY_MISSION_CATALOG.find(item=>item.id===id);
  assert.ok(definition);
  state.scoring.secondaryMissions.push({
    instanceId:id+'-1',definitionId:id,definition,playerId:'p1',
    status:'active',drawnRound:3,drawnTurn:3,cardState,scoringHistory:[]
  });
}

test('all layouts and perspectives use one canonical ID in both map modes and matching mission labels',()=>{
  let checked=0,mismatchesFromRaw=0;
  for(const mine of dispositions)for(const theirs of dispositions)for(const layout of ['A','B','C']){
    const state=stateFor(mine,theirs,layout);
    for(const perspective of ['p1','p2']){
      const markers=markersFor(state,perspective);
      assert.equal(markers.size,state.objectives.length,'map objective count: '+mine+'/'+theirs+'/'+layout);
      assert.equal(new Set([...markers.values()].map(o=>o.label)).size,markers.size,'distinct visual labels');
      for(const objective of state.objectives){
        const marker=markers.get(objective.id);
        assert.ok(marker,'canonical ID on map: '+objective.id);
        const full=objectiveMapDisplayName(state,objective.id,perspective);
        const compact=mapObjectiveMarkerLabel(full);
        assert.equal(marker.canonical,objective.layoutObjective,'source identity preserved');
        assert.equal(marker.label,full,'top-down label uses shared role');
        assert.equal(objectivePickerLabel(state,objective.id,perspective),
          full+(compact===full?'':' ('+compact+')'),
          'mission label includes top-down name and standard-map abbreviation');
        if(objective.layoutObjective!==full)mismatchesFromRaw++;
        checked++;
      }
    }
  }
  assert.ok(checked>350,'5x5 disposition pairs, A/B/C and both perspectives');
  assert.ok(mismatchesFromRaw>100,'exercises original source-name mismatches');
  const src=readFileSync(new URL('../../src/ui/live-map-view.js',import.meta.url),'utf8');
  assert.match(src,/renderBattlefieldMap\(state/);
  assert.ok(src.includes('preferences.topDown ? fullObjectiveLabels[index] : mapObjectiveMarkerLabel(fullObjectiveLabels[index])'),
    'standard and top-down modes use the same board with compact/full labels');
});

test('stored Tempting Target and Burden of Trust objective names match both map views for A/B/C',()=>{
  for(const layout of ['A','B','C']){
    const state=stateFor('Purge the Foe','Reconnaissance',layout);
    const candidates=getSecondaryMissionCardChoiceOptions(state,{playerId:'p1',choiceType:'tempting-target'});
    const c2=candidates.find(obj=>objectiveMapDisplayName(state,obj.id,'p1')==='Center 2')??candidates[0];
    const exp=candidates.find(obj=>objectiveMapDisplayName(state,obj.id,'p1').includes('Expansion')&&obj.id!==c2.id);
    assert.ok(c2&&exp);
    addCard(state,'secondary-a-tempting-target',{temptingTargetObjectiveId:c2.id});
    addCard(state,'secondary-burden-of-trust',{burdenTrustAssignments:[{objectiveId:exp.id,unitId:'guard',expiresAtTurn:4}]});
    for(const perspective of ['p1','p2']){
      const html=renderPersistentMissionSummary(state,{perspectivePlayerId:perspective});
      const markers=markersFor(state,perspective);
      for(const id of [c2.id,exp.id]){
        const m=markers.get(id);
        const value=objectivePickerLabel(state,id,perspective);
        assert.equal(value,m.label+' ('+mapObjectiveMarkerLabel(m.label)+')');
        assert.ok(html.includes(value),'saved choice uses map label: '+value);
      }
      assert.match(html,/Guard Unit/);
    }
    const target=getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:c2.id});
    const notTarget=getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:exp.id});
    assert.ok(target.missions.includes('A Tempting Target'));
    assert.ok(!notTarget.missions.includes('A Tempting Target'));
  }
});

test('Forward Position boosts visible expansion roles, not raw source Expansion names',()=>{
  let checked=0;
  for(const mine of dispositions)for(const theirs of dispositions)for(const layout of ['A','B','C']){
    const state=stateFor(mine,theirs,layout);
    addCard(state,'secondary-forward-position',{});
    for(const obj of state.objectives){
      const label=objectiveMapDisplayName(state,obj.id,'p1');
      if(label.endsWith('Home'))continue;
      const signal=getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:obj.id});
      assert.equal(signal.missions.includes('Forward Position'),label.endsWith('Expansion'),
        'map role: '+mine+'/'+theirs+'/'+layout+' '+obj.layoutObjective+' => '+label);
      checked++;
    }
  }
  assert.ok(checked>200);
});

test('all objective-dependent Action selectors share the same map name and preserve source IDs',()=>{
  const src=readFileSync(new URL('../../src/ui/mission-action-picker.js',import.meta.url),'utf8');
  for(const name of ['smokeObjectives','triangulationObjectives','gatherIntelObjectives','secureAssetObjectives',
    'vitalLinkObjectives','extractRelicObjectives','sabotageObjectives','locateObjectives','cleanseObjectives']){
    const start=src.indexOf(name+'.map(item=>');
    assert.ok(start>=0,name+' chooser exists');
    const end=src.indexOf(".join('')",start);
    const entry=src.slice(start,end);
    assert.ok(entry.includes('objectivePickerLabel(state,item.objectiveId,mapPerspective)'),name+' uses map nomenclature');
    assert.ok(!entry.includes('esc(item.name)'),name+' has no stale source label');
  }
  assert.ok(src.includes('objectivePickerLabel(state,item.id,mapPerspective)'));
  assert.ok(src.includes('option value=')&&src.includes('esc(item.objectiveId)'),
    'actual stable objective IDs are retained in option values');
});


test('saved-choice scoring evidence and battle history use the same objective labels as the map',()=>{
  const s=stateFor('Purge the Foe','Reconnaissance','A');
  const c2=s.objectives.find(o=>objectiveMapDisplayName(s,o.id,'p1')==='Center 2');
  const expansion=s.objectives.find(o=>objectiveMapDisplayName(s,o.id,'p1')==='My Expansion');
  assert.ok(c2&&expansion);
  addCard(s,'secondary-a-tempting-target',{temptingTargetObjectiveId:c2.id});
  addCard(s,'secondary-burden-of-trust',{burdenTrustAssignments:[
    {objectiveId:expansion.id,unitId:'guard',expiresAtTurn:4}
  ]});
  const tempting=getTemptingTargetScoringEvidence(s,'p1');
  const burden=getBurdenOfTrustScoringEvidence(s,'p1');
  const c2Name=objectivePickerLabel(s,c2.id,'p1');
  const expansionName=objectivePickerLabel(s,expansion.id,'p1');
  assert.equal(tempting.objectiveName,c2Name);
  assert.ok(tempting.detail.includes(c2Name));
  assert.equal(burden.assignments[0].objectiveName,expansionName);
  assert.ok(burden.detail.includes(expansionName));
  const event=summarizeGameEvent({
    type:'secondary_mission.tempting_target_selected',
    payload:{playerId:'p1',objectiveId:c2.id,selectedByPlayerId:'p2'}
  },s);
  assert.ok(event.detail.includes(c2Name));
  const consecrate=readFileSync(new URL('../../src/ui/consecrate-review.js',import.meta.url),'utf8');
  assert.ok(consecrate.includes('objectivePickerLabel(state,objective.id'),
    'Consecrate Primary selection also uses the same map display names');
});
