import { getFormationObjectiveContribution } from '../rules/tactical-objective-swing.js';
import { getBattleUnitDatasheet, getCombatFormationMembers } from '../rules/battle-unit-reference.js';
import { getCasualtyLoadoutState, normalizeCasualtySelectionName } from '../rules/live-casualty-loadout.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';

// A potential formation total, not an objective-range or control ruling.
// Until multi-model Vexilla and other conditional modifiers are audited,
// do not present an incomplete number as a confirmed total.
export function getMapFormationOcPresentation(state, unit) {
  const result = getFormationObjectiveContribution(state, unit);
  if (result.battleShocked) return { label: 'OC 0', description: 'Battle-shocked: no usable objective control in the recorded state.' };
  if (!result.members.length || result.members.some(member => !Number.isFinite(member.total))) {
    return { label: 'OC ?', description: 'Formation objective control unknown: one or more surviving model counts or profiles are missing.' };
  }
  const members = getCombatFormationMembers(state, unit);
  let activeVexilla = 0;
  let bearerUncertain = false;
  for (const member of members) {
    const sheet = getBattleUnitDatasheet(state, member);
    if (!(sheet?.abilities ?? []).some(ability => ability.name === 'Vexilla')) continue;
    const loadout = getCasualtyLoadoutState(state, member);
    const quantity = loadout?.activeSelections?.vexilla ?? 0;
    if (!quantity) continue;
    activeVexilla += quantity;
    const vitals = getLiveUnitVitals(state, member);
    const recorded = Object.keys(member.liveWargear?.activeSelections ?? {})
      .some(name => normalizeCasualtySelectionName(name) === 'vexilla');
    if (vitals.models !== vitals.startingModels && !recorded) bearerUncertain = true;
  }
  // Vexilla affects every surviving model in the attached unit, including
  // its Leader, while its bearer survives. Do not guess after an unidentified
  // casualty or when more than one potential bearer is recorded.
  const possibleVexilla = bearerUncertain || activeVexilla > 1;
  const vexillaBonus = activeVexilla === 1 && !possibleVexilla
    ? result.members.reduce((sum, member) => sum + member.models, 0) : 0;
  const total = result.effectiveOc + vexillaBonus;
  if (possibleVexilla) return { label: 'OC ~' + total, description: 'Base recorded formation OC: ' + total + '. Vexilla bearer or modifier needs tabletop confirmation; not included.' };
  const estimated = result.confidence === 'low';
  return { label: 'OC ' + (estimated ? '~' : '') + total, description: (estimated ? 'Estimated' : 'Recorded') + ' formation OC: ' + total + '. Potential unit total; confirm untracked modifiers and models actually within objective range at the table.' };
}
