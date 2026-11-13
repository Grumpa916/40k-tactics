import { BOARD_WIDTH, BOARD_HEIGHT } from './map-planning-geometry.js';
import { modelBaseSizeForUnit } from '../data/adeptus-custodes-base-sizes.js';

const MM_PER_INCH = 25.4;
const isModelPosition = model => Number.isFinite(model?.position?.x) &&
  Number.isFinite(model?.position?.y);

/**
 * Markers are centered on a live unit position. Their dimensions must reflect
 * a single physical model's base, NEVER an invented entire squad footprint.
 *
 * Percentages follow the same 60 x 44 inch map as the SVG base outlines.
 * As a result the browser scales their CSS pixel dimensions automatically when
 * the board fits a smaller viewport, expands, or is zoomed.
 */
export function getLiveMarkerBaseScale(unit, manualSize = null) {
  const base = modelBaseSizeForUnit(unit, manualSize);
  if (!Number.isFinite(base?.widthMm) || !Number.isFinite(base?.lengthMm) ||
      base.widthMm <= 0 || base.lengthMm <= 0) return null;
  const modelCount = Number(unit?.metadata?.modelCount ??
    unit?.startingStrength ?? unit?.currentStrength ?? unit?.remainingStrength ??
    (Array.isArray(unit?.models) && unit.models.length ? unit.models.length : NaN));
  const positions = Array.isArray(unit?.models) ? unit.models.filter(isModelPosition) : [];
  // A live marker for a multi-model unit is anchored to the group's centre,
  // even when separate model positions are tracked in the base overlay.
  const reference = modelCount !== 1 || positions.length > 1;
  return {
    widthPct: (base.widthMm / (BOARD_WIDTH * MM_PER_INCH)) * 100,
    heightPct: (base.lengthMm / (BOARD_HEIGHT * MM_PER_INCH)) * 100,
    shape: base.shape,
    reference,
    widthMm: base.widthMm,
    lengthMm: base.lengthMm,
    source: base.source
  };
}

// The oval has 180-degree symmetry. Saved rotations are per *unit*, not
// datasheet, so two Vertus squads can face in different directions.
export function getLiveOvalAngle(unit, angles = {}) {
  const saved = unit?.id != null ? angles?.[unit.id] : undefined;
  const modelAngle = Array.isArray(unit?.models) ? unit.models.find(model =>
    Number.isFinite(model?.angle))?.angle : undefined;
  const raw = saved == null ? (modelAngle ?? unit?.angle ?? 0) : saved;
  const degrees = Number(raw);
  return Number.isFinite(degrees) ? ((degrees % 180) + 180) % 180 : 0;
}

export function applyLiveMarkerBaseScales(container, state, manualSizes = {}, ovalAngles = {}) {
  const units = new Map((state?.units ?? []).map(unit => [unit.id, unit]));
  const markers = container?.querySelectorAll?.('.live-map [data-map-unit-id]') ?? [];
  for (const marker of markers) {
    const id = marker.getAttribute?.('data-map-member-id') ||
      marker.getAttribute?.('data-map-unit-id');
    const unit = units.get(id);
    const key = unit?.metadata?.datasheetId || unit?.datasheetId || unit?.id;
    // A shared formation marker is a symbolic handle, not one model's base.
    const scale = marker.getAttribute?.('data-map-formation-symbol') ? null
      : getLiveMarkerBaseScale(unit, manualSizes?.[key]);
    marker.classList?.toggle?.('is-base-scaled', Boolean(scale));
    marker.classList?.toggle?.('is-base-reference', Boolean(scale?.reference));
    marker.classList?.toggle?.('is-base-oval', scale?.shape === 'oval');
    if (!scale) {
      marker.style?.removeProperty?.('--live-base-width');
      marker.style?.removeProperty?.('--live-base-height');
      marker.style?.removeProperty?.('--live-oval-angle');
      marker.removeAttribute?.('data-live-oval-angle');
      marker.removeAttribute?.('data-live-base-mm');
      marker.removeAttribute?.('data-live-base-kind');
      continue;
    }
    marker.style?.setProperty?.('--live-base-width', scale.widthPct.toFixed(6) + '%');
    marker.style?.setProperty?.('--live-base-height', scale.heightPct.toFixed(6) + '%');
    if (scale.shape === 'oval') {
      const angle = getLiveOvalAngle(unit, ovalAngles);
      marker.style?.setProperty?.('--live-oval-angle', angle + 'deg');
      marker.setAttribute?.('data-live-oval-angle', String(angle));
    } else {
      marker.style?.removeProperty?.('--live-oval-angle');
      marker.removeAttribute?.('data-live-oval-angle');
    }
    marker.setAttribute?.('data-live-base-mm', scale.widthMm + 'x' + scale.lengthMm);
    marker.setAttribute?.('data-live-base-kind', scale.reference ? 'reference' : 'single-model');
  }
}
