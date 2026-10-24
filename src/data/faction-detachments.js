import { SPACE_MARINES_DETACHMENTS } from './space-marines-rules.js';
import { ADEPTUS_CUSTODES_DETACHMENTS } from './adeptus-custodes-faction-rules.js';

export const DETACHMENT_POINT_BUDGET = 3;

export const TYRANID_DETACHMENTS = Object.freeze([
  { name: 'Ambush Predators', forceDisposition: 'Disruption', detachmentPoints: 1 },
  { name: 'Assimilation Swarm', forceDisposition: 'Priority Assets', detachmentPoints: 2 },
  { name: 'Crusher Stampede', forceDisposition: 'Purge the Foe', detachmentPoints: 2 },
  { name: 'Invasion Fleet', forceDisposition: 'Take and Hold', detachmentPoints: 3 },
  { name: 'Subterranean Assault', forceDisposition: 'Disruption', detachmentPoints: 3 },
  { name: 'Synaptic Nexus', forceDisposition: 'Disruption', detachmentPoints: 2 },
  { name: 'Talons of the Norn Queen', forceDisposition: 'Take and Hold', detachmentPoints: 1 },
  { name: 'Unending Swarm', forceDisposition: 'Take and Hold', detachmentPoints: 2 },
  { name: 'Vanguard Onslaught', forceDisposition: 'Reconnaissance', detachmentPoints: 2 },
  { name: 'Warrior Bioform Onslaught', forceDisposition: 'Take and Hold', detachmentPoints: 1 }
].map(Object.freeze));

const norm = value => String(value ?? '').trim().toLowerCase();

export function getFactionDetachments(faction) {
  switch (norm(faction)) {
    case 'tyranids': return TYRANID_DETACHMENTS;
    case 'space marines': return SPACE_MARINES_DETACHMENTS;
    case 'adeptus custodes': return ADEPTUS_CUSTODES_DETACHMENTS;
    default: return Object.freeze([]);
  }
}

export function getFactionDetachmentRestrictions(faction) {
  if (norm(faction) === 'adeptus custodes') {
    return Object.freeze([{ tag: 'Shield Host', max: 1 }]);
  }
  return Object.freeze([]);
}
