// Match whole ability tokens: a conditional bonus must never become unconditional.
export function weaponAbilityCharacteristics(abilities) {
  const result = {}, conditionalAbilities = [];
  for (const token of String(abilities ?? '').split(/[,;\n]+/).map(value => value.trim()).filter(Boolean)) {
    const conditional = token.match(/^(Sustained Hits\s+(\d+)|Devastating Wounds)\s+vs\s+(non-Monster\/Vehicle|Psyker)$/i);
    if (conditional) {
      conditionalAbilities.push({
        label: token,
        condition: conditional[3].toLowerCase() === 'psyker' ? 'psyker' : 'non-monster-vehicle',
        ...(conditional[2] ? { sustainedHits: Number(conditional[2]) } : { devastatingWounds: true })
      });
      continue;
    }
    const flags = { 'torrent':'torrent', 'ignores cover':'ignoresCover', 'lethal hits':'lethalHits',
      'devastating wounds':'devastatingWounds', 'twin-linked':'twinLinked', 'precision':'precision',
      'extra attacks':'extraAttacks', 'lance':'lance' };
    if (flags[token.toLowerCase()]) result[flags[token.toLowerCase()]] = true;
    const numeric = token.match(/^(Sustained Hits|Rapid Fire|Melta|Blast)(?:\s+(\d+))?$/i);
    if (numeric && (numeric[2] || numeric[1].toLowerCase() === 'blast')) {
      const key = { 'sustained hits':'sustainedHits', 'rapid fire':'rapidFire', melta:'melta', blast:'blast' }[numeric[1].toLowerCase()];
      result[key] = Math.max(result[key] ?? 0, Number(numeric[2] || 1));
    }
    const anti = token.match(/^Anti[-\s]+(.+?)\s+([2-6])\+$/i);
    if (anti) (result.anti ??= []).push({ keyword: anti[1].trim().toLowerCase(), threshold: Number(anti[2]) });
  }
  if (conditionalAbilities.length) result.conditionalAbilities = conditionalAbilities;
  return result;
}
