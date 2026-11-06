const PHASE_NAMES = Object.freeze({
  command: "command",
  movement: "movement",
  shooting: "shooting",
  charge: "charge",
  fight: "fight"
});

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function phaseMatchesTiming(timing, phase) {
  const name = PHASE_NAMES[normalize(phase)];
  return Boolean(name && new RegExp(`\\b${name}\\b`).test(timing));
}

function turnMatchesTiming(timing, phase, isYourTurn) {
  if (isYourTurn == null || /\beither turn\b|\bany phase\b/.test(timing)) return true;

  // “Opponent Shooting or Fight phase” means the opponent's Shooting phase,
  // plus either player's Fight phase.
  if (normalize(phase) === "fight" && /\bopponent\b/.test(timing) &&
      /\bshooting\b.*\bor\b.*\bfight\b/.test(timing)) return true;

  if (/\bopponent\b/.test(timing)) return !isYourTurn;
  if (/\byour\b/.test(timing)) return isYourTurn;
  return true;
}

export function isStratagemTimingRelevant(stratagem, phase, { isYourTurn } = {}) {
  const timing = normalize(stratagem?.timing);
  const phaseName = normalize(phase);
  const explicitPhases = Array.isArray(stratagem?.phases) ? stratagem.phases.map(normalize) : [];
  const phaseMatches = explicitPhases.length
    ? explicitPhases.includes(phaseName)
    : timing.includes("any phase") || phaseMatchesTiming(timing, phaseName);

  return phaseMatches && turnMatchesTiming(timing, phaseName, isYourTurn);
}
