/**
 * Space Marines physical base sizes (mm), kept distinct from display marker size.
 * Primary source: Games Workshop Warhammer Event Companion, June 2026,
 * Space Marines base size guide, pp. 84–86.
 * https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf
 *
 * Current datasheet aliases map only where the guide identifies the matching kit.
 * Kit-only sizes are separately marked and linked; hulls and unique bases are
 * intentionally not drawn as round tabletop bases.
 */
export const SPACE_MARINES_BASE_GUIDE_URL = 'https://assets.warhammer-community.com/eng_12-06_warhammer40000_event_companion-s3bfb5f9s1-ivswuij3fo.pdf';

function normalize(value) {
  return String(value ?? '').normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function record(name, shape, widthMm = null, lengthMm = null, source = 'event-guide', sourceUrl = SPACE_MARINES_BASE_GUIDE_URL) {
  return Object.freeze({name, shape, widthMm, lengthMm, source, sourceUrl});
}
const round = (name, diameter) => record(name, 'round', diameter, diameter);
const oval = (name, majorAxis, minorAxis) => record(name, 'oval', majorAxis, minorAxis);
const hull = name => record(name, 'hull');
const unique = name => record(name, 'unique');

export const SPACE_MARINES_BASE_CATALOG = Object.freeze([
  round('Adrax Agatone',40),
  round('Aethon Shaan',50),
  round('Aggressor Squad',40),
  round('Ancient',40),
  round('Ancient in Terminator Armour',40),
  round('Apothecary',40),
  round('Apothecary Biologis',40),
  round('Assault Intercessor Squad',32),
  round('Assault Intercessors with Jump Packs',32),
  round('Ballistus Dreadnought',90),
  round('Bladeguard Ancient',40),
  round('Bladeguard Veteran Squad',40),
  round('Brutalis Dreadnought',90),
  round('Caanok Var',50),
  round('Captain',40),
  round('Captain in Gravis Armour',40),
  round('Captain in Phobos Armour',40),
  round('Captain in Terminator Armour',50),
  // Product/kit reference, not listed in the Event Companion base guide.
  record('Captain on Bike','oval',90,52.5,'kit','https://www.miniaturemarket.com/Warhammer-40K-Space-Marines-Captain-on-Bike/GW-48-113-2026'),
  round('Captain with Jump Pack',40),
  round('Captain Titus',40),
  round('Cato Sicarius',40),
  round('Centurion Assault Squad',50),
  round('Centurion Devastator Squad',50),
  round('Chaplain',40),
  round('Chaplain in Terminator Armour',40),
  oval('Chaplain on Bike',90,52.5),
  round('Chaplain with Jump Pack',32),
  round('Chaplain with Jump Pack (Armageddon)',40),
  round('Chief Librarian Tigurius',40),
  round('Company Heroes',40),
  round('Darnath Lysander',50),
  round('Desolation Squad',32),
  round('Dreadnought',60),
  hull('Drop Pod'),
  round('Eliminator Squad',40),
  round('Eradicator Squad',40),
  round('Eradicator Squad with Melta Rifles',40),
  round('Eradicator Squad with Heavy Bolters',40),
  round('Firestrike Servo-turrets',80),
  round('Gladiator Lancer',100),
  round('Gladiator Reaper',100),
  round('Gladiator Valiant',100),
  hull('Hammerfall Bunker'),
  round('Heavy Intercessor Squad',40),
  round('Hellblaster Squad',32),
  round('Impulsor',100),
  round('Inceptor Squad',40),
  round('Incursor Squad',32),
  round('Infernus Squad',32),
  round('Infiltrator Squad',32),
  round('Intercessor Squad',32),
  hull('Invader ATV'),
  round('Invictor Tactical Warsuit',90),
  round('Iron Father Feirros',40),
  round('Judiciar',40),
  record('Kaius Konorius','round',40,40,'kit','https://www.alaragames.se/collections/newest-games-workshop-products/products/warhammer-40k-space-marines-kaius-konorius'),
  round('Kayvaan Shrike',40),
  round('Kor\'sarro Khan',40),
  hull('Land Raider'),
  hull('Land Raider Crusader'),
  hull('Land Raider Redeemer'),
  oval('Land Speeder',105,70),
  round('Librarian',40),
  round('Librarian in Phobos Armour',40),
  round('Librarian in Terminator Armour',40),
  round('Lieutenant',40),
  round('Lieutenant in Phobos Armour',40),
  round('Lieutenant in Reiver Armour',40),
  round('Lieutenant with Combi-Weapon',40),
  round('Marneus Calgar in Armour of Antilochus',50),
  oval('Outrider Squad',90,52.5),
  round('Pedro Kantor',32),
  hull('Predator Annihilator'),
  hull('Predator Destructor'),
  hull('Razorback'),
  round('Redemptor Dreadnought',90),
  round('Reiver Squad',32),
  round('Repulsor',100),
  round('Repulsor Executioner',100),
  hull('Rhino'),
  round('Roboute Guilliman',60),
  round('Scout Squad',28.5),
  round('Sternguard Veteran Squad',32),
  round('Storm Speeder Hailstrike',90),
  round('Storm Speeder Hammerstrike',90),
  round('Storm Speeder Thunderstrike',90),
  oval('Stormhawk Interceptor',120,92),
  oval('Stormraven Gunship',120,92),
  oval('Stormtalon Gunship',120,92),
  oval('Suboden Khan',90,52.5),
  round('Suppressor Squad',40),
  round('Tactical Squad',32),
  round('Techmarine',40),
  round('Terminator Assault Squad',40),
  round('Terminator Squad',40),
  round('Tor Garadon',40),
  round('Vanguard Veteran Squad with Jump Packs',32),
  round('Victrix Honour Guard',40),
  hull('Vindicator'),
  round('Vulkan He’stan',40),
  round('Wardens of Ultramar',40),
  hull('Whirlwind'),
  hull('Astraeus'),
  unique('Thunderhawk Gunship'),
]);

const byName = new Map(SPACE_MARINES_BASE_CATALOG.map(item => [normalize(item.name), item]));
const aliases = new Map(Object.entries({
  'Invader ATVs':'Invader ATV',
  'Eradicator Squad with Melta Rifles':'Eradicator Squad',
  'Marneus Calgar':'Marneus Calgar in Armour of Antilochus'
}).map(([alias, officialName]) => [normalize(alias), normalize(officialName)]));

export function getSpaceMarinesBaseSize(unit) {
  if (!unit) return null;
  const faction = normalize(unit.faction ?? unit.metadata?.faction ?? unit.factionName);
  if (faction && faction !== 'space marines') return null;
  const datasheetId = unit.metadata?.datasheetId ?? unit.datasheetId;
  const key = String(datasheetId ?? unit.id ?? '').split(':');
  const declaredFaction = datasheetId && key.length > 1 ? normalize(key[0]) : '';
  if (declaredFaction && declaredFaction !== 'space marines') return null;
  for (const candidate of [key.at(-1), unit.officialDatasheetName, unit.name]) {
    const name = normalize(candidate);
    const base = byName.get(name) ?? byName.get(aliases.get(name));
    if (base) return base;
  }
  return null;
}
