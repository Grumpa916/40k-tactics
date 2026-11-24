import { getFormationObjectiveContribution } from '../rules/tactical-objective-swing.js';
import { getBattleUnitDatasheet, getCombatFormationMembers } from '../rules/battle-unit-reference.js';
import { getCasualtyLoadoutState } from '../rules/live-casualty-loadout.js';
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
  let possibleVexilla = false;
  let soloBonus = 0;
  for (const member of members) {
    const sheet = getBattleUnitDatasheet(state, member);
    if (!(sheet?.abilities ?? []).some(ability => ability.name === 'Vexilla')) continue;
    const loadout = getCasualtyLoadoutState(state, member);
    const vitals = getLiveUnitVitals(state, member);
    const active = loadout?.activeSelections?.vexilla;
    if (!active) continue;
    const bearerUncertain = vitals.models !== vitals.startingModels &&
      !Object.hasOwn(member.liveWargear?.activeSelections ?? {}, 'vexilla');
    if (members.length === 1 && vitals.models === 1 && !bearerUncertain) soloBonus = 1;
    else possibleVexilla = true;
  }
  const total = result.effectiveOc + soloBonus;
  if (possibleVexilla) return { label: 'OC ~' + total, description: 'Base recorded formation OC: ' + total + '. Vexilla modifier or surviving bearer needs tabletop confirmation; not included.' };
  const estimated = result.confidence === 'low';
  return { label: 'OC ' + (estimated ? '~' : '') + total, description: (estimated ? 'Estimated' : 'Recorded') + ' formation OC: ' + total + '. Potential unit total; confirm untracked modifiers and models actually within objective range at the table.' };
}
