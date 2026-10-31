import { execSync } from 'node:child_process';

function run(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    const stderr = error.stderr?.toString?.() ?? '';
    return `${stdout}${stderr}`;
  }
}

console.log(run('git fetch --unshallow origin'));
console.log(run('git fetch origin main'));
console.log(run('git config user.name "PR 462 merge diagnostic"'));
console.log(run('git config user.email "diagnostic@example.invalid"'));
console.log(`MERGE_BASE ${run('git merge-base HEAD origin/main').trim()}`);
console.log(run('git merge --no-commit --no-ff origin/main'));
const conflicts = run('git diff --name-only --diff-filter=U').trim();
console.log('CONFLICT_FILES');
console.log(conflicts || '(none)');
if (conflicts) {
  for (const path of conflicts.split(/\r?\n/).filter(Boolean)) {
    console.log(`\n===== ${path} =====`);
    console.log(run(`git diff -- ${JSON.stringify(path)}`));
  }
}
process.exit(0);
