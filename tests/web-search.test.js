import assert from 'assert';
import { webSearchTool } from '../src/tools/web-search.js';
import { webSearchService } from '../src/services/web/search.js';

export default async function run() {
  console.log('▶ Testing: Web Search Abstraction...');
  let passed = 0;

  // 1. Tool execution executes safely and returns results
  const res = await webSearchTool.execute({ query: 'Node.js documentation' });
  assert.strictEqual(res.success, true);
  assert.ok(res.data.results.length >= 1);
  assert.ok(typeof res.data.provider === 'string');
  console.log('  ✔ web search abstraction returns results cleanly');
  passed++;

  // 2. Empty query handling
  const emptyRes = await webSearchTool.execute({ query: '' });
  assert.strictEqual(emptyRes.success, false);
  console.log('  ✔ empty query handled safely');
  passed++;

  return { passed, failed: 0 };
}
