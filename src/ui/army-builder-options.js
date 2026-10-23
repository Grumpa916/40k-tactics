import { escapeHtml } from "./army-builder-html.js";
import { SPACE_MARINES_DETACHMENTS } from "../data/space-marines-rules.js";
import { ADEPTUS_CUSTODES_DETACHMENTS } from "../data/adeptus-custodes-faction-rules.js";
function normalizedFaction(value) { return String(value ?? "").trim().toLowerCase(); }

const TYRANID_DETACHMENTS = Object.freeze([
  { name: "Ambush Predators", forceDisposition: "Disruption", detachmentPoints: 1 },
  { name: "Assimilation Swarm", forceDisposition: "Priority Assets", detachmentPoints: 2 },
  { name: "Crusher Stampede", forceDisposition: "Purge the Foe", detachmentPoints: 2 },
  { name: "Invasion Fleet", forceDisposition: "Take and Hold", detachmentPoints: 3 },
  { name: "Subterranean Assault", forceDisposition: "Disruption", detachmentPoints: 3 },
  { name: "Synaptic Nexus", forceDisposition: "Disruption", detachmentPoints: 2 },
  { name: "Talons of the Norn Queen", forceDisposition: "Take and Hold", detachmentPoints: 1 },
  { name: "Unending Swarm", forceDisposition: "Take and Hold", detachmentPoints: 2 },
  { name: "Vanguard Onslaught", forceDisposition: "Reconnaissance", detachmentPoints: 2 },
  { name: "Warrior Bioform Onslaught", forceDisposition: "Take and Hold", detachmentPoints: 1 }
]);

function appendDetachmentOptions(options, detachments, selected) {
  for (const detachment of detachments) {
    const shieldHost = detachment.uniqueShieldHost ? ' · Unique Shield Host' : '';
    options.push('<option value="' + escapeHtml(detachment.name) + '"' +
      (selected === detachment.name ? ' selected' : '') + '>' +
      escapeHtml(detachment.name + ' · ' + detachment.forceDisposition + ' · ' + detachment.detachmentPoints + ' DP' + shieldHost) +
      '</option>');
  }
}

export function detachmentOptions(faction, selected = null) {
  const options = ['<option value="">Choose a detachment…</option>'];
  const normalized = normalizedFaction(faction);
  const isTyranids = normalized === "tyranids";
  const isSpaceMarines = normalized === "space marines";
  const isCustodes = normalized === "adeptus custodes";
  const detachments = isTyranids ? TYRANID_DETACHMENTS
    : isSpaceMarines ? SPACE_MARINES_DETACHMENTS
      : isCustodes ? ADEPTUS_CUSTODES_DETACHMENTS : [];
  const knownNames = detachments.map((item) => item.name);
  appendDetachmentOptions(options, detachments, selected);
  if (selected && !knownNames.includes(selected)) {
    options.push('<option value="__custom__" selected>Other / custom (saved value)</option>');
  } else {
    options.push('<option value="__custom__">Other / enter manually</option>');
  }
  return options.join("");
}
