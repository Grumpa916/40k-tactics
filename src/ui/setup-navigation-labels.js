export function setupTabLabel(tab) {
  return ({
    saves: "Account & Saves",
    "army-builder": "Army Builder",
    "pre-game": "Step 2 · Prepare Game",
    battlefield: "Step 3 · Terrain Setup",
    "mission-map": "Step 4 · Pre-First Turn",
    deployment: "Step 5 · Deploy and Begin"
  })[tab] ?? "Setup";
}

export function setupContinueLabel(tab) {
  return ({
    saves: "Continue to Select Armies",
    "army-builder": "Back to Select Armies",
    "army-selection": "Continue to Prepare Game",
    "pre-game": "Continue to Deploy & Begin",
    battlefield: "Continue to Pre-First Turn",
    "mission-map": "Continue",
    deployment: "Deploy and Begin"
  })[tab] ?? "Continue";
}
