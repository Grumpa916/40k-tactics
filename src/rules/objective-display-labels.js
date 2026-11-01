import { getBattlePrimaryMissions, getEventCompanionMapLayout } from './event-companion-map-catalog.js';

const BATTLEFIELD_CENTER = Object.freeze({ x: 30, y: 22 });

function layoutGeometry(state) {
 const setup=state.battlefieldMap?.missionSetup;
 if(!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout)return null;
 const missions=getBattlePrimaryMissions(setup.myDisposition,setup.opponentDisposition);
 return missions?getEventCompanionMapLayout(missions.myMission,missions.opponentMission,setup.layout):null;
}

function distanceSquared(a,b) {
 return (a.x-b.x)**2 + (a.y-b.y)**2;
}

function comparePositionEntries([nameA,a],[nameB,b]) {
 return a.x-b.x || a.y-b.y || String(nameA).localeCompare(String(nameB));
}

// The Event Companion extraction preserves stable canonical objective IDs, but a few
// six-objective layouts use Central/Expansion source names that do not match the
// player's visual meaning of those roles. Display roles therefore come from the
// verified geometry: the objective(s) nearest battlefield centre are Center 1/2;
// the two remaining non-home objectives are the player/opponent expansions.
function geometryDisplayRoles(state, perspectivePlayerId) {
 const positions=layoutGeometry(state)?.objectivePositions;
 if(!positions)return null;
 const validEntries=Object.entries(positions).filter(([,point])=>
  point && Number.isFinite(point.x) && Number.isFinite(point.y));
 const nonHome=validEntries.filter(([name])=>!/home/i.test(name));
 if(nonHome.length<2)return null;

 const attacker=state.preGameSetup?.attackerPlayerId ?? null;
 const defender=state.preGameSetup?.defenderPlayerId ?? null;
 const roles=new Map();
 if(attacker && positions['Attacker Home'])roles.set('Attacker Home',attacker===perspectivePlayerId?'My Home':'Opponent Home');
 if(defender && positions['Defender Home'])roles.set('Defender Home',defender===perspectivePlayerId?'My Home':'Opponent Home');

 // Most layouts have two expansions; the four-objective layout has one.
 const centerCount=Math.max(1,nonHome.length-2);
 const centerEntries=[...nonHome]
  .sort((a,b)=>distanceSquared(a[1],BATTLEFIELD_CENTER)-distanceSquared(b[1],BATTLEFIELD_CENTER) || comparePositionEntries(a,b))
  .slice(0,centerCount)
  .sort(comparePositionEntries);
 const centerNames=new Set(centerEntries.map(([name])=>name));
 centerEntries.forEach(([name],index)=>roles.set(name,`Center ${index+1}`));

 const expansionEntries=nonHome.filter(([name])=>!centerNames.has(name));
 const myHomeName=perspectivePlayerId===attacker?'Attacker Home':
  perspectivePlayerId===defender?'Defender Home':null;
 const myHome=myHomeName?positions[myHomeName]:null;
 if(myHome && expansionEntries.length){
  const ranked=[...expansionEntries].sort((a,b)=>distanceSquared(a[1],myHome)-distanceSquared(b[1],myHome) || comparePositionEntries(a,b));
  if (ranked.length === 1) {
   const opponentHomeName=myHomeName==='Attacker Home'?'Defender Home':'Attacker Home';
   const opponentHome=positions[opponentHomeName];
   roles.set(ranked[0][0],opponentHome && distanceSquared(ranked[0][1],opponentHome)<distanceSquared(ranked[0][1],myHome)
    ? 'Opponent Expansion':'My Expansion');
  } else {
   roles.set(ranked[0][0],'My Expansion');
   for(const [name] of ranked.slice(1))roles.set(name,'Opponent Expansion');
  }
 }
 return roles;
}

export function perspectiveObjectiveName(name, state, perspectivePlayerId) {
  const geometryRole=geometryDisplayRoles(state,perspectivePlayerId)?.get(name);
  if(geometryRole)return geometryRole;

  const attacker = state.preGameSetup?.attackerPlayerId ?? null;
  const defender = state.preGameSetup?.defenderPlayerId ?? null;
  const homeOwner = name === "Attacker Home" ? attacker : name === "Defender Home" ? defender : null;
  if (homeOwner) return homeOwner === perspectivePlayerId ? "My Home" : "Opponent Home";
  if (name === "Expansion 1" || name === "Expansion 2") {
    const positions = layoutGeometry(state)?.objectivePositions ?? {};
    const myHomeName = perspectivePlayerId === attacker ? "Attacker Home" :
      perspectivePlayerId === defender ? "Defender Home" : null;
    const myHome = myHomeName ? positions[myHomeName] : null;
    const expansion1 = positions["Expansion 1"];
    const expansion2 = positions["Expansion 2"];
    if (myHome && expansion1 && expansion2) {
      const myExpansionName = distanceSquared(expansion1, myHome) <= distanceSquared(expansion2, myHome)
        ? "Expansion 1" : "Expansion 2";
      return name === myExpansionName ? "My Expansion" : "Opponent Expansion";
    }
  }
  if (name === "Central 1") return "Center 1";
  if (name === "Central 2") return "Center 2";
  return name;
}
export function compactObjectiveLabel(label) {
  return ({
    "My Home": "MY HOME",
    "Opponent Home": "OPP HOME",
    "My Expansion": "MY EXP",
    "Opponent Expansion": "OPP EXP",
    "Center 1": "C1",
    "Center 2": "C2"
  })[label] ?? label;
}

export function mapObjectiveMarkerLabel(label) {
 return ({
   "My Home": "mH",
   "Opponent Home": "oH",
   "My Expansion": "mE",
   "Opponent Expansion": "oE",
   "Center 1": "C1",
   "Center 2": "C2"
 })[label] ?? label;
}

function objectiveNameForId(state,id) {
 const objective=(state.objectives ?? []).find(o=>o.id===id);
 return objective?.layoutObjective ?? (id?.startsWith('event-companion:')?id.slice('event-companion:'.length):objective?.name ?? id);
}

export function objectiveAdvisorLabel(state,id,perspectivePlayerId) {
 const label=perspectiveObjectiveName(objectiveNameForId(state,id),state,perspectivePlayerId);
 const compact=compactObjectiveLabel(label);
 return label===compact?label:label+' ('+compact+')';
}

// Canonical compact text shown on battlefield objective markers and in Movement advice.
export function liveMapObjectiveLabel(state,id,perspectivePlayerId) {
 const label=perspectiveObjectiveName(objectiveNameForId(state,id),state,perspectivePlayerId);
 return mapObjectiveMarkerLabel(label);
}

// Retained for compatibility with older callers and saved verification helpers.
// Named live-map markers no longer expose this number to players.
export function liveMapObjectiveNumber(state, id) {
 const geometry=layoutGeometry(state);
 if(geometry){
  const names=Object.keys(geometry.objectivePositions ?? {});
  const objective=(state.objectives ?? []).find(item=>item.id===id);
  const name=objective?.layoutObjective ?? (String(id).startsWith('event-companion:')?String(id).slice('event-companion:'.length):null);
  const index=names.indexOf(name);
  return index < 0 ? null : index+1;
 }
 const objectives=(state.objectives ?? []).filter(item=>item?.position &&
  Number.isFinite(item.position.x) && Number.isFinite(item.position.y) &&
  item.position.x>=0 && item.position.x<=60 && item.position.y>=0 && item.position.y<=44);
 const index=objectives.findIndex(item=>item.id===id);
 return index < 0 ? null : index+1;
}
