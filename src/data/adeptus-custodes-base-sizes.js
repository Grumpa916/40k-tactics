/**
 * Adeptus Custodes physical base sizes (mm), separate from on-screen token size.
 * Primary source: Games Workshop Warhammer Event Companion, June 2026,
 * Base Size Guide p.56. The event guide is authoritative for listed kits.
 * https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf
 *
 * New 2026 datasheet names are linked to the same miniatures where appropriate.
 * Where an entirely new kit is absent from that Event Companion, record its
 * box contents and distinctly label the source as "kit", not "official guide".
 * Neither a display base nor these dimensions changes game-state positions.
 */
import { getSpaceMarinesBaseSize } from './space-marines-base-sizes.js';

export const CUSTODES_BASE_GUIDE_URL = 'https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf';
export const CUSTODES_BASE_GUIDE_LABEL = 'GW Warhammer Event Companion (2026), p. 56';

function normalize(value) {
  return String(value ?? '').normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function record(name, shape, widthMm = null, lengthMm = null, source = 'event-guide', sourceUrl = CUSTODES_BASE_GUIDE_URL) {
  return Object.freeze({name, shape, widthMm, lengthMm, source, sourceUrl});
}
const round = (name, diameter) => record(name, 'round', diameter, diameter);
const oval = (name, length, width) => record(name, 'oval', length, width);
const hull = name => record(name, 'hull');

export const ADEPTUS_CUSTODES_BASE_CATALOG = Object.freeze([
  round('Aleya',32),
  round('Allarus Custodians',40),
  hull('Anathema Psykana Rhino'),
  round('Blade Champion',40),
  round('Custodian Guard',40),
  round('Custodian Wardens',40),
  round('Knight-Centura',32),
  round('Prosecutors',32),
  round('Shield-Captain',40),
  round('Shield-Captain in Allarus Terminator Armour',40),
  oval('Shield-Captain on Dawneagle Jetbike',75,42),
  round('Trajann Valoris',40),
  round('Valerian',40),
  round('Venerable Contemptor Dreadnought',60),
  hull('Venerable Land Raider'),
  oval('Vertus Praetors',75,42),
  round('Vigilators',32),
  round('Witchseekers',32),
  oval('Agamatus Custodians',75,42),
  round('Aquilon Custodians',50),
  round('Ares Gunship',160),
  oval('Caladius Grav-tank',170,109),
  round('Contemptor-Achillus Dreadnought',60),
  round('Contemptor-Galatus Dreadnought',60),
  oval('Coronus Grav-carrier',170,109),
  round('Custodian Guard with Adrasite and Pyrithite Spears',40),
  round('Orion Assault Dropship',160),
  oval('Pallas Grav-attack',105,70),
  round('Sagittarum Custodians',40),
  round('Telemon Heavy Dreadnought',100),
  round('Venatari Custodians',40),
  // New 11th edition kits not individually listed in the June Event Companion.
  record('Gyrfalcon Jetbike Sodality','oval',90,52,'kit',
    'https://www.gamersguildusa.com/products/warhammer-40k-horus-heresy-custodes-gyrfalcon-jetbike-sodality'),
  record('Caladius Annihilator Grav-Tank','oval',150,95,'kit',
    'https://www.miniaturemarket.com/Warhammer-Horus-Heresy-Legio-Custodes-Caladius-Annihilator-Grav-Tank/GW-31-139-2026')
]);
const byName = new Map(ADEPTUS_CUSTODES_BASE_CATALOG.map(item => [normalize(item.name), item]));

// These current datasheet names represent the listed GW kits. No generic
// substring matching: an unfamiliar or similarly named kit remains unverified.
const aliases = new Map(Object.entries({
  'Custodian Guard Sodality':'Custodian Guard',
  'Sentinel Guard Sodality':'Custodian Guard',
  'Custodian Guard Sodality with Adrasite Spears':'Custodian Guard with Adrasite and Pyrithite Spears',
  'Custodian Guard Sodality with Pyrithite Spears':'Custodian Guard with Adrasite and Pyrithite Spears',
  'Sagittarum Custodians Sodality':'Sagittarum Custodians',
  'Aquilon Terminators with Solarite Power Gauntlets':'Aquilon Custodians',
  'Aquilon Terminators with Solarite Power Talons':'Aquilon Custodians',
  'Venatari with Kinetic Destroyers':'Venatari Custodians',
  'Venatari with Verutum Lances':'Venatari Custodians',
  'Prosecutor Squad':'Prosecutors',
  'Witchseeker Squad':'Witchseekers',
  'Vigilator Squad':'Vigilators'
}).map(([alias, officialName]) => [normalize(alias), normalize(officialName)]));

export function getAdeptusCustodesBaseSize(unit) {
  if (!unit) return null;
  const faction = normalize(unit.faction ?? unit.metadata?.faction ?? unit.factionName);
  if (faction && faction !== 'adeptus custodes') return null;
  const datasheetId = unit.metadata?.datasheetId ?? unit.datasheetId;
  const key = String(datasheetId ?? unit.id ?? '').split(':');
  const declaredFaction = datasheetId && key.length > 1 ? normalize(key[0]) : '';
  if (declaredFaction && declaredFaction !== 'adeptus custodes') return null;
  for (const candidate of [key.at(-1), unit.name]) {
    const name = normalize(candidate);
    const base = byName.get(name) ?? byName.get(aliases.get(name));
    if (base) return base;
  }
  return null;
}

export function modelBaseSizeForUnit(unit, manual = null) {
  const override = manual && Number(manual.width);
  const length = manual?.length === '' || manual?.length == null ? override : Number(manual.length);
  if (Number.isFinite(override) && Number.isFinite(length) && override >= 1 && override <= 400 && length >= 1 && length <= 400) {
    return Object.freeze({
      name: unit?.name ?? '', shape: override === length ? 'round' : 'oval',
      widthMm: override, lengthMm: length, source:'manual', sourceUrl:null
    });
  }
  const faction = normalize(unit?.faction ?? unit?.metadata?.faction ?? unit?.factionName);
  const datasheetId = unit?.metadata?.datasheetId ?? unit?.datasheetId;
  const declaredFaction = datasheetId ? normalize(String(datasheetId).split(':')[0]) : '';
  if (faction === 'space marines' || declaredFaction === 'space marines') return getSpaceMarinesBaseSize(unit);
  if (faction === 'adeptus custodes' || declaredFaction === 'adeptus custodes') return getAdeptusCustodesBaseSize(unit);
  return getAdeptusCustodesBaseSize(unit) ?? getSpaceMarinesBaseSize(unit);
}

export function modelBaseSizeLabel(base) {
  if (!base) return 'No verified base size';
  if (base.shape === 'hull') return 'Hull (no standard base)';
  if (base.shape === 'unique') return 'Unique base (confirm with event organiser)';
  return base.shape === 'round' ? String(base.widthMm) + 'mm round' :
    String(base.widthMm) + '×' + String(base.lengthMm) + 'mm oval';
}
