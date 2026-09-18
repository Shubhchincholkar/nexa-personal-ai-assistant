import assert from 'assert';
import { parseGeminiError, GeminiService, CANDIDATE_MODELS } from '../src/ai/gemini.js';
import { agent } from '../src/core/agent.js';

export default async function run() {
  console.log('▶ Testing: Gemini 503 Resilience & Model Fallback...');
  let passed = 0;

  // 1. Test parsing the exact user-reported 503 error payload
  const rawUserError = new Error(
    JSON.stringify({
      error: {
        code: 503,
        message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
        status: 'UNAVAILABLE',
      },
    })
  );

  const parsed503 = parseGeminiError(rawUserError);
  assert.strictEqual(parsed503.isTransient, true, 'Should classify 503 as transient');
  assert.strictEqual(parsed503.isUnavailable, true, 'Should flag as unavailable');
  assert.strictEqual(parsed503.code, 503);
  assert.ok(!parsed503.userFriendly.startsWith('{'), 'User message must not be raw JSON string');
  assert.ok(parsed503.userFriendly.includes('503'), 'User message should reference 503 high demand');
  console.log('  ✔ accurately identifies and parses 503 UNAVAILABLE error payload');
  passed++;

  // 2. Test parsing rate-limited error
  const rateLimitError = new Error('Resource has been exhausted (e.g. check quota) 429 RESOURCE_EXHAUSTED');
  const parsed429 = parseGeminiError(rateLimitError);
  assert.strictEqual(parsed429.isTransient, true);
  assert.strictEqual(parsed429.isRateLimited, true);
  console.log('  ✔ accurately identifies and parses 429 rate limit error');
  passed++;

  // 3. Test retry with backoff on transient 503
  const testService = new GeminiService();
  // Mock client
  testService._client = {};

  let attempts = 0;
  const retryResult = await testService.executeWithResilience(async (client, model) => {
    attempts++;
    if (attempts === 1) {
      throw rawUserError; // 503 on first try
    }
    return { text: 'Recovered after 503 spike!' };
  });

  assert.strictEqual(retryResult.success, true);
  assert.strictEqual(attempts, 2, 'Should have succeeded on retry attempt 2');
  assert.strictEqual(retryResult.response.text, 'Recovered after 503 spike!');
  console.log('  ✔ successfully retries and recovers from transient 503 spikes');
  passed++;

  // 4. Test failover across models when primary model is down
  const failoverService = new GeminiService();
  failoverService._client = {};
  const attemptedModels = [];

  const failoverResult = await failoverService.executeWithResilience(async (client, model) => {
    attemptedModels.push(model);
    if (model === CANDIDATE_MODELS[0]) {
      // Primary model gemini-3.8-flash completely down with 503
      throw rawUserError;
    }
    // Fallback model succeeds
    return { text: `Responded from ${model}` };
  });

  assert.strictEqual(failoverResult.success, true);
  assert.ok(attemptedModels.includes(CANDIDATE_MODELS[0]), 'Tried primary model first');
  assert.ok(attemptedModels.includes(CANDIDATE_MODELS[1]), 'Fell back to next model');
  assert.strictEqual(failoverResult.modelUsed, CANDIDATE_MODELS[1]);
  console.log('  ✔ automatically fails over to backup Flash models if primary model is 503 down');
  passed++;

  // 5. Test agent graceful fallback for greetings even when Gemini service is non-functional
  const originalGenerate = agent.geminiService.generateWithTools;
  try {
    // Force AI failure simulating persistent 503 outage
    agent.geminiService.generateWithTools = async () => ({
      success: false,
      error: '503 Service Unavailable',
      userMessage: parsed503.userFriendly,
    });

    const greetingRes = await agent.processInput('hi');
    assert.strictEqual(greetingRes.success, true);
    assert.ok(greetingRes.text.toLowerCase().includes('hello') || greetingRes.text.toLowerCase().includes('nexa'));
    console.log('  ✔ agent provides welcoming fallback response to greetings during AI demand spikes');
    passed++;

    const helpRes = await agent.processInput('what can you do');
    assert.strictEqual(helpRes.success, true);
    assert.ok(helpRes.text.includes('Device Status') || helpRes.text.includes('NEXA'));
    console.log('  ✔ agent provides capability guide during AI demand spikes');
    passed++;
  } finally {
    agent.geminiService.generateWithTools = originalGenerate;
  }

  return { passed, failed: 0 };
}
