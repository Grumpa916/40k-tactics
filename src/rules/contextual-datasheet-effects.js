import { strongestReroll } from './attack-roll-probabilities.js';

// Pure calculation: every effect comes from the reviewed profile adapter and
// recorded context. No resource is spent and no live unit is modified.
export function applyRecordedCombatEffects({ attacker, target, profile }) {
  const result = { ...profile, woundModifier: profile.woundModifier ?? 0, damageReduction: profile.damageReduction ?? 0 }, appliedRules = [];
  const own = new Set(attacker?.combatRules?.effects ?? []);
  const enemy = new Set(target?.combatRules?.effects ?? []);
  const keywords = (target?.keywords ?? []).map(value => String(value).toLowerCase());
  const nonMonsterVehicle = keywords.length > 0 && !keywords.includes('monster') && !keywords.includes('vehicle');
  const melee = profile.weaponType === 'melee';
  const charged = attacker?.combatRules?.chargedThisTurn === true;
  const apply = (condition, label, update) => { if (condition) { update(); appliedRules.push(label); } };
  const woundBonus = () => { result.woundModifier -= 1; };
  const improveAp = () => { result.ap -= 1; };
  const worsenAp = () => { result.ap = Math.min(0, result.ap + 1); };
  const sustained = value => { result.sustainedHits = Math.max(result.sustainedHits ?? 0, value); };

  apply(profile.lance && charged, 'Lance: +1 to Wound after recorded charge', woundBonus);
  // 11e Space Marine effects: only deterministic, currently active bonuses.
  // Doctrine selections, per-game activations, proximity and allocated-model
  // protective saves must be captured separately, never assumed.
  apply(own.has('marine-ironclad-champions'),
    'Ironclad Champions: Dreadnought re-rolls Hit rolls of 1', () => {
      result.hitReroll = strongestReroll(result.hitReroll,'ones');
    });
  apply(melee && own.has('marine-champion-of-the-first-company'),
    'Champion of the First Company: melee Lethal Hits', () => {result.lethalHits=true;});
  apply(profile.weaponType==='ranged' && own.has('marine-honour-of-vigilance'),
    'Honour of Vigilance: ranged Lethal Hits', () => {result.lethalHits=true;});
  apply(melee && own.has('marine-furious-assault') && nonMonsterVehicle,
    'Furious Assault: Sustained Hits 1 versus non-Monster/Vehicle', () => sustained(1));
  apply(melee && own.has('marine-laurels-of-triumph'),
    'Laurels of Triumph: bearer melee +1 Strength and AP', () => {
      result.strength+=1;improveAp();
    });
  apply(profile.weaponType==='ranged' && !profile.psychic && own.has('marine-master-forged-firearms'),
    'Master-forged Firearms: bearer non-Psychic ranged weapon +1 A/S/AP/D', () => {
      const addOne=value=>{
        if(Number.isInteger(value))return value+1;
        const plain=String(value??'').trim();
        if(/^\d+$/.test(plain))return Number(plain)+1;
        const dice=plain.match(/^(\d*)D([36])(?:\+(\d+))?$/i);
        return dice?`${dice[1]??''}D${dice[2]}+${Number(dice[3]??0)+1}`:value;
      };
      result.attacks=addOne(result.attacks);
      result.strength+=1;improveAp();
      result.damage=addOne(result.damage);
    });

  // 11th-edition Vertus Quicksilver Execution is a repeatable, charge-triggered
  // melee bonus. It is not the 10th-edition once-per-battle move-over attack.
  // The reviewed datasheet match in recorded-combat-rules prevents an old
  // saved datasheet bearing the same name from gaining the new effect.
  // Reviewed Tyranid enhancements: only intrinsic, unconditional attack bonuses.
  // The app does not silently trigger once-per-battle, target-selected or
  // proximity-dependent effects without explicit battle-state evidence.
  apply(own.has('tyranid-surprise-assault'),
    'Subterranean Assault: re-roll Hit rolls of 1', () => {
      result.hitReroll = strongestReroll(result.hitReroll,'ones');
    });
  apply(own.has('tyranid-mindhunger') && keywords.includes('character'),
    'Mindhunger: Lictor/Neurolictor re-roll Hit rolls of 1 versus Character', () => {
      result.hitReroll = strongestReroll(result.hitReroll,'ones');
    });
  apply(melee && own.has('tyranid-elevated-might'),
    'Elevated Might: re-roll melee Wound rolls; improve AP by 1', () => {
      improveAp();
      result.woundReroll = strongestReroll(result.woundReroll, 'failed');
    });
  apply(melee && own.has('tyranid-ocular-adaptation'),
    'Ocular Adaptation: +1 to melee Hit rolls', () => {
      result.hitModifier = (result.hitModifier ?? 0) - 1;
    });
  apply(melee && own.has('tyranid-parasitic-biomorphology'),
    'Parasitic Biomorphology: +1 Strength to unit melee weapons', () => {
      result.strength += 1;
    });
  apply(melee && own.has('tyranid-monstrous-nemesis') &&
      (keywords.includes('monster') || keywords.includes('vehicle')),
    'Monstrous Nemesis: +1 to Wound against Monster/Vehicle', woundBonus);
  apply(own.has('tyranid-power-of-the-hive-mind') && profile.psychic,
    'Power of the Hive Mind: +1 Strength and AP for bearer psychic weapon', () => {
      result.strength += 1;
      improveAp();
    });
  apply(profile.weaponType === 'ranged' && own.has('tyranid-destabilising-predation'),
    'Destabilising Predation: ranged attacks gain Anti-Character 2+', () => {
      result.anti = [...(result.anti ?? []), { keyword:'character', threshold:2 }];
    });

  apply(melee && own.has('quicksilver-execution') && charged,
    'Quicksilver Execution: Sustained Hits 1 after charging', () => sustained(1));
  apply(melee && own.has('death-blow') && charged, 'Death Blow: improve AP by 1', improveAp);
  apply(melee && own.has('slayer-of-tyrants') && Number.isFinite(attacker?.combatRules?.unitToughness) &&
    profile.toughness > attacker.combatRules.unitToughness, 'Slayer of Tyrants: +1 to Wound', woundBonus);
  apply(melee && own.has('dread-foe') && nonMonsterVehicle, 'Dread Foe: improve AP by 1', improveAp);
  apply(profile.weaponType === 'ranged' && own.has('destructor-optics') && nonMonsterVehicle,
    'Destructor Optics: improve AP by 1', improveAp);
  apply(own.has('reap-a-terrible-tally') && keywords.includes('infantry'), 'Reap a Terrible Tally: re-roll Hit and Wound rolls of 1', () => {
    result.hitReroll = strongestReroll(result.hitReroll, 'ones');
    result.woundReroll = strongestReroll(result.woundReroll, 'ones');
  });
  for (const conditional of profile.conditionalAbilities ?? []) {
    const matches = conditional.condition === 'psyker' ? keywords.includes('psyker') :
      conditional.condition === 'monster-vehicle' ? keywords.includes('monster') || keywords.includes('vehicle') :
      conditional.condition === 'non-monster-vehicle' && nonMonsterVehicle;
    apply(matches, conditional.label, () => {
      if (conditional.sustainedHits) sustained(conditional.sustainedHits);
      if (conditional.lethalHits) result.lethalHits = true;
      if (conditional.devastatingWounds) result.devastatingWounds = true;
    });
  }
  apply(enemy.has('living-fortress'), 'Living Fortress: worsen incoming AP by 1', worsenAp);
  apply(target?.combatRules?.auramiteAttackers?.includes(attacker?.combatRules?.formationRootId??attacker?.id), 'In Auramite Clad: worsen AP by 1 against the recorded attacker', worsenAp);
  apply(melee && target?.combatRules?.kaptaris, 'Kaptaris: -1 to incoming melee Hit rolls', () => {result.hitModifier=(result.hitModifier??0)+1;});
  apply(target?.combatRules?.goldenLightOfMoirades && !profile.torrent, 'Golden Light of the Moiraides: -1 to incoming Hit rolls', () => {result.hitModifier=(result.hitModifier??0)+1;});
  apply(target?.combatRules?.temporaryInvulnerableSave===3, 'Moment Shackle: allocated model has a 3+ invulnerable save', () => {result.invulnerableSave=Math.min(result.invulnerableSave??7,3);});
  apply(enemy.has('marine-artificer-sarcophagus'),
    'Artificer Sarcophagus: reduce Damage allocated to Dreadnought by 1', () => {
      result.damageReduction+=1;
    });
  apply(enemy.has('tyranid-synaptic-control'),
    'Synaptic Control: reduce Damage allocated to bearer by 1', () => { result.damageReduction += 1; });
  apply(enemy.has('golden-laurels'), 'Golden Laurels: worsen incoming AP by 1', worsenAp);
  for (const [id, label] of [['sentinel-shield','Praesidium Shield'],['unyielding-ancient','Unyielding Ancient']]) {
    apply(enemy.has(id) && profile.strength > profile.toughness, `${label}: -1 to Wound against higher Strength`, () => { result.woundModifier += 1; });
  }
  apply(enemy.has('captain-shield'), 'Equipped Praesidium Shield: reduce Damage by 1', () => { result.damageReduction += 1; });
  apply(enemy.has('guardian-eternal') && profile.weaponType === 'ranged', 'Guardian Eternal: reduce ranged Damage by 1', () => { result.damageReduction += 1; });
  const fnp = [result.damagePrevention, target?.combatRules?.feelNoPain].filter(value => Number.isInteger(value) && value >= 2 && value <= 6);
  result.damagePrevention = fnp.length ? Math.min(...fnp) : 0;
  if (result.damagePrevention) appliedRules.push(`Feel No Pain ${result.damagePrevention}+: wound prevention`);
  const mortalFnp = [result.damagePrevention, enemy.has('aegis-of-the-emperor') ? 5 : 0]
    .filter(value => Number.isInteger(value) && value >= 2 && value <= 6);
  result.mortalDamagePrevention = mortalFnp.length ? Math.min(...mortalFnp) : 0;
  if (enemy.has('aegis-of-the-emperor') && result.devastatingWounds && result.mortalDamagePrevention !== result.damagePrevention) {
    appliedRules.push('Aegis of the Emperor: Feel No Pain 5+ against Devastating Wounds');
  }
  return { ...result, appliedRules };
}
