import fs from 'node:fs';
const path='src/ui/command-screen.js';
let text=fs.readFileSync(path,'utf8');
const old='    const playerId = scoringCheckpointPlayerId ?? perspectivePlayerId ?? state.activePlayer;';
const next='    const playerId = scoringCheckpointPlayerId ?? state.activePlayer ?? state.battle?.activePlayerId ?? perspectivePlayerId;';
if(!text.includes(old)) throw new Error('command player selection source not found');
text=text.replace(old,next);
fs.writeFileSync(path,text);
