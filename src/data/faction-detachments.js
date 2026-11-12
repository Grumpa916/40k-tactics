import { SPACE_MARINES_DETACHMENTS } from './space-marines-rules.js';
import { ADEPTUS_CUSTODES_DETACHMENTS } from './adeptus-custodes-faction-rules.js';

export const DETACHMENT_POINT_BUDGET = 3;

// 11th-edition Tyranid detachment benefits and allowed dispositions.
// Reference cross-check: https://tactical40k.com/codex/tyranids (30 Oct 2026).
// The October GW Faction Pack PDF remains pending direct comparison.
export const TYRANID_DETACHMENTS = Object.freeze([
  { name: 'Ambush Predators', forceDisposition: 'Disruption', detachmentPoints: 1,
    ruleName:'Mindhunger', ruleSummary:'Deathleaper, Lictors and Neurolictors gain Deep Strike; Lictors and Neurolictors re-roll Hit rolls of 1 against Characters.' },
  { name: 'Assimilation Swarm', forceDisposition: 'Priority Assets', detachmentPoints: 2,
    ruleName:'Feed the Swarm', ruleSummary:'In Command, each Harvester can regenerate a nearby Tyranid unit, restoring wounds or destroyed Infantry.' },
  { name: 'Crusher Stampede', forceDisposition: 'Purge the Foe', detachmentPoints: 2,
    ruleName:'Enraged Behemoths', ruleSummary:'Monster models gain Hit/Wound bonuses as they are weakened; full-strength unshocked Monsters gain 2 OC.' },
  { name: 'Invasion Fleet', forceDisposition: 'Take and Hold', forceDispositionOptions: Object.freeze(['Priority Assets','Take and Hold']), detachmentPoints: 3,
    ruleName:'Hyper-adaptations', ruleSummary:'Choose a battle-long adaptation: Sustained Hits vs Infantry/Swarm, Lethal Hits vs Monster/Vehicle, or Precision against Characters on Critical Hits.' },
  { name: 'Subterranean Assault', forceDisposition: 'Disruption', forceDispositionOptions: Object.freeze(['Reconnaissance','Disruption']), detachmentPoints: 3,
    ruleName:'Surprise Assault', ruleSummary:'Tyranid attacks re-roll Hit rolls of 1; Burrowers create Tunnel Markers for reserves deployment. Up to two Trygons may gain CHARACTER.' },
  { name: 'Synaptic Nexus', forceDisposition: 'Disruption', detachmentPoints: 2,
    ruleName:'Synaptic Imperatives', ruleSummary:'Once per battle round select an unused Imperative to protect, speed, or empower melee attacks of units within Synapse Range.' },
  { name: 'Talons of the Norn Queen', forceDisposition: 'Take and Hold', detachmentPoints: 1,
    ruleName:'Higher Imperatives', ruleSummary:'Each Norn Emissary or Assimilator may once per battle replace its Singular Purpose choice in Command phase.' },
  { name: 'Unending Swarm', forceDisposition: 'Take and Hold', detachmentPoints: 2,
    ruleName:'Insurmountable Odds', ruleSummary:'Endless Multitude units can surge up to D6 inches after losing a model to enemy shooting.' },
  { name: 'Vanguard Onslaught', forceDisposition: 'Reconnaissance', detachmentPoints: 2,
    ruleName:'Questing Tendrils', ruleSummary:'Tyranid units may charge after falling back; Vanguard Invader units may also charge after advancing.' },
  { name: 'Warrior Bioform Onslaught', forceDisposition: 'Take and Hold', detachmentPoints: 1,
    ruleName:'Leader-beasts', ruleSummary:'Tyranid Warriors gain the Battleline keyword; Warriors and Tyranid Prime models gain a 5+ invulnerable save.' }
].map(item=>Object.freeze({
  ...item,
  forceDispositionOptions:item.forceDispositionOptions??Object.freeze([item.forceDisposition]),
  ruleReferenceStatus:'current-october-secondary-cross-check-gw-pdf-not-retrieved',
  ruleSourceUrl:'https://tactical40k.com/codex/tyranids'
})));

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
  if (norm(faction) === 'space marines') {
    return Object.freeze([{ tag: 'Doctrines', max: 1 }]);
  }
  return Object.freeze([]);
}
