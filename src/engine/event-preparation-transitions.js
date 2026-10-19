import { PREPARATION_STEPS, preparationStep, preparationIssues, deploymentUnits, attachmentParent, formationFor } from '../rules/event-preparation.js';
import { appendHistoryEntry } from '../state/history.js';
import { createEvent } from '../events/event.js';

export function updatePreparation(state, payload = {}) {
  if (!['setup', 'deployment'].includes(state.battle?.status)) throw new Error('Preparation is closed after battle starts.');
  const step = preparationStep(state);
  let prep = { version: 1, ...state.preparation, step };
  let next = state;
  const { action, unitId, kind, transportId, playerId, note } = payload;
  if (action === 'review-legacy') {
    if (state.preparation || state.battle.status !== 'deployment') throw new Error('Only older deployment saves need this review.');
    prep = {version:1, step:'mission', confirmed:[], formations:Object.fromEntries(deploymentUnits(state).map(u => [u.id,{kind:state.battlefieldMap?.declaredReserves?.[u.id]?'reserve':'field',source:'legacy-review'}]))};
    next = {...state, phase:'setup', battle:{...state.battle,status:'setup'}};
  } else if (action === 'back') {
    const i = PREPARATION_STEPS.findIndex(x => x.id === step);
    if (i <= 0 || i >= 5) throw new Error('Use the current deployment checkpoint; earlier declarations are locked.');
    prep = { ...prep, step: PREPARATION_STEPS[i - 1].id, confirmed: (prep.confirmed ?? []).slice(0, i - 1) };
  } else if (action === 'formation') {
    if (!['formations', 'redeployment', 'pre-battle'].includes(step)) throw new Error('Formation changes are not available at this checkpoint.');
    const unit = deploymentUnits(state).find(u => u.id === unitId);
    if (!unit || !['field','reserve','embarked'].includes(kind)) throw new Error('Choose a valid unit and location.');
    if (step !== 'formations' && kind === 'embarked') throw new Error('Declare passengers before deployment.');
    if (kind === 'embarked' && (!transportId || transportId === unitId)) throw new Error('Choose another friendly transport.');
    prep = { ...prep, formations: { ...prep.formations, [unitId]: { kind, ...(kind === 'embarked' ? { transportId } : {}), source: step } }, reserveReview: {} };
    if (kind === 'embarked') {
      const t = state.units.find(u => u.id === transportId && u.ownerId === unit.ownerId && u.status !== 'destroyed');
      if (!t || attachmentParent(state,t) || formationFor({ ...state, preparation: prep }, t).kind === 'embarked') throw new Error('Choose a friendly, non-embarked transport.');
    }
    const members = state.units.filter(u => u.id === unitId || attachmentParent(state,u) === unitId).map(u => u.id);
    const actualDeployment = { ...state.battlefieldMap?.actualDeployment };
    const declaredReserves = { ...state.battlefieldMap?.declaredReserves };
    for (const id of members) {
      delete actualDeployment[id]; delete declaredReserves[id];
      if (kind === 'reserve') declaredReserves[id] = true;
    }
    next = { ...state, units: state.units.map(u => members.includes(u.id) ? { ...u, status: kind === 'embarked' ? 'embarked' : 'reserves', position: null, transportId: kind === 'embarked' ? transportId : null } : u), battlefieldMap: { ...state.battlefieldMap, actualDeployment, declaredReserves } };
  } else if (action === 'reserve-review') {
    if (step !== 'formations' || !state.players.some(p => p.id === playerId) || !note?.trim()) throw new Error('Record the tabletop reserve total or rule exception.');
    prep = { ...prep, reserveReview: { ...prep.reserveReview, [playerId]: note.trim().slice(0,500) } };
  } else if (action === 'first-player') {
    if (step !== 'first-turn' || !state.players.some(p => p.id === playerId)) throw new Error('Record the roll winner after redeployment.');
    prep = { ...prep, firstPlayerId: playerId };
  } else if (action === 'confirm') {
    const index = PREPARATION_STEPS.findIndex(x => x.id === step);
    if (index > 0) requirePreparationComplete(state, PREPARATION_STEPS[index-1].id);
    const issues = preparationIssues(state);
    if (issues.length) throw new Error(issues.join('; '));
    if (step === 'ready') throw new Error('Use Begin battle.');
    const i = PREPARATION_STEPS.findIndex(x => x.id === step);
    prep = { ...prep, step: PREPARATION_STEPS[i+1].id, confirmed: [...new Set([...(prep.confirmed ?? []),step])] };
  } else throw new Error('Unknown preparation action.');
  return appendHistoryEntry({ ...next, preparation: prep }, createEvent('battle.preparation_updated', { ...payload, step }));
}

export function requirePreparationComplete(state, through) {
  const i = PREPARATION_STEPS.findIndex(x => x.id === through);
  const required = PREPARATION_STEPS.slice(0,i+1).map(x => x.id);
  if (!required.every(id => state.preparation?.confirmed?.includes(id))) throw new Error('Complete the guided preparation checkpoints before continuing.');
}
