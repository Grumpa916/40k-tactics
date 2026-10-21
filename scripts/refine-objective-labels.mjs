import fs from 'node:fs';

let map=fs.readFileSync('src/ui/battlefield-map.js','utf8');
const old=`  if (name === "Expansion 1" || name === "Expansion 2") {\n    const position = selectedLayoutGeometry(state)?.objectivePositions?.[name];\n    if (position && perspectivePlayerId) {\n      const myEdgeIsBottom = defender === perspectivePlayerId ? name === "Expansion 1" : name === "Expansion 2";\n      return myEdgeIsBottom ? "My Expansion" : "Opponent Expansion";\n    }\n  }`;
const next=`  if (name === "Expansion 1" || name === "Expansion 2") {\n    const positions = selectedLayoutGeometry(state)?.objectivePositions ?? {};\n    const position = positions[name];\n    const attackerHome = positions["Attacker Home"];\n    const defenderHome = positions["Defender Home"];\n    if (position && attackerHome && defenderHome && perspectivePlayerId) {\n      const distance = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;\n      const expansionOwner = distance(position, attackerHome) < distance(position, defenderHome) ? attacker : defender;\n      return expansionOwner === perspectivePlayerId ? "My Expansion" : "Opponent Expansion";\n    }\n  }`;
if(!map.includes(old)) throw new Error('expansion label block missing');
map=map.replace(old,next);
map=map.replace(`<span><i class="objective"></i> Objective</span>`,`<span><i class="objective" style="background:#17496b;border-color:#7ec8ff"></i> My control</span><span><i class="objective" style="background:#6b2727;border-color:#ff9c93"></i> Opponent control</span><span><i class="objective" style="background:#66521c;border-color:#f6d783"></i> Contested</span>`);
fs.writeFileSync('src/ui/battlefield-map.js',map);

let command=fs.readFileSync('src/ui/command-screen.js','utf8');
const before=`renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: playerId })`;
const after=`renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: perspectivePlayerId ?? playerId })`;
if(!command.includes(before)) throw new Error('command map perspective call missing');
command=command.replace(before,after);
fs.writeFileSync('src/ui/command-screen.js',command);
