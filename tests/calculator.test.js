import assert from 'assert';
import { calculatorTool, evaluateMath } from '../src/tools/calculator.js';

export default async function run() {
  console.log('▶ Testing: Calculator Tool...');
  let passed = 0;

  // 1. Basic arithmetic
  assert.strictEqual(evaluateMath('45 * 12'), 540);
  assert.strictEqual(evaluateMath('100 / 4'), 25);
  console.log('  ✔ arithmetic evaluated correctly');
  passed++;

  // 2. Math functions (sqrt, powers)
  assert.strictEqual(evaluateMath('sqrt(144) + 10'), 22);
  assert.strictEqual(evaluateMath('2^3'), 8);
  console.log('  ✔ sqrt and exponents evaluated correctly');
  passed++;

  // 3. Percentages via tool execution
  const pctRes = await calculatorTool.execute({ expression: '20% of 150' });
  assert.strictEqual(pctRes.success, true);
  assert.strictEqual(pctRes.data.result, 30);
  console.log('  ✔ percentage calculations work');
  passed++;

  // 4. Invalid expressions fail safely
  const failRes = await calculatorTool.execute({ expression: 'process.exit()' });
  assert.strictEqual(failRes.success, false);
  console.log('  ✔ unsafe input is blocked safely');
  passed++;

  return { passed, failed: 0 };
}
