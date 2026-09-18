import assert from 'assert';
import { router } from '../src/core/router.js';

export default async function run() {
  console.log('▶ Testing: Fast Intent Router...');
  let passed = 0;

  // 1. Time query
  const timeRoute = router.route('What time is it?');
  assert.strictEqual(timeRoute.toolName, 'get_current_time');
  assert.strictEqual(timeRoute.fastPath, true);
  console.log('  ✔ routes time queries immediately');
  passed++;

  // 2. Battery query
  const battRoute = router.route("What's my battery percentage?");
  assert.strictEqual(battRoute.toolName, 'get_battery_status');
  assert.strictEqual(battRoute.fastPath, true);
  console.log('  ✔ routes battery queries immediately');
  passed++;

  // 3. Calculator query
  const calcRoute = router.route('calculate 45 * 12');
  assert.strictEqual(calcRoute.toolName, 'calculate');
  assert.strictEqual(calcRoute.fastPath, true);
  console.log('  ✔ routes math expressions immediately');
  passed++;

  // 4. App launcher query
  const appRoute = router.route('Open WhatsApp');
  assert.strictEqual(appRoute.toolName, 'open_app');
  assert.strictEqual(appRoute.args.appName, 'WhatsApp');
  assert.strictEqual(appRoute.fastPath, true);
  console.log('  ✔ routes app launcher commands directly');
  passed++;

  // 5. Timer query
  const timerRoute = router.route('Set a timer for 10 minutes');
  assert.strictEqual(timerRoute.toolName, 'set_timer');
  assert.strictEqual(timerRoute.args.duration, '10 minutes');
  console.log('  ✔ routes timer commands directly');
  passed++;

  // 6. Conversational / AI query
  const aiRoute = router.route('Explain React hooks and give an example.');
  assert.strictEqual(aiRoute.type, 'AI_REASONING');
  console.log('  ✔ routes general knowledge queries to Gemini AI engine');
  passed++;

  return { passed, failed: 0 };
}
