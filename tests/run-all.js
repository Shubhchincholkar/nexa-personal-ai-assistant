/**
 * NEXA - Test Runner
 * Zero-dependency unit test suite runner for Node.js
 */

const tests = [
  './time.test.js',
  './calculator.test.js',
  './registry.test.js',
  './contacts.test.js',
  './timer.test.js',
  './notes.test.js',
  './confirmations.test.js',
  './router.test.js',
  './agent.test.js',
  './web-search.test.js',
  './permissions.test.js',
  './gemini-resilience.test.js',
];

async function runSuite() {
  console.log('\n========================================');
  console.log('       🧪 Running NEXA Test Suite       ');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const testFile of tests) {
    try {
      const module = await import(testFile);
      if (typeof module.default === 'function') {
        const result = await module.default();
        if (result && result.failed > 0) {
          failed += result.failed;
          passed += result.passed;
        } else {
          passed += (result?.passed || 1);
        }
      }
    } catch (err) {
      console.error(`❌ Suite error in ${testFile}:`, err.message);
      failed++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n========================================');
  console.log(`Summary: ${passed} passed, ${failed} failed (${duration}s)`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
