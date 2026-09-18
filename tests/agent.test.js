import assert from 'assert';
import { agent } from '../src/core/agent.js';

export default async function run() {
  console.log('▶ Testing: NEXA Core Agent Loop...');
  let passed = 0;

  // 1. Time query via Agent loop
  const timeRes = await agent.processInput('What time is it?');
  assert.strictEqual(timeRes.success, true);
  assert.strictEqual(timeRes.toolUsed, 'get_current_time');
  assert.ok(timeRes.text.includes(':'));
  console.log('  ✔ agent processes time query and returns actual time');
  passed++;

  // 2. Battery query via Agent loop
  const battRes = await agent.processInput('What is my battery percentage?');
  assert.strictEqual(battRes.success, true);
  assert.strictEqual(battRes.toolUsed, 'get_battery_status');
  assert.ok(battRes.text.includes('%'));
  console.log('  ✔ agent processes battery query');
  passed++;

  // 3. App launching via Agent loop
  const appRes = await agent.processInput('Open WhatsApp');
  assert.strictEqual(appRes.success, true);
  assert.strictEqual(appRes.toolUsed, 'open_app');
  assert.ok(appRes.text.includes('WhatsApp'));
  console.log('  ✔ agent launches apps via intent');
  passed++;

  // 4. Disambiguation + Confirmation flow (Call Rahul)
  // Step 1: User says "Call Rahul"
  const callStep1 = await agent.processInput('Call Rahul');
  assert.ok(callStep1.text.includes('Which one'));
  assert.ok(agent.confirmationManager.hasPending());
  console.log('  ✔ step 1: disambiguation prompt generated for multiple matches');
  passed++;

  // Step 2: User says "2" (selects 2nd Rahul: Rahul Patil)
  const callStep2 = await agent.processInput('2');
  assert.ok(callStep2.text.includes('Call Rahul Patil?'));
  assert.ok(agent.confirmationManager.hasPending());
  console.log('  ✔ step 2: options selection resolved to confirmation prompt');
  passed++;

  // Step 3: User says "yes" to confirm
  const callStep3 = await agent.processInput('yes');
  assert.ok(callStep3.text.includes('Calling Rahul Patil'));
  assert.strictEqual(agent.confirmationManager.hasPending(), false);
  console.log('  ✔ step 3: confirmed call dispatches successfully');
  passed++;

  return { passed, failed: 0 };
}
