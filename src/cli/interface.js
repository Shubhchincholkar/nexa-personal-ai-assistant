/**
 * NEXA - Terminal Readline Interface
 * Interactive CLI prompt loop with styled headers and graceful exit.
 */
import readline from 'readline';
import { agent } from '../core/agent.js';
import { slashCommands } from './commands.js';
import { colors } from './colors.js';
import { platformAdapter } from '../services/android/adapter.js';

export function printBanner() {
  const banner = `
========================================
             🤖 NEXA
      Personal AI Assistant
========================================
`;
  console.log(colors.cyan(colors.bold(banner)));
}

export async function startCli() {
  printBanner();

  const devInfo = await platformAdapter.getDeviceInfo();
  console.log(colors.muted(`[Platform: ${devInfo.platform} | Termux: ${devInfo.hasTermuxApi ? 'Active' : 'Simulated'}]`));
  console.log(colors.muted(`Type ${colors.cyan('/help')} for commands or ask anything. Type ${colors.cyan('/exit')} to quit.\n`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colors.bold(colors.blue('You: ')),
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = (line || '').trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === '/exit' || input === 'exit' || input === 'quit') {
      console.log(colors.cyan('\nGoodbye! Have a great day.\n'));
      rl.close();
      process.exit(0);
    }

    // Slash command handling
    if (input.startsWith('/')) {
      const handler = slashCommands[input];
      if (handler) {
        const out = await handler();
        console.log(out);
      } else {
        console.log(colors.yellow(`Unknown command: ${input}. Type /help for available commands.`));
      }
      console.log();
      rl.prompt();
      return;
    }

    // Process through NEXA agent
    try {
      const response = await agent.processInput(input);
      console.log();
      console.log(colors.bold(colors.cyan('NEXA:')));
      console.log(response.text);
      console.log();
    } catch (err) {
      console.log();
      console.log(colors.danger('NEXA Error:'), err.message);
      console.log();
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}
