import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
import { renderBattlefieldMap } from './battlefield-map.js';
import { applyApprovedLiveMapSymbols } from './live-map-symbols.js';
import { applyLiveMapStatusBadges } from './live-map-status-badges.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

// Zoom changes presentation only. Stored unit coordinates are never changed.
export function createLiveMapView() {
  let zoom = 1, left = 0, top = 0;
  return {
    render(state, options) {
      const stylesheet = new URL('./styles/live-map.css', import.meta.url);
      stylesheet.searchParams.set('v', 'approved-symbols-1');
      const href = stylesheet.href;
      const symbolsStylesheet = new URL('./styles/live-map-symbols.css', import.meta.url);
      symbolsStylesheet.searchParams.set('v', 'approved-symbols-1');
      const symbolsHref = symbolsStylesheet.href;
      const showZoomControls = options?.showZoomControls !== false;
      let map = renderBattlefieldMap(state, { ...options, compactMarkers:true, showMeasurements:false, activationForUnit:id => getUnitActivationPresentation(state,id) });
      map = applyApprovedLiveMapSymbols(map, state);
      map = applyLiveMapStatusBadges(map, state);
      map = map.replace('<div class="battlefield-map__board"', `<div class="live-map__viewport" data-live-map-viewport><div class="live-map__canvas" data-live-map-canvas style="width:${zoom*100}%;height:${zoom*100}%"><div class="battlefield-map__board"`);
      map = map.replace('<!-- battlefield-map-board-end -->', '</div></div>');
      const zoomControls = showZoomControls ? `<nav aria-label="Map zoom"><button type="button" data-map-zoom="out" aria-label="Zoom out">−</button><span data-map-zoom-value>${Math.round(zoom*100)}%</span><button type="button" data-map-zoom="in" aria-label="Zoom in">+</button><button type="button" data-map-zoom="fit">Fit</button><small>Zoom and scroll for crowded units · full names in unit/target selectors</small></nav>` : '';
      return `<link rel="stylesheet" href="${esc(href)}"><link rel="stylesheet" href="${esc(symbolsHref)}"><div class="live-map">${zoomControls}${map}</div>`;
    },
    bind(container) {
      const viewport = container.querySelector('[data-live-map-viewport]');
      const canvas = container.querySelector('[data-live-map-canvas]');
      if (viewport) {
        viewport.scrollLeft = left; viewport.scrollTop = top;
        viewport.addEventListener('scroll', () => { left = viewport.scrollLeft; top = viewport.scrollTop; });
      }
      container.querySelectorAll?.('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
        const old = zoom;
        zoom = button.getAttribute('data-map-zoom') === 'fit' ? 1 : Math.max(1,Math.min(3,zoom+(button.getAttribute('data-map-zoom') === 'in' ? .5 : -.5)));
        if (canvas?.style) { canvas.style.width = zoom*100+'%'; canvas.style.height = zoom*100+'%'; }
        if (viewport) {
          viewport.scrollLeft = zoom === 1 ? 0 : (left+(viewport.clientWidth??0)/2)*zoom/old-(viewport.clientWidth??0)/2;
          viewport.scrollTop = zoom === 1 ? 0 : (top+(viewport.clientHeight??0)/2)*zoom/old-(viewport.clientHeight??0)/2;
          left = viewport.scrollLeft; top = viewport.scrollTop;
        }
        const value = container.querySelector('[data-map-zoom-value]');
        if (value) value.textContent = Math.round(zoom*100)+'%';
      }));
    }
  };
}