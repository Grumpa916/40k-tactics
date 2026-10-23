import { escapeHtml } from "./army-builder-html.js";
import { SPACE_MARINES_DETACHMENTS } from "../data/space-marines-rules.js";
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

const TYRANID_DETACHMENT_SOURCE = "https://www.warhammer-community.com/en-gb/articles/fchkklcq/new40k-download-new-xenos-faction-packs-today/";

export function detachmentOptions(faction, selected = null) {
  const options = ['<option value="">Choose a detachment…</option>'];
  const isTyranids = normalizedFaction(faction) === "tyranids";
  const isSpaceMarines = normalizedFaction(faction) === "space marines";
  const knownNames = isTyranids ? TYRANID_DETACHMENTS.map((item) => item.name)
    : isSpaceMarines ? SPACE_MARINES_DETACHMENTS.map((item) => item.name) : [];
  if (isTyranids) {
    for (const detachment of TYRANID_DETACHMENTS) {
      options.push('<option value="' + escapeHtml(detachment.name) + '"' +
        (selected === detachment.name ? ' selected' : '') + '>' +
        escapeHtml(detachment.name + ' · ' + detachment.forceDisposition + ' · ' + detachment.detachmentPoints + ' DP') +
        '</option>');
    }
  }
  if (isSpaceMarines) {
    for (const detachment of SPACE_MARINES_DETACHMENTS) {
      options.push('<option value="' + escapeHtml(detachment.name) + '"' +
        (selected === detachment.name ? ' selected' : '') + '>' +
        escapeHtml(detachment.name + ' · ' + detachment.forceDisposition + ' · ' + detachment.detachmentPoints + ' DP') +
        '</option>');
    }
  }
  if (selected && !knownNames.includes(selected)) {
    options.push('<option value="__custom__" selected>Other / custom (saved value)</option>');
  } else {
    options.push('<option value="__custom__">Other / enter manually</option>');
  }
  return options.join("");
}

