import { findArmyUnitCandidates } from '../data/army-unit-catalog.js';
import { createRulesDataRevisionStamp } from '../data/rules-data-revisions.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { createGameState } from '../state/game-state.js';
import { createArmyRoster } from '../state/army-roster-library.js';
import { applyArmyRosterToBattle } from '../engine/army-roster-transitions.js';
import { setBattleSize, setPreGameRoles } from '../engine/battle-setup-transitions.js';
import { setDeploymentPlanPosition, setEventCompanionMissionSetup } from '../engine/battlefield-map-transitions.js';
import { setSecondaryMissionMode } from '../rules/secondary-mission-lifecycle.js';
import { buildManualWargearLoadout } from '../rules/wargear-loadout-validation.js';

export const FULL_GAME_VERIFICATION_PRESET = 'full-game';
export const FULL_GAME_VERIFICATION_BATTLE_ID = 'full-game-verification-v1';

const REVIEWED_VERIFICATION_LOADOUTS = Object.freeze({
  'adeptus-custodes:blade-champion': () => [
    { name: 'Vaultswords', quantity: 1 }
  ],
  'adeptus-custodes:custodian-guard-sodality': (modelCount) => [
    { name: 'Guardian Spear', quantity: modelCount }
  ],
  'adeptus-custodes:custodian-wardens': (modelCount) => [
    { name: 'Guardian Spear', quantity: modelCount }
  ],
  'adeptus-custodes:allarus-custodians': (modelCount) => [
    { name: 'Balistus Grenade Launcher', quantity: modelCount },
    { name: 'Castellan Axe', quantity: modelCount }
  ],
  'adeptus-custodes:telemon-heavy-dreadnought': () => [
    { name: 'Spiculus Bolt Launcher', quantity: 1 },
    { name: 'Caestus Fist', quantity: 1 },
    { name: 'Twin Neutronium Cascade Projectors', quantity: 1 },
    { name: 'Arachnus Storm Cannon', quantity: 1 }
  ],
  'tyranids:termagants': (modelCount) => [
    { name: 'Chitinous claws and teeth', quantity: modelCount },
    { name: 'Fleshborer', quantity: modelCount - 3 },
    { name: 'Shardlauncher', quantity: 1 },
    { name: 'Spike rifle', quantity: 1 },
    { name: 'Strangleweb', quantity: 1 }
  ]
});

// These preset datasheets have fixed weapon profiles in the reviewed local catalog.
// Their explicit quantities are intentional for this acceptance fixture; do not
// generalize this rule to arbitrary datasheets because some units have mixed models
// or multiple copies that need dedicated ownership data.
const FIXED_PROFILE_PER_MODEL_IDS = new Set([
  'adeptus-custodes:trajann-valoris',
  'adeptus-custodes:venatari-with-verutum-lances',
  'adeptus-custodes:contemptor-galatus-dreadnought',
  'adeptus-custodes:prosecutor-squad',
  'tyranids:neurotyrant',
  'tyranids:tyranid-prime-with-lash-whip',
  'tyranids:hormagaunts',
  'tyranids:norn-emissary',
  'tyranids:exocrine',
  'tyranids:zoanthropes',
  'tyranids:deathleaper',
  'tyranids:gargoyles',
  'tyranids:trygon'
]);

function candidateFor(faction, name) {
  const candidate = findArmyUnitCandidates({ faction, query: name })
    .find((item) => item.name === name);
  if (!candidate) throw new Error(`Full-game verification preset is missing catalog unit: ${faction} / ${name}`);
  return candidate;
}

function fixedProfileLoadout(unit) {
  if (!FIXED_PROFILE_PER_MODEL_IDS.has(unit.datasheetId)) {
    throw new Error(`Full-game verification preset needs an explicit reviewed loadout for ${unit.datasheetId}.`);
  }
  const weapons = Array.isArray(unit.datasheet?.weapons) ? unit.datasheet.weapons : [];
  if (!weapons.length) throw new Error(`Full-game verification preset has no weapon profiles for ${unit.datasheetId}.`);
  return {
    equippedWeapons: weapons.map((weapon) => ({
      name: weapon.name,
      quantity: unit.modelCount,
      selectionName: weapon.name,
      casualtyPerModel: 1,
      sourceName: 'Full-game verification preset'
    })),
    loadoutValidation: {
      status: 'profile-matched',
      reviewedRules: false,
      source: 'full-game-verification-fixed-profile',
      errors: []
    }
  };
}

function verificationLoadout(unit) {
  const reviewedRuleSet = getTyranidWargearRuleSet(unit.datasheetId);
  if (!reviewedRuleSet) return fixedProfileLoadout(unit);

  const selectionFactory = REVIEWED_VERIFICATION_LOADOUTS[unit.datasheetId];
  if (!selectionFactory) {
    throw new Error(`Full-game verification preset needs a reviewed loadout selection for ${unit.datasheetId}.`);
  }
  const loadout = buildManualWargearLoadout(unit, selectionFactory(unit.modelCount));
  if (loadout.loadoutValidation.status !== 'rules-reviewed-valid') {
    throw new Error(`Full-game verification preset produced an invalid loadout for ${unit.datasheetId}: ${loadout.loadoutValidation.errors.join('; ')}`);
  }
  return loadout;
}

function rosterUnit(faction, id, name, extra = {}) {
  const candidate = candidateFor(faction, name);
  const draft = {
    id,
    name: candidate.name,
    datasheetId: candidate.id,
    datasheet: candidate.datasheet,
    modelCount: candidate.defaultModelCount ?? 1,
    points: candidate.defaultPoints ?? null,
    dataSource: {
      status: candidate.verificationStatus ?? 'verification-preset',
      sourceName: candidate.sourceName ?? null,
      sourceUrl: candidate.sourceUrl ?? null
    }
  };
  const loadout = verificationLoadout(draft);
  const { datasheet, ...unit } = draft;
  return { ...unit, ...loadout, ...extra };
}

function custodesRoster() {
  return createArmyRoster({
    id: 'verification-custodes',
    name: 'Verification · Custodes combined-arms',
    faction: 'Adeptus Custodes',
    pointsLimit: 2000,
    battleSize: 'strike_force',
    detachment: 'Guardians of the Throne',
    detachments: ['Guardians of the Throne'],
    rulesDataRevision: createRulesDataRevisionStamp('Adeptus Custodes'),
    notes: 'Scripted V2 full-game acceptance roster. Do not treat as a tournament list.',
    units: [
      rosterUnit('Adeptus Custodes', 'trajann', 'Trajann Valoris', { attachedToBodyguardId: 'wardens' }),
      rosterUnit('Adeptus Custodes', 'wardens', 'Custodian Wardens', { attachedLeaderIds: ['trajann'] }),
      rosterUnit('Adeptus Custodes', 'blade-champion', 'Blade Champion', { attachedToBodyguardId: 'guard' }),
      rosterUnit('Adeptus Custodes', 'guard', 'Custodian Guard Sodality', { attachedLeaderIds: ['blade-champion'] }),
      rosterUnit('Adeptus Custodes', 'allarus', 'Allarus Custodians'),
      rosterUnit('Adeptus Custodes', 'venatari', 'Venatari with Verutum Lances'),
      rosterUnit('Adeptus Custodes', 'telemon', 'Telemon Heavy Dreadnought'),
      rosterUnit('Adeptus Custodes', 'galatus', 'Contemptor-Galatus Dreadnought'),
      rosterUnit('Adeptus Custodes', 'prosecutors', 'Prosecutor Squad')
    ]
  });
}

function tyranidRoster() {
  return createArmyRoster({
    id: 'verification-tyranids',
    name: 'Verification · Tyranid mixed threat',
    faction: 'Tyranids',
    pointsLimit: 2000,
    battleSize: 'strike_force',
    detachment: 'Vanguard Onslaught',
    detachments: ['Vanguard Onslaught'],
    rulesDataRevision: createRulesDataRevisionStamp('Tyranids'),
    notes: 'Scripted V2 full-game acceptance roster. Includes monsters, swarms, leaders and reserve candidates.',
    units: [
      rosterUnit('Tyranids', 'neurotyrant', 'Neurotyrant'),
      rosterUnit('Tyranids', 'tyranid-prime', 'Tyranid Prime with Lash Whip', { attachedToBodyguardId: 'hormagaunts' }),
      rosterUnit('Tyranids', 'hormagaunts', 'Hormagaunts', { attachedLeaderIds: ['tyranid-prime'] }),
      rosterUnit('Tyranids', 'termagants', 'Termagants'),
      rosterUnit('Tyranids', 'norn-emissary', 'Norn Emissary'),
      rosterUnit('Tyranids', 'exocrine', 'Exocrine'),
      rosterUnit('Tyranids', 'zoanthropes', 'Zoanthropes'),
      rosterUnit('Tyranids', 'deathleaper', 'Deathleaper'),
      rosterUnit('Tyranids', 'gargoyles', 'Gargoyles'),
      rosterUnit('Tyranids', 'trygon', 'Trygon')
    ]
  });
}

const DEPLOYMENT_PLAN = Object.freeze({
  'p1:trajann': { x: 13, y: 7 },
  'p1:wardens': { x: 15, y: 7 },
  'p1:blade-champion': { x: 23, y: 8 },
  'p1:guard': { x: 25, y: 8 },
  'p1:allarus': { x: 20, y: 5 },
  'p1:venatari': { x: 45, y: 5 },
  'p1:telemon': { x: 31, y: 8 },
  'p1:galatus': { x: 39, y: 8 },
  'p1:prosecutors': { x: 7, y: 5 },
  'p2:neurotyrant': { x: 30, y: 37 },
  'p2:tyranid-prime': { x: 18, y: 35 },
  'p2:hormagaunts': { x: 20, y: 34 },
  'p2:termagants': { x: 13, y: 37 },
  'p2:norn-emissary': { x: 34, y: 35 },
  'p2:exocrine': { x: 46, y: 38 },
  'p2:zoanthropes': { x: 25, y: 38 },
  'p2:deathleaper': { x: 9, y: 31 },
  'p2:gargoyles': { x: 51, y: 35 },
  'p2:trygon': { x: 41, y: 33 }
});

export function createFullGameVerificationState() {
  let state = createGameState({
    phase: 'setup',
    turn: 0,
    activePlayer: 'p1',
    players: [
      { id: 'p1', name: 'You' },
      { id: 'p2', name: 'Opponent' }
    ],
    battle: {
      id: FULL_GAME_VERIFICATION_BATTLE_ID,
      status: 'setup',
      round: 0,
      firstPlayerId: null,
      activePlayerId: 'p1'
    },
    objectives: [],
    scoring: { turnSnapshots: [], secondaryMissionModeByPlayer: {} }
  });

  state = setBattleSize(state, { battleSize: 'strike_force' });
  state = applyArmyRosterToBattle(state, {
    roster: custodesRoster(), playerId: 'p1', snapshotId: 'verification-custodes-snapshot', selectedAt: 'verification'
  });
  state = applyArmyRosterToBattle(state, {
    roster: tyranidRoster(), playerId: 'p2', snapshotId: 'verification-tyranids-snapshot', selectedAt: 'verification'
  });
  state = setEventCompanionMissionSetup(state, {
    myDisposition: 'Purge the Foe',
    opponentDisposition: 'Reconnaissance',
    layout: 'A'
  });
  state = setPreGameRoles(state, { attackerPlayerId: 'p1', firstPlayerId: null });
  state = setSecondaryMissionMode(state, { playerId: 'p1', mode: 'tactical' });
  state = setSecondaryMissionMode(state, { playerId: 'p2', mode: 'tactical' });

  for (const [unitId, position] of Object.entries(DEPLOYMENT_PLAN)) {
    const playerId = unitId.startsWith('p1:') ? 'p1' : 'p2';
    state = setDeploymentPlanPosition(state, { unitId, playerId, position });
  }

  return state;
}
