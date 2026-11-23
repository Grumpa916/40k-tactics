// Shared Shooting weapon tiles for tabletop and classic layouts.
// Only effects present on the equipped/saved weapon profile are displayed;
// conditional keywords remain explicitly conditional.
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

const descriptions = Object.freeze([
  [/^assault$/i, 'Check the Assault shooting permissions after Advancing.'],
  [/^heavy$/i, 'Apply the Heavy weapon rule when its conditions are met.'],
  [/^pistol$/i, 'Check Pistol shooting restrictions, especially when engaged.'],
  [/^torrent$/i, 'Attacks with this weapon automatically hit.'],
  [/^twin-linked$/i, 'Re-roll Wound rolls.'],
  [/^precision$/i, 'Confirm eligible Character wound allocation on the tabletop.'],
  [/^lethal hits$/i, 'Critical Hits automatically wound.'],
  [/^devastating wounds$/i, 'Apply the Critical Wound effect for this weapon.'],
  [/^sustained hits/i, 'Critical Hits generate additional hits as indicated.'],
  [/^rapid fire/i, 'Check bonus attacks within half range.'],
  [/^melta/i, 'Check bonus damage within half range.'],
  [/^blast/i, 'Check target unit size and engagement restrictions.'],
  [/^ignores cover$/i, 'Ignore the target\'s Benefit of Cover for this attack.'],
  [/^indirect fire$/i, 'Check the current indirect-fire and visibility requirements.'],
  [/^psychic$/i, 'Check any applicable Psychic interactions.'],
  [/^anti[-\s]/i, 'Apply the listed threshold against qualifying targets.'],
  [/^extra attacks$/i, 'Check whether this profile makes additional attacks.'],
  [/\bvs\b/i, 'Applies only against the stated target type.']
]);

function noteFor(label) {
  return descriptions.find(([pattern]) => pattern.test(label))?.[1] ?? '';
}

export function getShootingWeaponEffects(weapon) {
  if (!weapon) return [];
  const c = weapon.characteristics ?? {};
  const labels = [];
  const add = label => { if (label && !labels.some(value => value.toLowerCase() === label.toLowerCase())) labels.push(label); };
  const raw = weapon.abilities ?? c.abilities;
  if (typeof raw === 'string') raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).forEach(add);
  else if (Array.isArray(raw)) raw.forEach(item => add(typeof item === 'string' ? item : item?.name));
  const flags = [
    ['assault','Assault'],['torrent','Torrent'],['ignoresCover','Ignores Cover'],
    ['twinLinked','Twin-linked'],['precision','Precision'],['lethalHits','Lethal Hits'],
    ['devastatingWounds','Devastating Wounds'],['psychic','Psychic'],
    ['extraAttacks','Extra Attacks'],['lance','Lance']
  ];
  for (const [key,label] of flags) if (c[key] === true) add(label);
  if (c.closeQuarters === true && !labels.some(item => /^pistol$/i.test(item))) add('Pistol');
  for (const [key,label] of [['sustainedHits','Sustained Hits'],['rapidFire','Rapid Fire'],['melta','Melta']]) {
    if (Number(c[key]) > 0 && !labels.some(item => item.toLowerCase().startsWith(label.toLowerCase()))) add(label+' '+c[key]);
  }
  if (c.blast && !labels.some(item=>/^blast/i.test(item))) add(typeof c.blast === 'number' ? 'Blast '+c.blast : 'Blast');
  for (const entry of c.anti ?? []) add('Anti-'+entry.keyword+' '+entry.threshold+'+');
  for (const entry of c.conditionalAbilities ?? []) add(entry.label);
  return labels.map(label=>({label,description:noteFor(label)}));
}

export function renderShootingWeaponChoices(weapons, selectedWeaponId, {disabled = false} = {}) {
  const options = Array.isArray(weapons) ? weapons : [];
  const selected = options.find(item => item.id === selectedWeaponId);
  const effects = getShootingWeaponEffects(selected);
  const deck=options.filter(weapon=>weapon.firingDeck);
  return `<div class="shoot-weapon-picker" role="group" aria-label="Ranged weapon">
    <strong>Ranged weapon</strong>
    ${deck.length ? '<p role="note" data-firing-deck-guide>Firing Deck: select the Impulsor as shooter, then choose an embarked unit’s weapon below. The transport makes the attack; the passenger remains embarked. Confirm the number of contributing models and weapon profiles on the tabletop.</p>' : ''}
    <div class="shoot-weapon-picker__choices">${options.map(weapon =>
      `<button type="button" data-shoot-weapon-choice="${escapeHtml(weapon.id)}" aria-pressed="${String(weapon.id === selectedWeaponId)}" ${disabled ? 'disabled' : ''}>${escapeHtml(weapon.name)}</button>`
    ).join('')}</div>
    ${!options.length ? '<small>No confirmed ranged weapon profiles available for this unit.</small>' : ''}
    ${selected?.firingDeck && selected?.hazardousBearerId ? `<p data-firing-deck-hazardous>Hazardous test and any resulting damage are taken by ${escapeHtml(selected.sourceUnitName)}, the embarked unit that fired. The transport does not take this test.</p>` : ''}
    ${selected ? `<div class="shoot-weapon-picker__effects" role="note" aria-label="Selected weapon special effects">
      <strong>Selected weapon · ${escapeHtml(selected.name)}</strong>
      ${effects.length ? '<ul>'+effects.map(({label,description}) =>
        `<li><strong>${escapeHtml(label)}</strong>${description ? `<span>${escapeHtml(description)}</span>` : ''}</li>`
      ).join('')+'</ul>' : '<small>No special effects listed in the saved profile. Confirm against the datasheet.</small>'}
    </div>` : ''}
  </div>`;
}
