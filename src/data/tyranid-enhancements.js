// Tyranid 11th-edition enhancement and Upgrade catalog.
// Values cross-checked against the current 2026-10-30 faction reference:
// https://tactical40k.com/codex/tyranids
// Official October MFM is indexed but cannot be retrieved directly (403).
// Do not describe this catalog as fully GW-primary-source certified.
const SOURCE='https://tactical40k.com/codex/tyranids';
const list=(detachment,entries)=>entries.map(([name,points,restriction,effect,upgrade=false])=>Object.freeze({
  id:name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
  name,points,detachment,restriction:Object.freeze(restriction),description:effect,
  upgrade,sourceUrl:SOURCE,sourceCheckedAt:'2026-11-11',
  verificationStatus:'current-secondary-reference-official-october-mfm-pending'
}));
const T=()=>['tyranids'];
const M=()=>['monster'];
const S=()=>['synapse'];
const P=()=>['psyker'];
const V=()=>['vanguard invader'];
export const TYRANID_ENHANCEMENTS=Object.freeze([
 ...list('Invasion Fleet',[
  ['Adaptive Biology',25,T(),'Bearer has FNP 5+, improved to 4+ after starting a turn below starting wounds.'],
  ['Alien Cunning',30,T(),'Redeploy up to three Tyranid units after both players deploy; may enter Strategic Reserves.'],
  ['Perfectly Adapted',15,T(),'Once per turn re-roll one hit, wound, damage, advance, charge or save roll for the bearer.'],
  ['Synaptic Linchpin',20,T(),'Friendly Tyranids units within 9 inches count as within Synapse Range.']
 ]),
 ...list('Crusher Stampede',[
  ['Enraged Reserves',20,M(),'After the bearer is destroyed by a melee attack before fighting, it can fight on a 3+.'],
  ['Monstrous Nemesis',25,M(),'Add 1 to Wound rolls for melee attacks against Monsters or Vehicles.'],
  ['Null Nodules',10,M(),'Once per battle, receive Feel No Pain 5+ against Psychic Attacks for the phase.'],
  ['Ominous Presence',15,M(),'Add 3 to the bearer Objective Control characteristic.']
 ]),
 ...list('Unending Swarm',[
  ['Adrenalised Onslaught',15,T(),'Bearer unit piles in and consolidates 3 inches further.'],
  ['Naturalised Camouflage',30,T(),'Before the first round, select up to three Endless Multitude units within 9 inches; they gain cover against ranged attacks for the round.'],
  ['Piercing Talons',25,T(),'On critical wounds, attacks from the bearer unit gain one Armour Penetration.'],
  ['Relentless Hunger',20,T(),'Add 2 inches to Move for models in the bearer unit.']
 ]),
 ...list('Assimilation Swarm',[
  ['Biophagic Flow',10,T(),'Nearby friendly Harvester models can regenerate targets within 9 inches instead of 6.'],
  ['Instinctive Defence',15,T(),'Within 6 inches of a Harvester, reduce Heroic Intervention CP by one and gain Fights First.'],
  ['Parasitic Biomorphology',25,T(),'Add 1 Strength to unit melee attacks; gain 1 Attack after its first qualifying kill near a Harvester.'],
  ['Regenerating Monstrosity',20,T(),'Non-Monster bearer unit can be regenerated twice per phase.']
 ]),
 ...list('Vanguard Onslaught',[
  ['Chameleonic',15,V(),'Bearer unit gains Stealth.'],
  ['Hunting Grounds',30,T(),'Enemy Reserves arrivals trigger a Battle-shock test on 2+ while bearer is on battlefield.'],
  ['Neuronode',20,T(),'Redeploy up to three Vanguard Invader units after deployment, including to Strategic Reserves.'],
  ['Stalker',10,V(),'Select an enemy unit at battle start; bearer gains +1 to Hit and Wound against that target.']
 ]),
 ...list('Synaptic Nexus',[
  ['Power of the Hive Mind',10,P(),'Psychic weapons equipped by bearer gain +1 Strength and +1 AP.'],
  ['Psychostatic Disruption',30,S(),'Enemy Reserves cannot be set up within 12 inches; one attempt to delay Strategic Reserves arrival.'],
  ['Synaptic Control',20,S(),'Reduce damage allocated to the bearer by 1.'],
  ['The Dirgeheart of Kharis',15,S(),'Enemy units within 9 inches have Leadership worsened by one.']
 ]),
 ...list('Warrior Bioform Onslaught',[
  ['Elevated Might',30,['tyranid-prime-with-lash-whip','winged-tyranid-prime'],'Bearer melee attacks re-roll wounds and gain +1 AP.'],
  ['Ocular Adaptation',20,['tyranid-prime-with-lash-whip','winged-tyranid-prime'],'Bearer unit melee attacks gain +1 to Hit.']
 ]),
 ...list('Subterranean Assault',[
  ['Synaptic Strategy',15,T(),'Once per battle, use Rapid Ingress for bearer unit for 0CP, even if otherwise used this phase.'],
  ['Tremor Senses',20,T(),'Redeploy up to three Tyranid units after deployment, possibly into Strategic Reserves.'],
  ['Trygon Prime',20,['trygon'],'Bearer Trygon gains Synapse and +1 melee Strength and Weapon Skill.'],
  ['Vanguard Intellect',15,['deep strike'],'Bearer may Deep Strike in Reinforcements step of its first, second, or third Movement phase regardless of mission rules.']
 ]),
 ...list('Ambush Predators',[
  ['Encircling Horrors',20,['neurolictor','lictor','von-ryan-s-leapers'],'Move D3+3 inches when an enemy ends a move within 8 inches, during opponent Movement phase.',true],
  ['Cryptophotaic Camouflage',15,['von-ryan-s-leapers'],'Bearer unit reduces enemy detection range by 3 inches.',true]
 ]),
 ...list('Talons of the Norn Queen',[
  ['Destabilising Predation',20,['norn-emissary'],'Bearer Norn Emissary ranged attacks gain Anti-Character 2+.',true],
  ['Synaptoprescience',30,['norn-assimilator'],'Bearer Norn Assimilator gains a 4+ invulnerable save.',true]
 ])
]);
export const TYRANID_ENHANCEMENTS_BY_NAME=Object.freeze(Object.fromEntries(TYRANID_ENHANCEMENTS.map(x=>[x.name,x])));
export const TYRANID_ENHANCEMENTS_BY_DETACHMENT=Object.freeze(Object.fromEntries(
 [...new Set(TYRANID_ENHANCEMENTS.map(x=>x.detachment))].map(name=>[name,Object.freeze(TYRANID_ENHANCEMENTS.filter(x=>x.detachment===name))])
));
