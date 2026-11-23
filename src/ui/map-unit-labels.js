// Display labels only: unit IDs, names and gameplay state remain unchanged.
const SHORT_NAMES = {
  'norn emissary': 'Norn Em',
  'norn assimilator': 'Norn As',
  'winged hive tyrant': 'Wing Tyr',
  'winged tyranid prime': 'Wing Prime',
  'tyranid warriors with ranged bio-weapons': 'War R',
  'tyranid warriors with melee bio-weapons': 'War M',
  'screamer-killer': 'Scream K',
  'hive tyrant': 'Hive Tyrant',
  'tyrannofex': 'Tfex',
  'hormagaunts': 'Horm',
  'termagants': 'Term',
  'carnifexes': 'Carns',
  'trajann valoris': 'Trajann',
  'blade champion': 'B. Champ',
  'shield-captain': 'S. Capt',
  'sentinel guard sodality': 'Sent',
  'custodian guard': 'Cust G',
  'custodian guard sodality': 'Cust G',
  'custodian wardens': 'Wardens',
  'aquilon terminators with solarite power talons': 'Aquil T',
  'aquilon terminators with solarite power gauntlets': 'Aquil G',
  'prosecutor squad': 'Pros',
};

// Longer phrases first so a variant is not swallowed by a shorter token.
const DESIGNATOR_TOKENS = [
  ['venatari with verutum lances', 'VnL'],
  ['venatari with kinetic destroyers', 'VnD'],
  ['venatari with lances', 'VnL'],
  ['venerable contemptor', 'VCD'],
  ['contemptor galatus', 'CGD'],
  ['contemptor achillus', 'CAD'],
  ['galatus', 'CGD'],
  ['achillus', 'CAD'],
  ['telemon', 'TEL'],
  ['ballistus', 'BAD'],
  ['brutalis', 'BRD'],
  ['redemptor', 'RED']
];

// Tags are the upgrade names already stored by the Custodes roster, not new rules.
const UPGRADE_TAGS = [
  ['memento moritoi', 'Memento Moritoi', 'MM'],
  ['augury uplink', 'Augury Uplink', 'AU']
];

function normalizeLabel(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function preferredMapUnitDesignator(unit) {
  const datasheetId = unit?.metadata?.datasheetId ?? unit?.datasheetId;
  const sources = [
    normalizeLabel(String(datasheetId ?? '').split(':').at(-1)),
    normalizeLabel(unit?.name)
  ].filter(Boolean);
  for (const [token, designator] of DESIGNATOR_TOKENS) {
    if (sources.some(source => source === token || source.includes(token))) return designator;
  }
  return null;
}

export function mapUnitUpgradeNames(unit, state = null) {
  const rosterUnits = state?.armyRosters?.[unit?.ownerId]?.units;
  const rosterUnit = rosterUnits?.find(item => item?.id === unit?.metadata?.rosterUnitId);
  const source = rosterUnit?.unitUpgrades ?? unit?.unitUpgrades ?? [];
  const names = source.map(item => typeof item === 'string' ? item : item?.name ?? item?.id).filter(Boolean);
  const known = [];
  for (const name of names) {
    const key = normalizeLabel(name);
    const match = UPGRADE_TAGS.find(([token]) => key === token);
    if (match && !known.includes(match[1])) known.push(match[1]);
  }
  return known;
}

export function mapUnitUpgradeTag(unit, state = null) {
  return mapUnitUpgradeNames(unit, state).map(name => UPGRADE_TAGS.find(([, label]) => label === name)[2]).join('/');
}

export function shortMapUnitName(unit, state = null) {
  const preferred = preferredMapUnitDesignator(unit);
  const upgrade = state ? mapUnitUpgradeTag(unit, state) : '';
  if (preferred) return upgrade ? preferred + '/' + upgrade : preferred;
  const name = String(unit?.name || unit?.id || 'Unit').trim().replace(/\s+/g, ' ');
  const known = SHORT_NAMES[name.toLowerCase()];
  if (known) return known;
  if (name.length <= 15) return name;
  // Generic roster words use map space without helping identify the unit.
  const words = name.split(' ').filter(word => !/^(?:a|an|in|of|the|with|squad|armour|armor)$/i.test(word));
  if (words.length === 1) return words[0].length <= 15 ? words[0] : words[0].slice(0, 14) + '…';
  const first = words[0] ?? name;
  const second = words[1] ?? '';
  if (!second) return first.slice(0, 15);
  if (first.length >= 14) return first.slice(0, 14) + '…';
  const available = 15 - first.length - 1;
  return first + ' ' + (second.length <= available ? second : second.slice(0, available - 1) + '.');
}

export function mapUnitLabels(units = [], state = null) {
  const groups = new Map();
  for (const unit of units) {
    if (!unit?.id) continue;
    const label = shortMapUnitName(unit, state);
    const key = JSON.stringify([unit.ownerId, label.toLowerCase()]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: unit.id, label });
  }
  const labels = new Map();
  // Use the complete roster, including reserves and casualties, so labels do not
  // change as markers disappear or when the map perspective changes.
  for (const group of groups.values()) {
    group.forEach(({ id, label }, index) => labels.set(id, label + (group.length > 1 ? ' ' + (index + 1) : '')));
  }
  return labels;
}

// Full names for selectors and advisor text, using the same stable suffixes as
// the map so a player can identify a duplicate consistently across the UI.
export function unitDisplayLabels(units = [], state = null) {
  const groups = new Map();
  for (const unit of units) {
    if (!unit?.id) continue;
    const label = shortMapUnitName(unit, state);
    const key = JSON.stringify([unit.ownerId, label.toLowerCase()]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(unit);
  }
  const labels = new Map();
  for (const group of groups.values()) {
    group.forEach((unit, index) => {
      const name = String(unit.name || unit.id || 'Unit').trim().replace(/\s+/g, ' ');
      const upgrades = state ? mapUnitUpgradeNames(unit, state) : [];
      const shown = upgrades.length ? name + ' · ' + upgrades.join(', ') : name;
      labels.set(unit.id, shown + (group.length > 1 ? ' ' + (index + 1) : ''));
    });
  }
  return labels;
}
