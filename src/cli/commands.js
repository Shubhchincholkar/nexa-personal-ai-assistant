/**
 * NEXA - Built-in CLI Slash Commands
 * Handles /help, /tools, /status, /clear, /history, /memory, /exit
 */
import { toolRegistry } from '../tools/registry.js';
import { memory } from '../core/memory.js';
import { env } from '../config/environment.js';
import { platformAdapter } from '../services/android/adapter.js';
import { colors } from './colors.js';

export const slashCommands = {
  '/help': () => {
    return `
${colors.primary('🤖 NEXA - Commands & Usage')}

${colors.bold('Built-in Commands:')}
  ${colors.cyan('/help')}       - Show this help guide
  ${colors.cyan('/tools')}      - List all registered agent tools & safety levels
  ${colors.cyan('/status')}     - Inspect device, platform, and API configuration
  ${colors.cyan('/history')}    - View current conversation session history
  ${colors.cyan('/clear')}      - Clear current session conversation context
  ${colors.cyan('/memory')}     - View long-term stored facts & preferences
  ${colors.cyan('/exit')}       - Exit the assistant

${colors.bold('Example Prompts:')}
  • "What time is it?"
  • "What's my battery percentage?"
  • "Calculate 45 * 12 + sqrt(144)"
  • "Open WhatsApp"
  • "Call Rahul"
  • "Text Rahul that I'll reach in 10 minutes"
  • "Set a timer for 5 minutes"
  • "Remind me at 7 PM to study"
  • "Create a note called college"
  • "What is the latest React version?"
  • "Create a cyberpunk wallpaper"
`;
  },

  '/tools': () => {
    const list = toolRegistry.listTools();
    const formatted = list
      .map((t) => {
        let badge = colors.green('[SAFE]');
        if (t.riskLevel === 'SENSITIVE') badge = colors.yellow('[SENSITIVE]');
        if (t.riskLevel === 'DANGEROUS') badge = colors.danger('[DANGEROUS]');
        return `  ${badge} ${colors.bold(t.name.padEnd(22))} ${colors.muted(t.description.slice(0, 70))}`;
      })
      .join('\n');

    return `\n${colors.primary('Registered Tools (' + list.length + '):')}\n${formatted}\n`;
  },

  '/status': async () => {
    const safeEnv = env.getSafeStatus();
    const devInfo = await platformAdapter.getDeviceInfo();

    return `
${colors.primary('System & Environment Status:')}
  • Platform:          ${colors.bold(devInfo.platform)} (Android Termux: ${devInfo.isAndroidTermux ? colors.green('YES') : colors.yellow('NO')})
  • Termux:API:        ${devInfo.hasTermuxApi ? colors.green('Detected & Active') : colors.yellow('Simulated / Fallback')}
  • Gemini AI Engine:  ${safeEnv.geminiConfigured ? colors.green('Configured (gemini-3.8-flash)') : colors.yellow('Not Set (Offline Tool Mode)')}
  • Google OAuth:      ${safeEnv.googleOAuthConfigured ? colors.green('Configured') : colors.muted('Not configured')}
  • Web Search:        ${safeEnv.webSearchConfigured ? colors.green('API Configured') : colors.muted('DuckDuckGo Instant Fallback')}
  • Data Directory:    ${colors.cyan(safeEnv.dataDirectory)}
  • Node Version:      ${process.version}
`;
  },

  '/clear': () => {
    memory.clearHistory();
    return colors.success('Conversation history cleared.');
  },

  '/history': () => {
    const hist = memory.getHistory();
    if (hist.length === 0) return colors.muted('No conversation history yet.');

    return hist
      .map((m) => {
        const who = m.role === 'user' ? colors.bold(colors.blue('You:')) : colors.bold(colors.cyan('NEXA:'));
        return `${who} ${m.content}`;
      })
      .join('\n\n');
  },

  '/memory': () => {
    const facts = memory.listFacts();
    if (facts.length === 0) return colors.muted('No long-term memories saved yet.');
    const formatted = facts.map((f) => `• ${colors.bold(f.key)}: ${JSON.stringify(f.value)}`).join('\n');
    return `${colors.primary('Saved Long-Term Memories:')}\n${formatted}`;
  },
};
