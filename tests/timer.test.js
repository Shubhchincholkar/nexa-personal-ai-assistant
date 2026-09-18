import assert from 'assert';
import { parseDurationToSeconds, formatSeconds, timerTool, listTimersTool } from '../src/tools/timer.js';

export default async function run() {
  console.log('▶ Testing: Timer Tool...');
  let passed = 0;

  // 1. Duration parsing
  assert.strictEqual(parseDurationToSeconds('30 seconds'), 30);
  assert.strictEqual(parseDurationToSeconds('5 minutes'), 300);
  assert.strictEqual(parseDurationToSeconds('2 hours'), 7200);
  assert.strictEqual(parseDurationToSeconds('10m'), 600);
  console.log('  ✔ parsed seconds, minutes, and hours durations accurately');
  passed++;

  // 2. Format seconds
  assert.strictEqual(formatSeconds(30), '30 seconds');
  assert.strictEqual(formatSeconds(300), '5 minutes');
  console.log('  ✔ formatted human-readable durations');
  passed++;

  // 3. Set timer execution
  const res = await timerTool.execute({ duration: '10 seconds', label: 'Test Timer' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.durationSeconds, 10);
  console.log('  ✔ set_timer returned structured output and scheduled handle');
  passed++;

  // 4. List timers execution
  const listRes = await listTimersTool.execute();
  assert.strictEqual(listRes.success, true);
  assert.ok(listRes.data.timers.length >= 1);
  console.log('  ✔ list_timers lists active countdowns');
  passed++;

  return { passed, failed: 0 };
}
