import { escapeHtml } from './combat-workspace.js';

// Only explain damage reductions already established by the resolved attack
// profile. Never infer a modifier from a unit name or approximate map location.
export function getAdvisorDamageReductionNote({
  damageCharacteristic,
  damageReduction = 0,
  appliedRules = []
} = {}) {
  if (!Number.isInteger(damageReduction) || damageReduction < 1) return null;
  const raw = String(damageCharacteristic ?? '').trim().toUpperCase();
  let original = null, adjusted = null;
  if (/^\d+$/.test(raw) && Number(raw) >= 1) {
    const damage = Number(raw);
    original = String(damage);
    adjusted = String(Math.max(1, damage - damageReduction));
  } else {
    const die = /^D([36])(?:\+(\d+))?$/.exec(raw);
    if (!die) return null;
    const sides = Number(die[1]), bonus = Number(die[2] || 0);
    original = raw;
    const lowest = Math.max(1, 1 + bonus - damageReduction);
    const highest = Math.max(1, sides + bonus - damageReduction);
    adjusted = lowest === highest ? String(lowest) : lowest + '–' + highest;
  }
  const ruleNames = appliedRules
    .filter(rule => typeof rule === 'string' && /reduce (?:ranged )?damage by 1/i.test(rule))
    .map(rule => rule.split(':')[0].trim())
    .filter(Boolean);
  const source = ruleNames.length ? [...new Set(ruleNames)].join(' + ') : 'Recorded damage reduction';
  return Object.freeze({ source, original, adjusted, reduction: damageReduction });
}

export function renderAdvisorDamageReduction(context = {}) {
  const note = getAdvisorDamageReductionNote(context);
  if (!note) return '';
  return `<p class="advisor-damage-reduction" data-advisor-damage-reduction><strong>${escapeHtml(note.source)}:</strong> ${escapeHtml(note.original)} → ${escapeHtml(note.adjusted)} Damage per unsaved attack (−${note.reduction}; minimum 1). Applied before Feel No Pain; record only final tabletop damage.</p>`;
}
