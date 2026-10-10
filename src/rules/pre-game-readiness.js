/**
 * Conservative application-level pre-game checks.
 *
 * These checks validate the current V2 state shape only. They intentionally do
 * not encode mission-pack rules, terrain requirements, deployment-zone rules,
 * or faction-specific declarations; those need verified rules data first.
 */
export function evaluatePreGameReadiness(state = {}) {
  const checks = [];
  const players = Array.isArray(state.players) ? state.players : [];
  const units = Array.isArray(state.units) ? state.units : [];

  checks.push({
    id: "players",
    label: "Two players configured",
    status: players.length === 2 && players.every((player) => player?.id)
      ? "complete" : "incomplete",
    detail: players.length === 2 && players.every((player) => player?.id)
      ? "Both player records have identifiers."
      : "Configure exactly two players with identifiers."
  });

  const playerIds = new Set(players.map((player) => player?.id).filter(Boolean));
  const unitsByPlayer = new Map(players.map((player) => [player.id, 0]));
  const invalidOwnerUnits = [];

  for (const unit of units) {
    if (!unit || unit.status === "destroyed") continue;
    if (!playerIds.has(unit.ownerId)) {
      invalidOwnerUnits.push(unit.name ?? unit.id ?? "Unnamed unit");
      continue;
    }
    unitsByPlayer.set(unit.ownerId, (unitsByPlayer.get(unit.ownerId) ?? 0) + 1);
  }

  checks.push({
    id: "armies",
    label: "Both armies represented",
    status: players.length === 2 && players.every((player) => (unitsByPlayer.get(player.id) ?? 0) > 0)
      ? "complete" : "incomplete",
    detail: players.length === 2 && players.every((player) => (unitsByPlayer.get(player.id) ?? 0) > 0)
      ? "Each player has at least one non-destroyed unit."
      : "Each player needs at least one non-destroyed unit."
  });

  checks.push({
    id: "unit-ownership",
    label: "Unit ownership is valid",
    status: invalidOwnerUnits.length === 0 && units.length > 0 ? "complete" : "incomplete",
    detail: invalidOwnerUnits.length === 0 && units.length > 0
      ? "All non-destroyed units belong to a configured player."
      : invalidOwnerUnits.length
        ? "Resolve units without a configured owner: " + invalidOwnerUnits.join(", ") + "."
        : "Add units before continuing."
  });

  const missionId = state.battle?.missionId ?? state.missionId ?? null;
  checks.push({
    id: "mission",
    label: "Mission selected",
    status: missionId ? "complete" : "incomplete",
    detail: missionId ? "A mission identifier is recorded." : "Select a mission before deployment."
  });

  const missing = checks.filter((check) => check.status !== "complete");
  return {
    ready: missing.length === 0,
    checks,
    missing: missing.map((check) => ({ id: check.id, label: check.label, detail: check.detail }))
  };
}
