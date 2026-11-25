// Presentation-only legend for the focused, map-only live battle view.
// Icons/colors match unit-active-statuses.js, live-map-status-badges.js
// and live-map-symbols.css. It has no state and does not save preferences.
const SYMBOLS = Object.freeze([
  ['unit-friendly','AC2','Your unit (abbreviation + number)'],
  ['unit-opponent','LS','Opponent unit'],
  ['unit-selected','AC1','Selected unit (gold ring)'],
  ['objective-mine','C1','Objective you control'],
  ['objective-opponent','C2','Objective opponent controls'],
  ['objective-contested','C1','Contested objective']
]);

const BADGES = Object.freeze([
  ['is-katah-readied','R','Martial Ka’tah ready'],
  ['is-katah-rereadied','↻','Ka’tah re-readied'],
  ['is-katah-active','K','Ka’tah active this phase'],
  ['is-katah-spent','K','Ka’tah spent'],
  ['is-fights-first','FF','Fights First'],
  ['is-charged','↟','Charged this turn'],
  ['is-engaged','⚔','Engaged in melee'],
  ['is-battle-shocked','!','Battle-shocked'],
  ['is-mission-action','⌛','Mission Action underway'],
  ['is-other','D','Active Combat Doctrine'],
  ['is-off-battlefield','×','Destroyed'],
  ['is-off-battlefield','R','Reserves / off battlefield'],
  ['is-activation-resolved','✓','Activation resolved'],
  ['is-activation-active','…','Activation in progress']
]);

const esc = value => String(value ?? '').replaceAll('&','&amp;')
  .replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function rows(items, type) {
  return '<ul class="live-map-key__list">' + items.map(([style, icon, label]) =>
    '<li><span class="live-map-key__symbol ' + type + ' ' + esc(style) +
    '" aria-hidden="true">' + esc(icon) + '</span><span>' +
    esc(label) + '</span></li>').join('') + '</ul>';
}

export function renderLiveMapKey() {
  return '<details class="live-map-key" data-live-map-key>' +
    '<summary>Map key</summary>' +
    '<div class="live-map-key__body">' +
      '<section class="live-map-key__group"><strong>Units and objectives</strong>' + rows(SYMBOLS,'unit') + '</section>' +
      '<section class="live-map-key__group"><strong>Status badges</strong>' + rows(BADGES,'badge') + '</section>' +
      '<section class="live-map-key__group"><strong>Map markings</strong>' +
      '<ul class="live-map-key__list">' +
        '<li><span class="live-map-key__mark is-terrain" aria-hidden="true"></span><span>Terrain area</span></li>' +
        '<li><span class="live-map-key__mark is-territory" aria-hidden="true"></span><span>Territory boundary</span></li>' +
        '<li><span class="live-map-key__mark is-base" aria-hidden="true"></span><span>Physical base outline (dashed = reference)</span></li>' +
      '</ul><small>Marker positions are approximate. Check actual tabletop measurements.</small></section>' +
    '</div></details>';
}
