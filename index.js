/**
 * NEXA - Personal AI Assistant
 * Main Entry Point for Android (Termux) and Linux
 */
import { startCli } from './src/cli/interface.js';
export { agent, NexaAgent } from './src/core/agent.js';
export { toolRegistry, ToolRegistry } from './src/tools/registry.js';
export { memory, Memory } from './src/core/memory.js';
export { permissionManager, PermissionManager } from './src/core/permissions.js';
export { confirmationManager, ConfirmationManager } from './src/core/confirmations.js';
export { geminiService, GeminiService } from './src/ai/gemini.js';
export { router, Router } from './src/core/router.js';
export { env } from './src/config/environment.js';

// Auto-start CLI when executed directly in terminal
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.js') ||
  process.argv[1].endsWith('nexa.js') ||
  process.argv[1].endsWith('nexa')
);

if (isDirectRun) {
  startCli();
}
