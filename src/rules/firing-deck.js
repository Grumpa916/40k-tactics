import { getBattleUnitDatasheet } from './battle-unit-reference.js';
import { getDatasheetWeaponOptions } from './saved-roster-combat-profile.js';
import { getSpaceMarinesWargearRuleSet } from '../data/space-marines-wargear-rules.js';
import { formationFor } from './event-preparation.js';

/** Read "Firing Deck N" only from text already stored on the transport. */
export function firingDeckCapacityFromText(text) {
  const match = String(text ?? '').match(/Firing Deck\s+(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function abilityText(ability) {
  if (!ability) return '';
  if (typeof ability === 'string') return ability;
  return `${ability.name ?? ''} ${ability.description ?? ''}`;
}

export function getFiringDeckCapacity(state, transport) {
  if (!transport) return null;
  const datasheet = getBattleUnitDatasheet(state, transport);
  const chunks = (datasheet?.abilities ?? []).map(abilityText);
  const roster = state?.armyRosters?.[transport.ownerId]?.units?.find(item => item.id === transport.metadata?.rosterUnitId);
  const datasheetId = roster?.datasheetId ?? transport.metadata?.datasheetId ?? datasheet?.id ?? null;
  chunks.push(...(getSpaceMarinesWargearRuleSet(datasheetId)?.manualWargearNotes ?? []));
  for (const chunk of chunks) {
    const capacity = firingDeckCapacityFromText(chunk);
    if (capacity) return capacity;
  }
  return null;
}

export function weaponIsHazardous(weapon) {
  const parts = [
    weapon?.abilities,
    weapon?.characteristics?.abilities,
    ...(Array.isArray(weapon?.keywords) ? weapon.keywords : [])
  ];
  return parts.some(part => /\bhazardous\b/i.test(String(part ?? ''))) || weapon?.characteristics?.hazardous === true;
}

function modelCount(state, unit) {
  const roster = state?.armyRosters?.[unit.ownerId]?.units?.find(item => item.id === unit.metadata?.rosterUnitId);
  const count = roster?.modelCount ?? unit.modelCount ?? unit.metadata?.modelCount;
  return Number.isInteger(count) && count > 0 ? count : 1;
}

export function getEmbarkedPassengers(state, transport) {
  if (!transport) return [];
  return (state?.units ?? [])
    .filter(unit => unit && unit.id !== transport.id && unit.ownerId === transport.ownerId && unit.status !== 'destroyed')
    .filter(unit => {
      const formation = formationFor(state, unit);
      return (unit.status === 'embarked' && unit.transportId === transport.id) ||
        (formation.kind === 'embarked' && formation.transportId === transport.id);
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

/** Whole embarked units whose model count still fits in the reviewed Firing Deck value. */
export function firingDeckEligiblePassengers(state, transport) {
  const capacity = getFiringDeckCapacity(state, transport);
  if (!capacity) return [];
  const eligible = [];
  let used = 0;
  for (const unit of getEmbarkedPassengers(state, transport)) {
    const models = modelCount(state, unit);
    if (used + models > capacity) continue;
    used += models;
    eligible.push(unit);
  }
  return eligible;
}

export function getFiringDeckWeaponOptions(state, transport) {
  if (!transport || transport.status === 'destroyed') return [];
  if (!getFiringDeckCapacity(state, transport)) return [];
  return firingDeckEligiblePassengers(state, transport).flatMap(unit =>
    getDatasheetWeaponOptions(state, unit, { type: 'ranged' }).map(weapon => {
      const hazardous = weaponIsHazardous(weapon);
      const profileName = weapon.profileName ?? weapon.name;
      const label = `${unit.name ?? unit.id} · ${profileName}`;
      return {
        ...weapon,
        id: `${weapon.id}:firing-deck`,
        firingDeck: true,
        firingDeckTransportId: transport.id,
        hazardousBearerId: hazardous ? unit.id : null,
        name: label,
        displayName: label,
        profileName,
        sourceUnitId: unit.id,
        sourceUnitName: unit.name ?? unit.id,
        formationUnitId: transport.id
      };
    })
  );
}

export function hazardousBearerForWeapon(weapon) {
  if (!weapon?.firingDeck || !weaponIsHazardous(weapon)) return null;
  return weapon.sourceUnitId ?? null;
}
