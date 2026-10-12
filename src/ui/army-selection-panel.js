function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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
          '<dl><div><dt>Faction</dt><dd>' + escapeHtml(roster.faction ?? "Not set") + '</dd></div>' +
          '<div><dt>Detachment</dt><dd>' + escapeHtml(roster.detachment ?? "Not set") + '</dd></div>' +
          '<div><dt>Units</dt><dd>' + escapeHtml(roster.units?.length ?? 0) + '</dd></div>' +
          '<div><dt>Unit points total</dt><dd>' + (points === null ? "Not set" : escapeHtml(points) + " pts") + '</dd></div></dl>' +
          (unsetPoints ? '<p class="army-selection-card__note">' + unsetPoints + ' unit(s) still need points checked.</p>' : '') :
          '<p class="army-selection-card__empty">No army assigned yet.</p>') +
        '<label>Saved roster<select data-army-selection-roster="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '><option value="">Choose a saved roster…</option>' +
        records.map(record => '<option value="' + escapeHtml(record.id) + '"' + (record.id === rosterId ? " selected" : "") + '>' +
          escapeHtml(record.name) + ' · ' + escapeHtml(record.faction ?? "Faction not set") + ' · ' +
          escapeHtml(record.detachment ?? "Detachment not set") + '</option>').join("") +
        '</select></label><button type="button" data-army-selection-apply="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '>Use selected roster</button></article>';
    }).join("");
    container.innerHTML = '<section class="army-selection" aria-labelledby="army-selection-title">' +
      '<header><h2 id="army-selection-title">Select Armies for This Battle</h2>' +
      '<p>Choose a saved roster for each side. Army lists stay reusable; this step assigns them to this battle only.</p></header>' +
      '<div class="army-selection__sides">' + sides + '</div>' +
      '<p class="army-selection__message" role="status">' + escapeHtml(message) + '</p>' +
      '<button type="button" data-army-selection-refresh' + (busyPlayerId ? " disabled" : "") + '>Refresh saved lists</button></section>';
  }

  async function refresh() {
    try {
      if (!store || typeof store.list !== "function") throw new Error("Sign in to access saved army lists.");
      records = await store.list();
      message = records.length ? "" : "No saved lists found. Open Army Builder to create your first list.";
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
      session.dispatch({ type: "army_roster.apply_to_battle", payload: { roster: result.roster, playerId } });
      message = "Roster assigned to this battle side.";
    } catch (error) {
      message = error?.message ?? String(error);
    } finally {
      busyPlayerId = null;
      render();
    }
  }

  container.addEventListener?.("click", handleClick);
  const unsubscribe = session.subscribe?.(render) ?? (() => {});
  void refresh();
  return {
    refresh,
    destroy() {
      destroyed = true;
      unsubscribe();
      container.removeEventListener?.("click", handleClick);
    }
  };
}
