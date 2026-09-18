import assert from 'assert';
import { timeTool } from '../src/tools/time.js';

export default async function run() {
  console.log('▶ Testing: Time Tool...');
  let passed = 0;

  // 1. Returns current system time without throwing
  const res = await timeTool.execute();
  assert.strictEqual(res.success, true);
  assert.ok(res.data.time);
  assert.ok(res.data.timestamp > 0);
  assert.ok(typeof res.message === 'string');
  console.log('  ✔ returns formatted system time');
  passed++;

  // 2. Supports custom timezone
  const tzRes = await timeTool.execute({ timezone: 'UTC' });
  assert.strictEqual(tzRes.success, true);
  assert.strictEqual(tzRes.data.timezone, 'UTC');
  console.log('  ✔ formats custom timezone accurately');
  passed++;

  return { passed, failed: 0 };
}
