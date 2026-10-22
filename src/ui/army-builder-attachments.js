import { getEligibleBodyguards } from "../state/leader-bodyguard-attachments.js";
import { escapeHtml } from "./army-builder-html.js";
export function renderAttachmentControls(unit, current, busy) {
    const attachedBodyguard = unit.attachedToBodyguardId
      ? current?.units.find((candidate) => candidate.id === unit.attachedToBodyguardId)
      : null;
    const attachedLeaders = (unit.attachedLeaderIds ?? [])
      .map((id) => current?.units.find((candidate) => candidate.id === id))
      .filter(Boolean);
    const isLeader = unit.datasheet?.leader?.isLeader === true;
    const isBodyguard = unit.datasheet?.bodyguard?.canReceiveLeader !== undefined ||
      unit.datasheet?.bodyguard?.maxAttachedLeaders !== undefined;
    if (!isLeader && !isBodyguard && !attachedBodyguard && attachedLeaders.length === 0) return "";
    let html = '<section class="army-roster-panel__attachments" aria-label="Leader and Bodyguard attachments"><strong>Leader / Bodyguard</strong>';
    if (attachedBodyguard) {
      html += '<p>Attached to: ' + escapeHtml(attachedBodyguard.name) + '</p>' +
        '<button type="button" data-detach-leader="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Detach Leader</button>';
    } else if (isLeader) {
      let eligible = [];
      try { eligible = getEligibleBodyguards(current, unit.id); } catch { eligible = []; }
      if (eligible.length) {
        html += '<label>Attach to Bodyguard<select data-bodyguard-choice="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '><option value="">Choose verified Bodyguard…</option>' +
          eligible.map((bodyguard) => '<option value="' + escapeHtml(bodyguard.id) + '">' + escapeHtml(bodyguard.name) + '</option>').join("") +
          '</select></label><button type="button" data-attach-leader="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Attach Leader</button>';
      } else {
        html += '<p>No verified eligible Bodyguard is available. Pairings remain disabled until reviewed datasheet compatibility is recorded.</p>';
      }
    }
    if (isBodyguard) {
      html += '<p>' + (attachedLeaders.length
        ? 'Attached Leader' + (attachedLeaders.length === 1 ? ': ' : 's: ') + attachedLeaders.map((leader) => escapeHtml(leader.name)).join(", ")
        : 'No Leader attached') + '</p>';
    }
    html += '</section>';
    return html;
  }

