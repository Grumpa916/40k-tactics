import { drawSecondaryMission, getSecondaryMissionMode } from '../rules/secondary-mission-lifecycle.js';

const normalize = value => String(value ?? '').toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export function previewSpokenSecondaryPair(state, transcript, definitions, perspectivePlayerId) {
  if (state?.phase !== 'command') throw new Error('Record Tactical cards during Command phase.');
  const spoken = String(transcript ?? '').trim().replace(/[.!?]+$/, '');
  const explicitMine = /^(?:my|our|i drew|we drew)\b/i.test(spoken);
  const explicitOpponent = /^(?:the )?opponent(?:'s)?\b/i.test(spoken);
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId;
  const players = state.players ?? [];
  const playerId = explicitMine ? perspectivePlayerId :
    explicitOpponent ? players.find(player => player.id !== perspectivePlayerId)?.id : activePlayerId;
  if (!playerId || playerId !== activePlayerId)
    throw new Error('Tactical cards must belong to the active player in their Command phase.');
  if (getSecondaryMissionMode(state, playerId) !== 'tactical')
    throw new Error('This voice entry is for Tactical secondary cards only.');
  const names = spoken
    .replace(/^(?:the )?(?:opponent(?:'s)?|my|our|i drew|we drew)\s*/i, '')
    .replace(/^(?:secondar(?:y|ies)|cards?|objectives?)\s*(?:drawn|were|are|was|is)?\s*/i, '')
    .replace(/^(?:drew|drawn|were|are|was|is)\s*/i, '')
    .split(/\s+and\s+|\s*,\s*/i).map(name => name.trim()).filter(Boolean);
  if (names.length !== 2) throw new Error('Say two card names, for example “Cleanse and Plunder”.');
  const catalog = (definitions ?? []).filter(item => item?.category === 'secondary');
  const matches = names.map(name => {
    const found = catalog.filter(item => normalize(item.name) === normalize(name));
    if (found.length !== 1) throw new Error('Could not uniquely match “' + name + '” to the secondary catalog. Use manual entry.');
    return found[0];
  });
  if (matches[0].id === matches[1].id) throw new Error('The two cards must be different.');
  const round = state.battle?.round ?? 0, turn = state.turn ?? 0;
  // Validate both draws against the existing game rules before saving either.
  const first = drawSecondaryMission(state, { definition: matches[0], playerId, round, turn });
  drawSecondaryMission(first, { definition: matches[1], playerId, round, turn });
  return { playerId, definitions: matches, round, turn, transcript: spoken };
}
