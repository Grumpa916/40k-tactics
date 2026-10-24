const LABELS = {
  'combat.resolve_attack': 'attack',
  'unit.normal_move': 'normal move', 'unit.advance': 'advance', 'unit.record_stationary': 'stationary choice',
  'unit.record_fall_back': 'fall back', 'battlefield_map.adjust_live_position': 'map move',
  'victory_points.record_award': 'VP award', 'victory_points.adjust': 'VP adjustment',
  'secondary_mission.record_score': 'secondary score',
  'objective.record_control': 'objective control', 'command_points.record_change': 'CP adjustment'
};
export function describeSessionCorrection(command, state) {
  const label = LABELS[command.type];
  if (!label) return null;
  const p = command.payload ?? {};
  const unit = id => state.units?.find(u => u.id === id)?.name ?? id;
  const detail = command.type === 'combat.resolve_attack'
    ? [unit(p.attackerId), '→', unit(p.allocationTargetId ?? p.targetId), '·', p.weapon?.name ?? 'weapon', '·', p.actualDamage ?? p.totalDamage ?? 0, 'damage'].join(' ')
    : label;
  return { label, detail };
}
