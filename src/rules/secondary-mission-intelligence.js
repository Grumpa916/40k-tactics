import { getCompleteSecondaryMissionById } from '../data/secondary-mission-complete-catalog.js';
import { getSecondaryMissionHistory, getSecondaryMissionMode, getActiveBurdenTrustAssignments, SECONDARY_MISSION_STATUS } from './secondary-mission-lifecycle.js';
import { isPlayerHomeObjective } from './consecrate-state.js';
import { objectiveMapDisplayName } from './objective-display-labels.js';
import { hasKeyword } from './tactical-context-utils.js';

/*
 * Each physically checked Chapter Approved 2026–27 card has an explicit planning
 * role. Never promote a generic phrase such as "objective" to a numerical bonus:
 * many cards score on destroyed units, table quarters or selected terrain rather
 * than controlling an arbitrary objective.
 *
 * Scoring and end-turn reviews remain manual. These are advisory opportunities,
 * NOT proofs of completed conditions or automatic VP projections.
 */
export const SECONDARY_INTELLIGENCE_ROLES = Object.freeze({
  'secondary-a-grievous-blow': Object.freeze({focus:'destroy-large-unit', advice:'Prioritize enemy units with Starting Strength 13 or more; count qualifying destructions during either player’s turn.'}),
  'secondary-a-tempting-target': Object.freeze({focus:'selected-objective', advice:'Secure the specific No Man’s Land objective designated by the opponent; another objective does not satisfy this card.'}),
  'secondary-assassination': Object.freeze({focus:'destroy-character', advice:'Focus eligible enemy CHARACTER models; Fixed and Tactical award VP differently.'}),
  'secondary-beacon': Object.freeze({focus:'designated-unit', advice:'Protect the chosen Beacon unit and move it beyond your deployment zone or territory before the opponent-turn checkpoint.'}),
  'secondary-behind-enemy-lines': Object.freeze({focus:'enemy-deployment', advice:'Stage eligible units wholly within the opponent’s deployment zone; crossing the territory line alone is insufficient.'}),
  'secondary-bring-it-down': Object.freeze({focus:'destroy-heavy-model', advice:'Destroy enemy models with a Wounds characteristic of 10 or more; model wounds, not combined unit wounds, determine eligibility.'}),
  'secondary-burden-of-trust': Object.freeze({focus:'assigned-guard', advice:'Preserve the recorded guarding unit at each assigned objective and its control through the opponent-turn checkpoint.'}),
  'secondary-centre-ground': Object.freeze({focus:'battlefield-centre', advice:'Stage an eligible friendly unit within 3 inches of battlefield centre and clear enemy units from the relevant 3- or 6-inch radius.'}),
  'secondary-cleanse': Object.freeze({focus:'non-home-action', advice:'Reserve eligible non-home objectives for different Shooting-phase Cleanse Actions; maintain control until your end turn.'}),
  'secondary-defend-stronghold': Object.freeze({focus:'home-defence', advice:'From round 2, preserve your home objective and keep enemy units out of your deployment zone through the opponent-turn checkpoint.'}),
  'secondary-display-of-might': Object.freeze({focus:'no-mans-land-units', advice:'Maintain more eligible units wholly within No Man’s Land than the opponent, including during their turn.'}),
  'secondary-engage-on-all-fronts': Object.freeze({focus:'table-quarters', advice:'Spread eligible units across three or four quarters, wholly within each and outside 6 inches of battlefield centre.'}),
  'secondary-forward-position': Object.freeze({focus:'forward-objectives', advice:'Control the opponent’s home objective and/or expansion objectives at your end-turn checkpoint.'}),
  'secondary-no-prisoners': Object.freeze({focus:'destroy-any-unit', advice:'Destroy enemy units; each destruction is worth 2 VP, subject to the card and turn cap.'}),
  'secondary-outflank': Object.freeze({focus:'opposite-edges', advice:'Stage eligible units within 6 inches of battlefield edges; the higher tier requires opposite edges and an out-of-territory unit.'}),
  'secondary-overwhelming-force': Object.freeze({focus:'destroy-objective-starter', advice:'Target enemy units recorded within objective range at the START of the turn; current position alone does not qualify.'}),
  'secondary-plunder': Object.freeze({focus:'terrain-action', advice:'Reserve one eligible unit for a Shooting-phase Plunder Action inside terrain that is not within your territory. Confirm terrain eligibility on the physical table.'}),
  'secondary-secure-no-mans-land': Object.freeze({focus:'two-midfield-objectives', advice:'Control at least two eligible No Man’s Land objectives by the end of your turn.'})
});

function definitionFor(entry) {
  return entry?.definition ?? getCompleteSecondaryMissionById(entry?.definitionId) ?? null;
}
function windowsFor(definition,mode) {
  return (definition?.scoringWindows ?? []).filter(window =>
    !Array.isArray(window?.modes) || !window.modes.length || !mode || window.modes.includes(mode));
}
function validMissionEntries(state,playerId) {
  if(!playerId)return [];
  return getSecondaryMissionHistory(state,playerId)
    .filter(item=>item.status===SECONDARY_MISSION_STATUS.ACTIVE);
}
function normalizeCard(state,playerId,entry) {
  const definition=definitionFor(entry);
  const id=entry.definitionId ?? definition?.id;
  const role=SECONDARY_INTELLIGENCE_ROLES[id] ?? null;
  const mode=getSecondaryMissionMode(state,playerId) ?? definition?.missionMode ?? null;
  const windows=windowsFor(definition,mode);
  const round=Number(state?.battle?.round ?? 1);
  const verified=definition?.rulesVerified===true && role!==null && windows.length>0;
  const eligibleNow=verified && windows.some(window=>window.minRound == null || round>=window.minRound);
  const timingLabels=[...new Set(windows.map(window=>window.timingLabel??window.timing).filter(Boolean))];
  const cardState=entry.cardState??{};
  const selectedObjectiveId=id==='secondary-a-tempting-target'?cardState.temptingTargetObjectiveId??null:null;
  const designatedUnitId=id==='secondary-beacon'?cardState.beaconUnitId??null:null;
  const guarding=getActiveBurdenTrustAssignments(state,entry);
  const choicePending=(id==='secondary-a-tempting-target'&&!selectedObjectiveId) ||
    (id==='secondary-beacon'&&!designatedUnitId);
  const activeAction=id==='secondary-cleanse'?'Cleanse · own Shooting phase':
    id==='secondary-plunder'?'Plunder · own Shooting phase':null;
  return Object.freeze({
    instanceId:entry.instanceId,definitionId:id,name:definition?.name??id,
    mode,verified,eligibleNow,focus:role?.focus??'review-only',
    advice:role?.advice??'Check this secondary against its physical card before planning a scoring play.',
    timingLabels:Object.freeze(timingLabels),scoringWindows:Object.freeze(windows),
    selectedObjectiveId,designatedUnitId,guarding:Object.freeze(guarding),
    choicePending,action:activeAction,
    recordedUnit:designatedUnitId?(state.units??[]).find(unit=>unit.id===designatedUnitId)?.name??designatedUnitId:null
  });
}

/** All active card opportunities, including explicit blockers and timing. */
export function getSecondaryMissionIntelligence(state,{playerId}={}){
  if(!playerId)throw new TypeError('playerId is required.');
  return Object.freeze(validMissionEntries(state,playerId).map(entry=>normalizeCard(state,playerId,entry)));
}

function isNoMansLandObjective(objective) {
  const name=String(objective?.layoutObjective??objective?.name??'');
  return objective?.zone==='no-mans-land'||['Central 1','Central 2','Expansion 1','Expansion 2'].includes(name);
}

/** Card-specific bonus for ONE actual objective. No blanket objective bonus. */
export function getSecondaryObjectivePlanningSignal(state,{playerId,objectiveId,unitId=null}={}){
  const objective=(state.objectives??[]).find(item=>item?.id===objectiveId);
  if(!objective||!playerId)return Object.freeze({score:0,missions:Object.freeze([]),reason:''});
  const cards=getSecondaryMissionIntelligence(state,{playerId});
  const ownHome=isPlayerHomeObjective(state,objective,playerId);
  const opponentId=(state.players??[]).find(player=>player.id!==playerId)?.id??null;
  const enemyHome=opponentId?isPlayerHomeObjective(state,objective,opponentId):false;
  const noMansLand=isNoMansLandObjective(objective)&&!ownHome&&!enemyHome;
  const contributions=[];
  for(const card of cards){
    if(!card.eligibleNow || card.choicePending)continue;
    let value=0,why='';
    switch(card.definitionId){
      case 'secondary-a-tempting-target':
        if(card.selectedObjectiveId===objectiveId){value=0.34;why='This is the opponent-designated Tempting Target.';}
        break;
      case 'secondary-burden-of-trust':
        if(card.guarding.some(a=>a.objectiveId===objectiveId && (!unitId||a.unitId===unitId))){
          value=0.26;why='This objective has a recorded Burden of Trust guard assignment.';
        }
        break;
      case 'secondary-cleanse':
        if(!ownHome){value=0.19;why='This non-home objective is a potential Cleanse Action destination; confirm the Shooting-phase Action and different-unit requirement.';}
        break;
      case 'secondary-defend-stronghold':
        if(ownHome){value=0.26;why='Hold your home objective for the opponent-turn Defend Stronghold review.';}
        break;
      case 'secondary-forward-position':
        if(enemyHome||noMansLand && /expansion/i.test(String(objective.layoutObjective??objective.name??''))){
          value=0.24;why='Forward Position can use the enemy home or an expansion objective.';}
        break;
      case 'secondary-secure-no-mans-land':
        if(noMansLand){value=0.22;why='One of the two No Man’s Land objectives needed for this card.';}
        break;
      default:break; // Never infer generic objective relevance from card prose.
    }
    if(value)contributions.push(Object.freeze({name:card.name,value,reason:why,definitionId:card.definitionId}));
  }
  const score=Math.min(0.38,contributions.reduce((sum,item)=>sum+item.value,0));
  return Object.freeze({score,missions:Object.freeze(contributions.map(item=>item.name)),
    contributions:Object.freeze(contributions),
    reason:contributions.map(item=>item.reason).join(' ')});
}

function legacyTerritoryReference(card) {
  const d=card?.definition??{};
  return (d.scoringWindows??[]).flatMap(win=>(win?.tiers??[]).map(t=>t.summary??'')).join(' ').toLowerCase();
}

/** Score only a terrain/territory role the card actually requires. */
export function getSecondaryTerritoryPlanningSignal(state,{playerId,unit=null}={}){
  const active=validMissionEntries(state,playerId);
  const cards=active.map(entry=>({entry,plan:normalizeCard(state,playerId,entry)}));
  const missions=[],reviewOnlyMissions=[];
  let directOutsideOwn=0,forwardStaging=0;
  for(const {entry,plan} of cards){
    const definition=definitionFor(entry);
    const name=plan.name;
    if(!plan.verified){
      // Preserve the older import workflow's review-only references and
      // compatibility with curated custom verified rules, without inventing
      // a value for unknown official cards.
      const text=legacyTerritoryReference(entry);
      const relevant=/not within your territory|outside your territory|opponent(?:'|’)?s deployment zone|opponent(?:'|’)?s home objective/.test(text);
      if(relevant && definition?.rulesVerified!==true)reviewOnlyMissions.push(name);
      if(relevant && definition?.rulesVerified===true && !SECONDARY_INTELLIGENCE_ROLES[plan.definitionId]){
        missions.push(name);
        if(/not within your territory|outside your territory/.test(text))directOutsideOwn+=0.24;
        if(/opponent(?:'|’)?s deployment zone|opponent(?:'|’)?s home objective/.test(text))forwardStaging+=0.08;
      }
      continue;
    }
    if(!plan.eligibleNow)continue;
    if(plan.definitionId==='secondary-beacon'){
      if(!plan.designatedUnitId || unit?.id!==plan.designatedUnitId)continue;
      if(unit?.status!=='deployed')continue;
      missions.push(name);directOutsideOwn+=0.24;
    }
    else if(plan.definitionId==='secondary-outflank'){
      if(unit&&(unit.battleShocked===true||hasKeyword(state,unit,'aircraft')))continue;
      missions.push(name);directOutsideOwn+=0.19;
    }
    else if(plan.definitionId==='secondary-behind-enemy-lines'){
      if(unit&&(unit.battleShocked===true||hasKeyword(state,unit,'aircraft')))continue;
      missions.push(name);forwardStaging+=0.08;
    }
  }
  return Object.freeze({
    score:Math.min(0.32,directOutsideOwn+forwardStaging),
    directOutsideOwn:Math.min(0.28,directOutsideOwn),
    forwardStaging:Math.min(0.12,forwardStaging),
    missions:Object.freeze([...new Set(missions)]),
    reviewOnlyMissions:Object.freeze([...new Set(reviewOnlyMissions)])
  });
}
