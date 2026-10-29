// Reminder summaries use the reviewed roster abilities. Dice and range checks stay at the table.
export const CUSTODES_REMINDER_DEFINITIONS = Object.freeze([
  { id: 'aquila-commander', ability: 'Aquila Commander', phases: ['start_turn', 'command'], timing: 'Start of battle round', limit: 'round-army', action: 'Confirm +1 CP', effect: 'Confirm the additional Command Point from an eligible commander once this battle round.' },
  { id: 'moment-shackle', ability: 'Moment Shackle', phases: ['command', 'movement', 'shooting', 'charge', 'fight'], timing: 'Start of any phase', opening: true, limit: 'battle-army', duration: 'phase', choices: [{ id: 'attacks', label: '+3 Axe attacks', effect: 'Add 3 to the Attacks characteristic of Trajann’s Watcher’s Axe for this phase.' }, { id: 'save', label: '3+ invulnerable save', effect: 'Trajann has a 3+ invulnerable save for this phase. This applies only to attacks allocated to Trajann, not his bodyguard.' }], effect: 'Once per battle for your army, choose +3 Attacks for Trajann’s Watcher’s Axe or a 3+ invulnerable save for Trajann himself. The chosen effect lasts for this phase only.' },
  { id: 'captain-general', ability: 'Captain-General (Aura)', phases: ['shooting', 'fight'], timing: 'When attacking', effect: 'Check 6″ from Trajann: eligible non-Monster/Vehicle Custodes units re-roll Hit and Wound rolls of 1. Confirm range at the table.' },
  { id: 'living-fortress', ability: 'Living Fortress', phases: ['shooting', 'fight'], timing: 'When targeted', effect: 'Worsen incoming AP by 1: AP −2 becomes AP −1. This protection applies to the attached Warden unit.' },
  { id: 'stand-vigil', ability: 'Stand Vigil', phases: ['shooting', 'fight'], timing: 'When attacking', effect: 'Against a non-Monster/Vehicle target, check whether this unit or its target is in objective range: Stand Vigil grants Lethal Hits. Check before choosing Martial Mastery.' },
  { id: 'praesidium-shield', ability: 'Praesidium Shield', phases: ['shooting', 'fight'], timing: 'When targeted', effect: 'Incoming attacks with Strength greater than this unit’s Toughness have −1 to Wound rolls.' },
  { id: 'slayer-of-tyrants', ability: 'Slayer of Tyrants', phases: ['fight'], timing: 'When fighting', effect: 'Melee attacks against a target with greater Toughness than this unit gain +1 to Wound.' },
  { id: 'unyielding-ancient', ability: 'Unyielding Ancient', phases: ['shooting', 'fight'], timing: 'When targeted', effect: 'Incoming attacks with Strength greater than the Galatus’s Toughness have −1 to Wound rolls.' },
  { id: 'guardian-eternal', ability: 'Guardian Eternal', phases: ['shooting'], timing: 'When targeted by ranged attacks', effect: 'Reduce incoming ranged Damage by 1. Check the minimum-Damage rule when resolving each attack.' },
  { id: 'take-wing', ability: 'Take Wing', phases: ['fight'], turn: 'opponent', timing: 'End of opponent Fight phase', limit: 'phase-unit', action: 'Mark Take Wing used', effect: 'If this Venatari unit is unengaged at the end of this phase, it can return to Strategic Reserves. Confirm engagement and move it to reserves at the table/in the reserves tray.' },
  { id: 'cascade-mine', ability: 'Neutronium Cascade Mine', phases: ['command', 'movement', 'shooting', 'charge', 'fight'], timing: 'Start of any phase', opening: true, limit: 'battle-unit', action: 'Mark mine used', effect: 'Confirm an enemy within 3″. Roll one D6; on 2+, inflict D3 mortal wounds, or 2D3 against a Monster/Vehicle. Record the result at the table.' },
  { id: 'swift-ruin', ability: 'Swift Ruin', phases: ['movement'], turn: 'opponent', reserves: true, timing: 'Rapid Ingress window', limit: 'phase-army', action: 'Mark Swift Ruin used', effect: 'This Venatari unit can receive Rapid Ingress for 1 CP less, without preventing another use on another unit this phase. Confirm arrival eligibility and the stratagem window.' },
  { id: 'purity-of-execution', ability: 'Purity of Execution', phases: ['shooting'], turn: 'own', timing: 'Your Shooting phase', effect: 'Choose a visible enemy within 18″ to detect it: its detection range increases by 3″. Each Prosecutor squad has this ability; confirm the chosen target.' },
  { id: 'daughters-of-the-abyss', ability: 'Daughters of the Abyss', phases: ['shooting', 'fight'], timing: 'When resolving Psychic attacks', effect: 'This Anathema Psykana unit has Feel No Pain 3+ against Psychic attacks. Eligible Custodes within 6″ receive Feel No Pain 5+ against Psychic attacks; confirm aura range.' },
  { id: 'aegis-of-the-emperor', ability: 'Aegis of the Emperor', phases: ['command', 'movement', 'shooting', 'charge', 'fight'], timing: 'When suffering mortal wounds', effect: 'Eligible models have Feel No Pain 5+ against mortal wounds. Use only the applicable Feel No Pain roll for each wound.' }
]);

export const GUARDIANS_REMINDER_PHASES = Object.freeze({
  'Superhuman Focus': ['command', 'movement', 'shooting', 'charge', 'fight'],
  'Unlimited Endurance': ['movement'],
  'Shield of Honour': ['fight'],
  'Prime Target': ['shooting'],
  'In Auramite Clad': ['shooting', 'fight'],
  'Swift as the Eagle': ['movement']
});
