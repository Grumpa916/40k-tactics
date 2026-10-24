import { isUnitBattleShocked } from "./unit-status-summary.js";
import { opponentPlayerIds, unitById } from "./tactical-context-utils.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function cpBalance(state, playerId) {
  const value = state?.commandPoints?.[playerId];
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function selectedDetachmentRecords(state, playerId) {
  const roster = state?.armyRosters?.[playerId];
  if (!roster) return [];
  const names = [
    ...(Array.isArray(roster.detachments) ? roster.detachments : []),
    roster.detachment,
    roster.detachmentName
  ].map((name) => typeof name === "string" ? name : name?.name)
    .map((name) => String(name ?? "").trim())
    .filter(Boolean);
  const selected = [...new Set(names)];
  const catalog = roster?.rulesDataRevision?.factionRules?.detachments;
  if (!Array.isArray(catalog)) return [];
  return selected.map((name) => catalog.find((entry) => entry?.name === name)).filter(Boolean);
}

function phaseRelevant(stratagem, phase) {
  if (!stratagem) return false;
  if (Array.isArray(stratagem.phases) && stratagem.phases.length) {
    return stratagem.phases.includes(phase);
  }
  const timing = normalize(stratagem.timing);
  if (!timing) return true;
  if (timing.includes("any phase") || timing.includes("either turn")) return true;
  return timing.includes(normalize(phase));
}

function roleFor(stratagem) {
  const text = normalize(`${stratagem?.name ?? ""} ${stratagem?.description ?? ""} ${stratagem?.timing ?? ""}`);
  const roles = [];
  if (/attack|hit roll|wound roll|damage|strength|armour penetration|\bap\b|lethal hits|sustained hits|precision|weapon/.test(text)) roles.push("combat");
  if (/saving throw|feel no pain|invulnerable|reduce.*damage|targeted by|survive|defensive/.test(text)) roles.push("defence");
  if (/objective|objective control|\boc\b|battle-shock|battleshock|move|movement/.test(text)) roles.push("control");
  return roles.length ? roles : ["other"];
}

function playerContext(state, playerId) {
  const cp = cpBalance(state, playerId);
  const detachments = selectedDetachmentRecords(state, playerId);
  const phase = state?.phase ?? null;
  const relevant = detachments.flatMap((detachment) =>
    (Array.isArray(detachment?.stratagems) ? detachment.stratagems : [])
      .filter((item) => phaseRelevant(item, phase))
      .map((item) => {
        const cost = Number.isFinite(item?.cpCost) ? Number(item.cpCost) : 1;
        return Object.freeze({
          name: item?.name ?? "Unnamed Stratagem",
          detachmentName: detachment.name ?? null,
          cpCost: cost,
          timing: item?.timing ?? "",
          description: item?.description ?? "",
          roles: Object.freeze(roleFor(item)),
          affordable: cost <= cp
        });
      })
  );
  const fallback = state?.armyRosters?.[playerId]?.detachment ?? state?.armyRosters?.[playerId]?.detachmentName ?? null;
  const detachmentNames = detachments.length ? detachments.map((item) => item.name).filter(Boolean) : fallback ? [fallback] : [];
  const statuses = detachments.map((item) => item?.stratagemCatalogStatus).filter(Boolean);
  return Object.freeze({
    playerId,
    cp,
    detachmentName: detachmentNames[0] ?? null,
    detachmentNames: Object.freeze(detachmentNames),
    catalogStatus: statuses.length && statuses.every((status) => status === "complete") ? "complete" : statuses[0] ?? null,
    phaseRelevant: Object.freeze(relevant),
    affordable: Object.freeze(relevant.filter((item) => item.affordable)),
    combat: Object.freeze(relevant.filter((item) => item.affordable && item.roles.includes("combat"))),
    defence: Object.freeze(relevant.filter((item) => item.affordable && item.roles.includes("defence"))),
    control: Object.freeze(relevant.filter((item) => item.affordable && item.roles.includes("control")))
  });
}

/**
 * Surface CP and selected-detachment opportunities without assuming a Stratagem
 * will be used. Target-specific defensive access is suppressed for a currently
 * Battle-shocked enemy unit, matching the recorded battle-shock state.
 */
export function getStratagemResourceContext(state, { playerId, targetUnitId = null } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const own = playerContext(state, playerId);
  const opponentId = opponentPlayerIds(state, playerId)[0] ?? null;
  const opponent = opponentId ? playerContext(state, opponentId) : null;
  const target = targetUnitId ? unitById(state, targetUnitId) : null;
  const targetBattleShocked = Boolean(target && isUnitBattleShocked(target));
  const opponentCanAffectTarget = Boolean(opponent && opponent.cp > 0 && !targetBattleShocked);

  const reasonParts = [];
  if (own.combat.length) {
    const names = own.detachmentNames.length ? ` across ${own.detachmentNames.join(" + ")}` : "";
    reasonParts.push(`${own.combat.length} affordable combat Stratagem option${own.combat.length === 1 ? " is" : "s are"} relevant in this phase${names}.`);
  } else if (own.cp <= 0) {
    reasonParts.push("No friendly CP is currently available for a Stratagem investment.");
  }
  if (targetBattleShocked) {
    reasonParts.push("The target is Battle-shocked, so its controlling player cannot target it with Stratagems while that status applies.");
  } else if (opponent?.defence.length) {
    reasonParts.push(`${opponent.defence.length} affordable opponent defensive Stratagem option${opponent.defence.length === 1 ? " is" : "s are"} phase-relevant; exact eligibility still depends on its text.`);
  }

  return Object.freeze({
    own,
    opponent,
    targetBattleShocked,
    opponentCanAffectTarget,
    reason: reasonParts.join(" ") || "No phase-relevant CP/Stratagem leverage is established from the connected detachment catalogs.",
    assumption: "Stratagem availability is surfaced from CP, phase and all selected detachment catalogs; target eligibility and timing remain governed by the actual Stratagem text."
  });
}
