import { COMMAND_TYPES } from "../commands/game-commands.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function rosterValue(record) {
  return record?.roster && typeof record.roster === "object" ? record.roster : record;
}

function rosterFaction(record) {
  return rosterValue(record)?.faction ?? null;
}

function rosterDetachmentLabel(record) {
  const roster = rosterValue(record);
  const names = [...new Set([
    ...(Array.isArray(roster?.detachments) ? roster.detachments : []),
    roster?.detachment,
    roster?.detachmentName
  ].map((name) => String(name ?? "").trim()).filter(Boolean))];
  return names.length ? names.join(" + ") : null;
}

/**
 * Battle-specific roster assignment. The saved roster library remains editable
 * only in Army Builder; this screen applies a saved snapshot to one battle side.
 */
export function createArmySelectionPanel(container, { store, session, canApply = true } = {}) {
  if (!container || !session || typeof session.getState !== "function") {
    throw new TypeError("A container and battle session are required.");
  }
  let records = [];
  let message = "";
  let busyPlayerId = null;
  let destroyed = false;

  function render() {
    if (destroyed) return;
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    const currentCanApply = canApply && state.phase === "setup" && state.battle?.status === "setup";
    const sides = players.map((player, index) => {
      const roster = state.armyRosters?.[player.id] ?? null;
      const label = players.length === 2 ? (index === 0 ? "Your Army" : "Opponent Army") : (player.name ?? player.id);
      const rosterId = roster?.id ?? "";
      const points = Array.isArray(roster?.units)
        ? roster.units.reduce((sum, unit) => sum + (Number.isFinite(Number(unit.points)) ? Number(unit.points) : 0), 0)
        : null;
      const unsetPoints = (roster?.units ?? []).filter(unit => unit.points == null).length;
      return '<article class="army-selection-card" data-army-selection-side="' + escapeHtml(player.id) + '">' +
        '<h3>' + escapeHtml(label) + '</h3>' +
        (roster ? '<p class="army-selection-card__name"><strong>' + escapeHtml(roster.name ?? "Unnamed roster") + '</strong></p>' +
          '<dl><div><dt>Faction</dt><dd>' + escapeHtml(rosterFaction(roster) ?? "Not set") + '</dd></div>' +
          '<div><dt>Detachment</dt><dd>' + escapeHtml(rosterDetachmentLabel(roster) ?? "Not set") + '</dd></div>' +
          '<div><dt>Units</dt><dd>' + escapeHtml(roster.units?.length ?? 0) + '</dd></div>' +
          '<div><dt>Unit points total</dt><dd>' + (points === null ? "Not set" : escapeHtml(points) + " pts") + '</dd></div></dl>' +
          (unsetPoints ? '<p class="army-selection-card__note">' + unsetPoints + ' unit(s) still need points checked.</p>' : '') :
          '<p class="army-selection-card__empty">No army assigned yet.</p>') +
        '<label>Saved roster<select data-army-selection-roster="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '><option value="">Choose a saved roster…</option>' +
        records.map(record => '<option value="' + escapeHtml(record.id) + '"' + (record.id === rosterId ? " selected" : "") + '>' +
          escapeHtml(record.name) + ' · ' + escapeHtml(rosterFaction(record) ?? "Faction not set") + ' · ' +
          escapeHtml(rosterDetachmentLabel(record) ?? "Detachment not set") + '</option>').join("") +
        '</select></label><button type="button" data-army-selection-apply="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '>Use selected roster</button></article>';
    }).join("");
    const battleSetup = state.battleSetup ?? {};
    const selectedSize = battleSetup.battleSize ?? "";
    const sizeMarkup = '<section class="army-selection__battle-size"><h3>Battle size</h3>' +
      '<label>Agreed game size<select data-battle-size' + (!currentCanApply ? " disabled" : "") + '>' +
      '<option value="">Choose battle size…</option>' +
      '<option value="incursion"' + (selectedSize === "incursion" ? " selected" : "") + '>Incursion · 1,000 points</option>' +
      '<option value="strike_force"' + (selectedSize === "strike_force" ? " selected" : "") + '>Strike Force · 2,000 points</option>' +
      '</select></label>' +
      '</section>';
    container.innerHTML = '<style>.army-selection{display:grid;gap:14px;background:#101820;color:#edf4f7}.army-selection header h2{margin:0 0 8px}.army-selection{color:#edf4f7}.army-selection__battle-size,.army-selection-card{padding:14px;border:1px solid #43535c;border-radius:9px;background:#172129;color:#edf4f7}.army-selection__battle-size label,.army-selection-card label{display:grid;gap:7px;margin:10px 0;font-weight:700}.army-selection select{box-sizing:border-box;width:100%;min-height:44px;padding:9px 10px;font-size:14px;border:1px solid #536987;border-radius:6px;background:#101820;color:#edf4f7}.army-selection button{width:100%;min-height:44px;padding:10px 12px;border:1px solid #536987;border-radius:6px;background:#202b33;color:#edf4f7;font-size:14px;font-weight:700;cursor:pointer}.army-selection__sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.army-selection-card h3{margin:0 0 8px}.army-selection-card dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.army-selection-card dl div{padding:8px;background:#202d36;border-radius:6px;min-width:0}.army-selection-card dt{font-size:11px;color:#aebbc5}.army-selection-card dd{margin:3px 0 0;font-weight:700;overflow-wrap:anywhere}.army-selection__message{margin:0;padding:8px 10px;border-radius:6px;background:#202d36;color:#edf4f7}@media(max-width:700px){.army-selection__sides{grid-template-columns:1fr}.army-selection__battle-size,.army-selection-card{padding:12px}}</style><section class="army-selection" aria-label="Army selection">' +
      sizeMarkup +
      '<div class="army-selection__sides">' + sides + '</div>' +
      '<p class="army-selection__message" role="status">' + escapeHtml(message) + '</p>' +
      '<button type="button" data-army-selection-refresh' + (busyPlayerId ? " disabled" : "") + '>Refresh saved lists</button></section>';
  }

  async function refresh() {
    try {
      if (!store || typeof store.list !== "function") throw new Error("Sign in to access saved army lists.");
      const listed = await store.list();
      records = await Promise.all((Array.isArray(listed) ? listed : []).map(async (record) => {
        if (record?.roster || !record?.id || typeof store.load !== "function") return record;
        try {
          const loaded = await store.load(record.id);
          return loaded?.roster ? { ...record, roster: loaded.roster } : record;
        } catch {
          return record;
        }
      }));
      message = records.length ? "" : "No saved lists found. Open Army Builder to create your first list.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  function handleChange(event) {
    const select = event.target?.closest?.("[data-battle-size]");
    if (!select || !container.contains(select)) return;
    try {
      session.dispatch({ type: COMMAND_TYPES.SET_BATTLE_SIZE, payload: { battleSize: select.value || null } });
      message = select.value ? "Battle size saved for this battle." : "Choose the agreed battle size.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  async function handleClick(event) {
    const applyButton = event.target?.closest?.("[data-army-selection-apply]");
    const refreshButton = event.target?.closest?.("[data-army-selection-refresh]");
    if (!applyButton && !refreshButton) return;
    if (!container.contains(applyButton ?? refreshButton)) return;
    if (refreshButton) {
      await refresh();
      return;
    }
    const playerId = applyButton.getAttribute("data-army-selection-apply");
    const select = container.querySelector('[data-army-selection-roster="' + playerId + '"]');
    const rosterId = select?.value ?? "";
    if (!rosterId) {
      message = "Choose a saved roster for this side first.";
      render();
      return;
    }
    busyPlayerId = playerId;
    message = "Loading roster…";
    render();
    try {
      const result = await store.load(rosterId);
      if (!result?.roster) throw new Error("The selected saved roster could not be loaded.");
      session.dispatch({ type: "battle.apply_army_roster", payload: { roster: result.roster, playerId } });
      message = "Roster assigned to this battle side.";
    } catch (error) {
      message = error?.message ?? String(error);
    } finally {
      busyPlayerId = null;
      render();
    }
  }

  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("change", handleChange);
  const unsubscribe = session.subscribe?.(render) ?? (() => {});
  void refresh();
  return {
    refresh,
    destroy() {
      destroyed = true;
      unsubscribe();
      container.removeEventListener?.("click", handleClick);
      container.removeEventListener?.("change", handleChange);
    }
  };
}
