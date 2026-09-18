import assert from 'assert';
import { permissionManager } from '../src/core/permissions.js';
import { systemTool } from '../src/tools/system.js';

export default async function run() {
  console.log('▶ Testing: Safety & Permissions Manager...');
  let passed = 0;

  // 1. Safe commands pass without confirmation
  const pwdEval = permissionManager.evaluateShellCommand('pwd');
  assert.strictEqual(pwdEval.allowed, true);
  assert.strictEqual(pwdEval.requiresConfirmation, false);
  console.log('  ✔ safe terminal commands allowed');
  passed++;

  // 2. Destructive command blocked outright
  const rmEval = permissionManager.evaluateShellCommand('rm -rf /');
  assert.strictEqual(rmEval.allowed, false);
  console.log('  ✔ destructive "rm -rf /" strictly blocked');
  passed++;

  // 3. Fork bomb blocked
  const forkEval = permissionManager.evaluateShellCommand(':(){ :|:& };:');
  assert.strictEqual(forkEval.allowed, false);
  console.log('  ✔ fork bombs blocked');
  passed++;

  // 4. System tool executes safe commands
  const sysRes = await systemTool.execute({ command: 'echo "NEXA"' });
  assert.strictEqual(sysRes.success, true);
  assert.ok(sysRes.data.output.includes('NEXA'));
  console.log('  ✔ safe system command executes and captures stdout');
  passed++;

  // 5. System tool refuses blocked commands
  const blockedRes = await systemTool.execute({ command: 'rm -rf /' });
  assert.strictEqual(blockedRes.success, false);
  assert.ok(blockedRes.userMessage.includes('blocked for safety'));
  console.log('  ✔ system tool refuses blocked commands safely');
  passed++;

  return { passed, failed: 0 };
}
