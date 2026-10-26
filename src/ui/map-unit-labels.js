// Display labels only: unit IDs, names and gameplay state remain unchanged.
const SHORT_NAMES = {
  'norn emissary': 'Norn Emiss.',
  'norn assimilator': 'Norn Assim.',
  'winged hive tyrant': 'Winged Tyrant',
  'winged tyranid prime': 'Winged Prime',
  'tyranid warriors with ranged bio-weapons': 'Warriors Rng',
  'tyranid warriors with melee bio-weapons': 'Warriors Mel',
  'screamer-killer': 'Scream-Killer',
};

export function shortMapUnitName(unit) {
  const name = String(unit?.name || unit?.id || 'Unit').trim().replace(/\s+/g, ' ');
  const known = SHORT_NAMES[name.toLowerCase()];
  if (known) return known;
  if (name.length <= 12) return name;
  const words = name.split(' ');
  const shorten = (word, length) => word.length <= length ? word : word.slice(0, length - 1) + '…';
  if (words.length === 1) return shorten(name, 12);
  // Keep both the beginning and distinguishing final word of unfamiliar names.
  return shorten(words[0], 5) + ' ' + shorten(words.at(-1), 6);
}

export function mapUnitLabels(units = []) {
  const groups = new Map();
  for (const unit of units) {
    if (!unit?.id) continue;
    const label = shortMapUnitName(unit);
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
export function unitDisplayLabels(units = []) {
  const groups = new Map();
  for (const unit of units) {
    if (!unit?.id) continue;
    const label = shortMapUnitName(unit);
    const key = JSON.stringify([unit.ownerId, label.toLowerCase()]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(unit);
  }
  const labels = new Map();
  for (const group of groups.values()) {
    group.forEach((unit, index) => {
      const name = String(unit.name || unit.id || 'Unit').trim().replace(/\\s+/g, ' ');
      labels.set(unit.id, name + (group.length > 1 ? ' ' + (index + 1) : ''));
    });
  }
  return labels;
}
