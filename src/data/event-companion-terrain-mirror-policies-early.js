// Event Companion Pages 9-17: source-audited printed values; no inferred inch values.
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const PAGES = freeze({
  9: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T6","T2":"T8","T3":"T11","T4":"T12","T5":"T13","T6":"T1","T7":"T14","T8":"T2","T9":"T16","T10":"T15","T11":"T3","T12":"T4","T13":"T5","T14":"T7","T15":"T10","T16":"T9"},"targetInternalHalf":null},
  10: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T8","T2":"T9","T3":"T10","T4":"T13","T5":"T14","T6":"T11","T7":"T12","T8":"T1","T9":"T2","T10":"T3","T11":"T6","T12":"T7","T13":"T4","T14":"T5","T15":"T16","T16":"T15"},"targetInternalHalf":null},
  11: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T6","T2":"T9","T3":"T7","T4":"T5","T5":"T4","T6":"T1","T7":"T3","T8":"T14","T9":"T2","T10":"T12","T11":"T13","T12":"T10","T13":"T11","T14":"T8","T15":"T16","T16":"T15"},"targetInternalHalf":null},
  12: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T8","T2":"T9","T3":"T10","T4":"T11","T5":"T12","T6":"T7","T7":"T6","T8":"T1","T9":"T2","T10":"T3","T11":"T4","T12":"T5","T13":"T15","T14":"T16","T15":"T13","T16":"T14"},"targetInternalHalf":null},
  13: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T8","T2":"T9","T3":"T14","T4":"T12","T5":"T7","T6":"T13","T7":"T5","T8":"T1","T9":"T2","T10":"T15","T11":"T16","T12":"T4","T13":"T6","T14":"T3","T15":"T10","T16":"T11"},"targetInternalHalf":null},
  14: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T13","T2":"T14","T3":"T10","T4":"T9","T5":"T11","T6":"T15","T7":"T12","T8":"T16","T9":"T4","T10":"T3","T11":"T5","T12":"T7","T13":"T1","T14":"T2","T15":"T6","T16":"T8"},"targetInternalHalf":null},
  15: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T5","T2":"T6","T3":"T14","T4":"T10","T5":"T1","T6":"T2","T7":"T15","T8":"T12","T9":"T16","T10":"T4","T11":"T13","T12":"T8","T13":"T11","T14":"T3","T15":"T7","T16":"T9"},"targetInternalHalf":null},
  16: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T2","T2":"T1","T3":"T11","T4":"T13","T5":"T14","T6":"T12","T7":"T8","T8":"T7","T9":"T15","T10":"T16","T11":"T3","T12":"T6","T13":"T4","T14":"T5","T15":"T9","T16":"T10"},"targetInternalHalf":null},
  17: {"enabled":true,"transform":"rotate180","terrainMap":{"T1":"T10","T2":"T12","T3":"T15","T4":"T11","T5":"T8","T6":"T9","T7":"T16","T8":"T5","T9":"T6","T10":"T1","T11":"T4","T12":"T2","T13":"T14","T14":"T13","T15":"T3","T16":"T7"},"targetInternalHalf":null}
});
export function getEarlyTerrainMirrorPolicy(page) { return PAGES[Number(page)] ?? null; }

