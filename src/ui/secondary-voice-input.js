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
    .replace(/^(?:(?:secondary|secondaries)(?:\s+(?:objectives?|cards?))?|cards?|objectives?)\s*(?:drawn|were|are|was|is)?\s*/i, '')
    .replace(/^(?:drew|drawn|were|are|was|is)\s*/i, '')
    .split(/\s+and\s+|\s*,\s*/i).map(name => name.trim()).filter(Boolean);
  if (names.length !== 2) throw new Error('Say two card names, for example “Cleanse and Plunder”.');
  const catalog = (definitions ?? []).filter(item => item?.category === 'secondary')
    .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index);
  const matches = names.map(name => {
    const spokenName = normalize(name) === 'assassinate' ? 'assassination' : normalize(name);
    const found = catalog.filter(item => normalize(item.name) === spokenName);
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

/* Safari can leave a speech session open without result, error or end events.
   Keep a bounded session and detach late callbacks before restoring the UI. */
export function createSecondarySpeechCapture(Recognition, {
  onTranscript = () => {}, onFailure = () => {}, onEnded = () => {},
  timeoutMs = 15000, schedule = setTimeout, cancel = clearTimeout
} = {}) {
  let current = null;
  let timer = null;
  function release(abort = false) {
    const session = current;
    current = null;
    if (timer !== null) { cancel(timer); timer = null; }
    if (!session) return;
    session.onresult = null;
    session.onerror = null;
    session.onend = null;
    if (abort) {
      try { session.abort?.(); } catch { /* Safari may already have closed it. */ }
    }
  }
  return {
    get listening() { return current !== null; },
    start() {
      release(true);
      let session;
      try {
        session = new Recognition();
        current = session;
        session.lang = 'en-US';
        session.interimResults = false;
        session.maxAlternatives = 1;
        session.onresult = result => {
          if (current !== session) return;
          const transcript = result.results?.[0]?.[0]?.transcript ?? '';
          release(false);
          onTranscript(transcript);
        };
        session.onerror = result => {
          if (current !== session) return;
          release(false);
          onFailure('Microphone: ' + (result.error ?? 'unavailable'));
        };
        session.onend = () => {
          if (current !== session) return;
          release(false);
          onEnded();
        };
        session.start();
        if (current === session) timer = schedule(() => {
          if (current !== session) return;
          release(true);
          onFailure('Safari did not respond to the microphone. Use iPad Dictation in the text field.');
        }, timeoutMs);
        return true;
      } catch (error) {
        release(true);
        onFailure(error?.message ?? String(error));
        return false;
      }
    },
    stop() { release(true); },
    destroy() { release(true); }
  };
}
