// Shared with the accepted terrain preview and Step 3. Keep setup maps in the same
// 60x44 landscape presentation used by deployment and live play.
export const TERRAIN_PLACEMENT_MAP_STYLES = `
    [data-terrain-placement-map] { width: 100%; }
    [data-terrain-placement-map] .battlefield-map__board { max-height: calc(100vh - 230px); }
    [data-terrain-placement-map] .battlefield-map__board--event-companion-blue-bottom { width: 100%; max-height: none; margin-inline: auto; aspect-ratio: 15 / 11; }
    [data-terrain-placement-map] .battlefield-map__dimension-line { stroke: #f6d783; stroke-width: 1.35; stroke-dasharray: 5 3; opacity: .98; vector-effect: non-scaling-stroke; }
    [data-terrain-placement-map] .battlefield-map__dimension-anchor { fill: #f6d783; stroke: #101820; stroke-width: 1; vector-effect: non-scaling-stroke; }
    [data-terrain-placement-map] .battlefield-map__dimension-text { fill: #f4f8fb; font-family: Arial,sans-serif; font-size: 2.15px; font-weight: 900; paint-order: stroke; stroke: #071019; stroke-width: .9px; stroke-linejoin: round; }
    [data-terrain-placement-map] .battlefield-map__geometry { pointer-events: auto; }
    [data-terrain-placement-map] .battlefield-map__terrain { pointer-events: all; cursor: pointer; touch-action: manipulation; transition: fill .12s ease, stroke .12s ease, stroke-width .12s ease; }
    [data-terrain-placement-map] .battlefield-map__terrain.is-measurement-focused { fill: rgba(154, 145, 98, .86); stroke: #f6d783; stroke-width: .8; }
    .terrain-focus-controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 6px 0 10px; padding: 8px 10px; border: 1px solid #465767; border-radius: 8px; background: #121c24; color: #cbd6df; font-size: 13px; }
    .terrain-focus-controls button { flex: 0 0 auto; min-height: 38px; padding: 6px 10px; }
    @media (orientation: landscape) and (min-width: 700px) { [data-terrain-placement-map] .battlefield-map__board { max-height: calc(100vh - 190px); } }
    @media (max-width: 650px) { .terrain-focus-controls { align-items: stretch; flex-direction: column; } .terrain-focus-controls button { width: 100%; } }
`;
