import fs from 'node:fs';

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`${label}: source not found in ${path}`);
  text = text.replace(before, after);
  fs.writeFileSync(path, text);
}

// Shrink only the three battlefield-layout preview maps to 10% of their current rendered width.
fs.appendFileSync('src/ui/styles/prototype-workspace.css', `\n\n/* Battlefield layout selection: tiny reference diagrams beneath the A/B/C controls. */\n.event-companion-layout-diagrams .event-companion-layout-thumbnail {\n  width:10% !important;\n  max-width:10% !important;\n  margin:0 auto !important;\n}\n.event-companion-layout-diagrams .event-companion-layout-thumbnail [data-battlefield-map],\n.event-companion-layout-diagrams .event-companion-layout-thumbnail .battlefield-map__board {\n  width:100% !important;\n  max-width:100% !important;\n}\n`);

// Make the entire Primary Missions header/window surface toggle the current primary mission details.
replaceOnce(
  'src/ui/battle-shell.js',
`  function handleMissionSummaryToggle(event) {\n    const summary = event.target?.closest?.(".battle-mission-summary__section > summary");\n    if (!summary || !container.contains(summary)) return;\n    const details = summary.parentElement;\n    const key = details?.getAttribute?.("data-mission-summary-key");\n    if (!details || !key) return;\n    event.preventDefault?.();\n    details.open = !details.open;\n    missionOpenStates = { ...missionOpenStates, [key]: details.open };\n  }`,
`  function handleMissionSummaryToggle(event) {\n    const primaryWindow = event.target?.closest?.('.battle-mission-summary__section[data-mission-summary-key="mission-section-primary"]');\n    const summary = event.target?.closest?.(".battle-mission-summary__section > summary");\n    const details = primaryWindow && !event.target?.closest?.('.battle-mission-summary__section-content')\n      ? primaryWindow\n      : summary?.parentElement;\n    if (!details || !container.contains(details)) return;\n    const key = details.getAttribute?.("data-mission-summary-key");\n    if (!key) return;\n    event.preventDefault?.();\n    details.open = !details.open;\n    missionOpenStates = { ...missionOpenStates, [key]: details.open };\n  }`,
  'primary mission window toggle'
);

fs.writeFileSync('tests/ui/layout-preview-primary-toggle.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\ntest('battlefield layout preview maps render at ten percent width', () => {\n  const css = fs.readFileSync(new URL('../../src/ui/styles/prototype-workspace.css', import.meta.url), 'utf8');\n  assert.match(css, /event-companion-layout-diagrams \\.event-companion-layout-thumbnail[\\s\\S]*width:10% !important/);\n  assert.match(css, /max-width:10% !important/);\n});\n\ntest('primary mission window can toggle without requiring a text-span click', () => {\n  const shell = fs.readFileSync(new URL('../../src/ui/battle-shell.js', import.meta.url), 'utf8');\n  assert.match(shell, /mission-section-primary/);\n  assert.match(shell, /primaryWindow && !event\\.target\\?\\.closest\\?\\.\\('\.battle-mission-summary__section-content'\\)/);\n  assert.match(shell, /details\\.open = !details\\.open/);\n});\n`);
