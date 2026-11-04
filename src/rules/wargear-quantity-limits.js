/**
 * Count equipment whose allowed quantity depends on models in a unit.
 * perModels is an explicit "one per N models" cap, not a per-model slot.
 * Keep this separate from wargear-state and validation modules.
 */
export function getOptionalWargearLimit(modelCount, selection) {
 const size=Number(modelCount);
 if(!Number.isInteger(size)||size<1)return 0;
 const groupSize=Number(selection?.perModels);
 if(Number.isInteger(groupSize)&&groupSize>0) {
  const maxEach=Number(selection?.maxEach ?? 1);
  return Math.max(0,Math.floor(size/groupSize)*(Number.isInteger(maxEach)&&maxEach>0?maxEach:1));
 }
 const perModel=Number(selection?.perModel ?? 1);
 return Number.isFinite(perModel)&&perModel>=0 ? Math.max(0,size*perModel):0;
}
