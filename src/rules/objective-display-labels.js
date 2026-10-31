import { getBattlePrimaryMissions, getEventCompanionMapLayout } from './event-companion-map-catalog.js';
function layoutGeometry(state) {
 const setup=state.battlefieldMap?.missionSetup;
 if(!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout)return null;
 const missions=getBattlePrimaryMissions(setup.myDisposition,setup.opponentDisposition);
 return missions?getEventCompanionMapLayout(missions.myMission,missions.opponentMission,setup.layout):null;
}
export function perspectiveObjectiveName(name, state, perspectivePlayerId) {
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
      const distance = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
      const myExpansionName = distance(expansion1, myHome) <= distance(expansion2, myHome)
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

export function objectiveAdvisorLabel(state,id,perspectivePlayerId) {
 const objective=(state.objectives ?? []).find(o=>o.id===id);
 const name=objective?.layoutObjective ?? (id?.startsWith('event-companion:')?id.slice('event-companion:'.length):objective?.name ?? id);
 const label=perspectiveObjectiveName(name,state,perspectivePlayerId);
 const compact=compactObjectiveLabel(label);
 return label===compact?label:label+' ('+compact+')';
}

// Live map markers are numbered in rendered order: layout objectives use the
// Event Companion geometry order, otherwise positioned state objectives do.
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
