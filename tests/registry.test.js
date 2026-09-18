import assert from 'assert';
import { toolRegistry, ToolRegistry } from '../src/tools/registry.js';
import { RISK_LEVELS } from '../src/config/constants.js';

export default async function run() {
  console.log('▶ Testing: Tool Registry...');
  let passed = 0;

  // 1. All default tools registered
  const tools = toolRegistry.listTools();
  assert.ok(tools.length >= 15);
  assert.ok(toolRegistry.hasTool('get_current_time'));
  assert.ok(toolRegistry.hasTool('calculate'));
  assert.ok(toolRegistry.hasTool('open_app'));
  assert.ok(toolRegistry.hasTool('call_contact'));
  console.log(`  ✔ registered ${tools.length} built-in tools`);
  passed++;

  // 2. Custom tool registration
  const customRegistry = new ToolRegistry();
  customRegistry.registerTool({
    name: 'custom_echo',
    description: 'Echo test tool',
    riskLevel: RISK_LEVELS.SAFE,
    execute: async (args) => ({ success: true, echoed: args.text }),
  });
  assert.ok(customRegistry.hasTool('custom_echo'));
  const execRes = await customRegistry.execute('custom_echo', { text: 'hello' });
  assert.strictEqual(execRes.echoed, 'hello');
  console.log('  ✔ custom tools can be added and executed seamlessly');
  passed++;

  // 3. Gemini function declaration schemas
  const schemas = toolRegistry.getGeminiToolDeclarations();
  assert.ok(Array.isArray(schemas));
  assert.ok(schemas[0].functionDeclarations.length >= 15);
  console.log('  ✔ generates valid Gemini function-calling schemas');
  passed++;

  return { passed, failed: 0 };
}
