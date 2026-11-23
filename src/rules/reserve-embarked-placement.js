import { formationFor } from './event-preparation.js';
import { assessDeploymentEmbarkation } from './deployment-transport-eligibility.js';

export function placementConfirmation(unitName, vehicleName) {
  return `Confirm that unit ${unitName} is embarked in vehicle ${vehicleName} and in reserves.`;
}

function transportFor(state, unit) {
  const formation = formationFor(state, unit);
  const transportId = formation.kind === 'embarked' ? formation.transportId : unit?.transportId ?? null;
  if (!transportId) return null;
  return (state.units ?? []).find(item => item.id === transportId) ?? null;
}

function markedInReserves(state, unit) {
  if (!unit) return false;
  const formation = formationFor(state, unit);
  return formation.kind === 'reserve' || unit.status === 'reserves' || state.battlefieldMap?.declaredReserves?.[unit.id] === true;
}

/**
 * Embarked and reserves are separate checks.
 * A legal passenger on the table passes only the embarked check.
 * A unit in strategic reserves passes only the reserves check.
 * A passenger whose transport is in reserves passes both, and a claimed
 * off-table placement that passes neither, asks for the same confirmation.
 */
export function assessReserveEmbarkedPlacement(state, unit) {
  if (!unit) return { embarked: false, reserves: false, confirmation: null };
  const formation = formationFor(state, unit);
  const transport = transportFor(state, unit);
  const claimsEmbarked = formation.kind === 'embarked' || unit.status === 'embarked';
  const embarked = claimsEmbarked && Boolean(transport) && assessDeploymentEmbarkation(state, unit, transport).ok === true;
  const reserves = claimsEmbarked ? embarked && markedInReserves(state, transport) : markedInReserves(state, unit);
  const offTable = claimsEmbarked || markedInReserves(state, unit);
  const needsConfirmation = Boolean(transport?.name) && ((embarked && reserves) || (offTable && !embarked && !reserves));
  return {
    embarked,
    reserves,
    confirmation: needsConfirmation ? placementConfirmation(unit.name, transport.name) : null
  };
}
