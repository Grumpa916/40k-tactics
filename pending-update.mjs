import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UPDATE_VERSION = "tabletop-layout-propagation-v1";
console.log("UPDATE_VERSION " + UPDATE_VERSION);

function patchFile(path, transform, requiredMarkers = []) {
  if (!existsSync(path)) throw new Error("Refusing update: missing " + path);
  let text = readFileSync(path, "utf8");
  for (const marker of requiredMarkers) {
    if (!text.includes(marker)) throw new Error("Refusing update: " + path + " is missing expected marker: " + marker);
  }
  const before = text;
  text = transform(text);
  if (text !== before) {
    writeFileSync(path, text);
    console.log("Patched " + path);
  } else {
    console.log("No change needed for " + path);
  }
}

function patchBattleDemo(text) {
  const oldLayoutBlock = '  const layoutMode = new URLSearchParams(window.location.search).get("ui") === "tabletop"\n' +
    '    ? "tabletop"\n' +
    '    : "classic";';
  const newLayoutBlock = '  const requestedLayout = new URLSearchParams(window.location.search).get("ui");\n' +
    '  const layoutMode = requestedLayout === "classic" ? "classic" : "tabletop";';
  if (text.includes(oldLayoutBlock)) text = text.replace(oldLayoutBlock, newLayoutBlock);

  if (!text.includes('requestedLayout === "classic" ? "classic" : "tabletop"')) {
    throw new Error("Refusing update: audited Tabletop layout selector not found in battle-demo.js");
  }

  const callStart = text.indexOf('createBattleShell(document.getElementById("battle-app"), {');
  if (callStart < 0) throw new Error("Refusing update: battle shell mount call not found.");
  const callEnd = text.indexOf('\n  });', callStart);
  if (callEnd < 0) throw new Error("Refusing update: battle shell mount call end not found.");
  const call = text.slice(callStart, callEnd);
  if (!/(^|\n)\s*layoutMode\s*,?\s*($|\n)/m.test(call)) {
    const insertion = '\n    layoutMode';
    text = text.slice(0, callEnd) + insertion + text.slice(callEnd);
  }
  return text;
}

function patchShell(text) {
  const oldGate = 'const isSetupView = viewedPhase === "setup" || setupWorkspaceTab !== "deployment";';
  const newGate = 'const isSetupView = viewedPhase === "setup";';
  if (text.includes(oldGate)) text = text.replace(oldGate, newGate);

  text = text.replace(/(export function createBattleShell[\s\S]*?\n\s*)layoutMode = "classic"/, '$1layoutMode = "tabletop"');

  const mountStart = text.indexOf('mountedScreen = factory(screenContainer, {');
  if (mountStart >= 0) {
    const mountEnd = text.indexOf('\n        });', mountStart);
    if (mountEnd < 0) throw new Error("Refusing update: screen factory mount end not found.");
    const mount = text.slice(mountStart, mountEnd);
    if (!/(^|\n)\s*layoutMode\s*,?\s*($|\n)/m.test(mount)) {
      text = text.slice(0, mountEnd) + '\n          layoutMode' + text.slice(mountEnd);
    }
  } else {
    throw new Error("Refusing update: screen factory mount not found in battle-shell.js");
  }
  return text;
}

function patchShellView(text) {
  const oldGate = 'const isSetupView = viewedPhase === "setup" || setupWorkspaceTab !== "deployment";';
  const newGate = 'const isSetupView = viewedPhase === "setup";';
  if (text.includes(oldGate)) text = text.replace(oldGate, newGate);
  text = text.replace(/(export function renderShell[\s\S]*?\n\s*)layoutMode = "classic"/, '$1layoutMode = "tabletop"');
  return text;
}

function patchShooting(text) {
  text = text.replace(/(export function createShootingScreen[\s\S]*?\n\s*)layoutMode = "classic"/, '$1layoutMode = "tabletop"');
  if (!text.includes('layoutMode === "tabletop"')) {
    throw new Error("Refusing update: Shooting renderer does not expose the audited Tabletop branch.");
  }
  return text;
}

patchFile("src/ui/battle-demo.js", patchBattleDemo, ["createBattleShell", "URLSearchParams(window.location.search)"]);
patchFile("src/ui/battle-shell.js", patchShell, ["createBattleShell", "mountedScreen = factory(screenContainer, {"]);
if (existsSync("src/ui/battle-shell-view.js")) {
  patchFile("src/ui/battle-shell-view.js", patchShellView, ["renderShell", "layoutMode"]);
}
patchFile("src/ui/shooting-screen.js", patchShooting, ["createShootingScreen", "layoutMode"]);

const demo = readFileSync("src/ui/battle-demo.js", "utf8");
const shell = readFileSync("src/ui/battle-shell.js", "utf8");
const shooting = readFileSync("src/ui/shooting-screen.js", "utf8");
if (!demo.includes('requestedLayout === "classic" ? "classic" : "tabletop"')) throw new Error("Postflight failed: bootstrap default is not Tabletop.");
if (!/createBattleShell\(document\.getElementById\("battle-app"\), \{[\s\S]*?\n\s*layoutMode\s*\n?\s*\}\);/.test(demo)) throw new Error("Postflight failed: layoutMode is not passed into createBattleShell.");
if (!/export function createBattleShell[\s\S]*?layoutMode = "tabletop"/.test(shell)) throw new Error("Postflight failed: battle shell fallback is not Tabletop.");
if (!/mountedScreen = factory\(screenContainer, \{[\s\S]*?layoutMode[\s\S]*?\n\s*\}\);/.test(shell)) throw new Error("Postflight failed: layoutMode is not propagated to phase screens.");
if (!/export function createShootingScreen[\s\S]*?layoutMode = "tabletop"/.test(shooting)) throw new Error("Postflight failed: Shooting fallback is not Tabletop.");
if (shell.includes('const isSetupView = viewedPhase === "setup" || setupWorkspaceTab !== "deployment";')) throw new Error("Postflight failed: stale setup gate remains in battle-shell.js.");
if (existsSync("src/ui/battle-shell-view.js")) {
  const view = readFileSync("src/ui/battle-shell-view.js", "utf8");
  if (view.includes('const isSetupView = viewedPhase === "setup" || setupWorkspaceTab !== "deployment";')) throw new Error("Postflight failed: stale setup gate remains in battle-shell-view.js.");
}

console.log("Tabletop layout propagation verified end-to-end. ?ui=classic remains the explicit rollback route.");
