import { getBattlefieldTerritoryContext } from "../rules/battlefield-territory.js";

const STYLE_ID = "battlefield-territory-overlay-styles";
const MAP_MODES = new Set(["planning", "deployment", "live"]);

function ensureStyles(root) {
  const doc = root?.ownerDocument ?? globalThis.document;
  if (!doc?.head || doc.getElementById?.(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .battlefield-map__territory-overlay{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
    .battlefield-map__territory-boundary{position:absolute;box-sizing:border-box;opacity:.95;filter:drop-shadow(0 0 2px #101820)}
    .battlefield-map__territory-boundary.is-vertical{top:0;bottom:0;width:0;border-left:2px dashed #f6d783}
    .battlefield-map__territory-boundary.is-horizontal{left:0;right:0;height:0;border-top:2px dashed #f6d783}
    .battlefield-map__territory-label{position:absolute;transform:translate(-50%,-50%);max-width:34%;padding:2px 5px;border:1px solid rgba(246,215,131,.52);border-radius:999px;background:rgba(12,20,25,.72);color:#f6e5af;font-size:8px;font-weight:850;line-height:1.1;letter-spacing:.02em;text-align:center;text-transform:uppercase;text-shadow:0 1px 2px #000;white-space:nowrap}
    .battlefield-map__territory-label[data-territory-perspective="mine"]{border-color:rgba(126,200,255,.72);color:#dff3ff}
    .battlefield-map__territory-label[data-territory-perspective="opponent"]{border-color:rgba(255,156,147,.72);color:#ffe5e1}
  `;
  doc.head.append(style);
}

function percentX(x) {
  return Math.max(0, Math.min(100, Number(x) / 60 * 100));
}

function percentY(y) {
  return Math.max(0, Math.min(100, (44 - Number(y)) / 44 * 100));
}

function rectCenter(rect) {
  return {
    x: Number(rect.x) + Number(rect.width) / 2,
    y: Number(rect.y) + Number(rect.height) / 2
  };
}

function perspectiveLabels(context, perspectivePlayerId) {
  if (perspectivePlayerId && context.attackerPlayerId && context.defenderPlayerId) {
    return {
      attacker: perspectivePlayerId === context.attackerPlayerId
        ? { text: "My Territory", perspective: "mine" }
        : { text: "Opponent Territory", perspective: "opponent" },
      defender: perspectivePlayerId === context.defenderPlayerId
        ? { text: "My Territory", perspective: "mine" }
        : { text: "Opponent Territory", perspective: "opponent" }
    };
  }
  return {
    attacker: { text: "Attacker Territory", perspective: "attacker" },
    defender: { text: "Defender Territory", perspective: "defender" }
  };
}

function ensureChild(overlay, selector, className) {
  let child = overlay.querySelector?.(selector) ?? null;
  if (child) return child;
  child = overlay.ownerDocument.createElement("div");
  child.className = className;
  overlay.append(child);
  return child;
}

function updateLabel(label, rect, descriptor, role) {
  const center = rectCenter(rect);
  label.dataset.territoryRole = role;
  label.dataset.territoryPerspective = descriptor.perspective;
  label.style.left = `${percentX(center.x)}%`;
  label.style.top = `${percentY(center.y)}%`;
  if (label.textContent !== descriptor.text) label.textContent = descriptor.text;
}

function applyToBoard(board, context, perspectivePlayerId) {
  const modeHost = board.closest?.("[data-map-mode]");
  const mode = modeHost?.getAttribute?.("data-map-mode") ?? null;
  if (!MAP_MODES.has(mode)) return;

  let overlay = board.querySelector?.("[data-territory-overlay]") ?? null;
  if (!overlay) {
    overlay = board.ownerDocument.createElement("div");
    overlay.className = "battlefield-map__territory-overlay";
    overlay.dataset.territoryOverlay = "official-event-companion";
    overlay.setAttribute("aria-hidden", "true");
    board.append(overlay);
  }

  const boundary = ensureChild(
    overlay,
    "[data-territory-boundary]",
    "battlefield-map__territory-boundary"
  );
  boundary.dataset.territoryBoundary = context.divider.orientation;
  boundary.className = `battlefield-map__territory-boundary is-${context.divider.orientation}`;
  boundary.style.left = "";
  boundary.style.top = "";
  if (context.divider.orientation === "vertical") {
    boundary.style.left = `${percentX(context.divider.coordinate)}%`;
  } else {
    boundary.style.top = `${percentY(context.divider.coordinate)}%`;
  }

  const labels = perspectiveLabels(context, perspectivePlayerId);
  const attackerLabel = ensureChild(
    overlay,
    '[data-territory-role="attacker"]',
    "battlefield-map__territory-label"
  );
  const defenderLabel = ensureChild(
    overlay,
    '[data-territory-role="defender"]',
    "battlefield-map__territory-label"
  );
  updateLabel(attackerLabel, context.attacker, labels.attacker, "attacker");
  updateLabel(defenderLabel, context.defender, labels.defender, "defender");
}

export function applyTerritoryMapOverlay(root, { state, perspectivePlayerId = null } = {}) {
  if (!root || !state) return;
  ensureStyles(root);
  const context = getBattlefieldTerritoryContext(state, { playerId: perspectivePlayerId });
  if (!context) return;
  root.querySelectorAll?.("[data-battlefield-map-board]")?.forEach((board) => {
    applyToBoard(board, context, perspectivePlayerId);
  });
}

export function installTerritoryMapOverlay(root, { session, perspectivePlayerId = null } = {}) {
  if (!root || !session?.getState) return () => {};
  ensureStyles(root);

  const apply = () => applyTerritoryMapOverlay(root, {
    state: session.getState(),
    perspectivePlayerId
  });

  const Observer = root.ownerDocument?.defaultView?.MutationObserver ?? globalThis.MutationObserver;
  const observer = Observer ? new Observer(() => apply()) : null;
  observer?.observe?.(root, { childList: true, subtree: true });
  const unsubscribe = typeof session.subscribe === "function" ? session.subscribe(apply) : null;
  apply();

  return () => {
    observer?.disconnect?.();
    if (typeof unsubscribe === "function") unsubscribe();
  };
}
