/**
 * Leader attachment helpers for reusable army rosters.
 *
 * Compatibility must be sourced from a reviewed datasheet. Unknown compatibility
 * is deliberately treated as unavailable, never as permission to attach.
 */
export function getEligibleBodyguards(roster, leaderId) {
  assertRosterUnits(roster);
  const leader = roster.units.find((unit) => unit.id === leaderId);
  if (!leader) throw new RangeError("Leader unit not found: " + leaderId);
  if (leader.datasheet?.leader?.isLeader !== true || leader.attachedToBodyguardId) return [];

  const leaderMetadata = leader.datasheet?.leader;
  const allowedIds = leaderMetadata?.allowedBodyguardDatasheetIds;
  const leaderReviewStatus = leaderMetadata?.compatibilityReview?.status;
  if (!Array.isArray(allowedIds) || !["accepted", "cross-checked", "source-reviewed"].includes(leaderReviewStatus)) return [];

  return roster.units.filter((unit) => {
    if (unit.id === leader.id) return false;
    const bodyguardId = unit.datasheetId ?? unit.datasheet?.id;
    const bodyguardMetadata = unit.datasheet?.bodyguard;
    const bodyguardReviewStatus = bodyguardMetadata?.compatibilityReview?.status;
    const attachedLeaderIds = unit.attachedLeaderIds ?? [];
    const maxAttachedLeaders = bodyguardMetadata?.maxAttachedLeaders ?? 1;
    return Boolean(bodyguardId && allowedIds.includes(bodyguardId) &&
      bodyguardMetadata?.canReceiveLeader === true &&
      ["accepted", "cross-checked", "source-reviewed"].includes(bodyguardReviewStatus) &&
      !unit.attachedToBodyguardId &&
      attachedLeaderIds.length < maxAttachedLeaders &&
      !attachedLeaderIds.includes(leaderId));
  });
}

export function attachLeaderToBodyguard(roster, leaderId, bodyguardId, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRosterUnits(roster);
  if (leaderId === bodyguardId) throw new RangeError("A Leader cannot join itself.");
  const leader = roster.units.find((unit) => unit.id === leaderId);
  const bodyguard = roster.units.find((unit) => unit.id === bodyguardId);
  if (!leader) throw new RangeError("Leader unit not found: " + leaderId);
  if (!bodyguard) throw new RangeError("Bodyguard unit not found: " + bodyguardId);

  // Guard the public mutation API independently of the eligibility UI.
  // Reassignment must be an explicit detach followed by a new attach.
  if (leader.attachedToBodyguardId) {
    throw new RangeError("Leader is already attached to a Bodyguard; detach it before reassignment.");
  }
  if (!getEligibleBodyguards(roster, leaderId).some((unit) => unit.id === bodyguardId)) {
    throw new RangeError("This Leader-to-Bodyguard pairing is not verified as legal.");
  }

  const units = roster.units.map((unit) => ({ ...unit }));
  const updatedBodyguard = units.find((unit) => unit.id === bodyguardId);
  updatedBodyguard.attachedLeaderIds = [...(updatedBodyguard.attachedLeaderIds ?? []), leaderId];
  const updatedLeader = units.find((unit) => unit.id === leaderId);
  updatedLeader.attachedToBodyguardId = bodyguardId;
  return { ...roster, units, updatedAt };
}

export function detachLeaderFromBodyguard(roster, leaderId, { updatedAt = roster?.updatedAt ?? null } = {}) {
  assertRosterUnits(roster);
  const leader = roster.units.find((unit) => unit.id === leaderId);
  if (!leader) throw new RangeError("Leader unit not found: " + leaderId);
  const bodyguardId = leader.attachedToBodyguardId;
  if (!bodyguardId) return { ...roster, units: roster.units.map((unit) => ({ ...unit })), updatedAt };
  const units = roster.units.map((unit) => {
    const copy = { ...unit };
    if (copy.id === bodyguardId) {
      copy.attachedLeaderIds = (copy.attachedLeaderIds ?? []).filter((id) => id !== leaderId);
      if (copy.attachedLeaderIds.length === 0) delete copy.attachedLeaderIds;
    }
    if (copy.id === leaderId) delete copy.attachedToBodyguardId;
    return copy;
  });
  return { ...roster, units, updatedAt };
}

function assertRosterUnits(roster) {
  if (!roster || typeof roster !== "object" || !Array.isArray(roster.units)) {
    throw new TypeError("A roster with a units array is required.");
  }
}
