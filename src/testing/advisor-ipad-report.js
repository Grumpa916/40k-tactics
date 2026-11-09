// Report the exact *current* expectations separately from the initial preset.
// Real finger-dragging and simulated recording deliberately change fixture state.
export function summarizeAdvisorScenarioChecks(inspection) {
  if (!inspection || !Array.isArray(inspection.checks))
    return Object.freeze({passed:0,total:1,unmet:Object.freeze(['Advisor inspection unavailable'])});
  return Object.freeze({
    passed:inspection.passed,
    total:inspection.total,
    unmet:Object.freeze(inspection.checks.filter(check=>!check.passes).map(check=>check.label))
  });
}

export function formatAdvisorScenarioVisitReport(scenarios,visits,initials,actions=new Map()) {
  return scenarios.map(scenario=>{
    const current=visits.get(scenario.id);
    if(!current)return scenario.title+': not visited';
    const initial=initials.get(scenario.id);
    const origin=initial?' · initial '+initial.passed+'/'+initial.total:'';
    const unmet=current.unmet?.length?'\n  Unmet now: '+current.unmet.join('; '):'';
    const activity=actions.get(scenario.id);
    const actionLine=activity?.length?'\n  Interactions: '+activity.join(', '):'';
    const error=current.error?'\n  Error: '+current.error:'';
    return scenario.title+': current '+current.passed+'/'+current.total+origin+
      unmet+actionLine+error;
  }).join('\n');
}
