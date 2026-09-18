/**
 * NEXA Tool - Controlled System Commands
 * Strict allowlisting, destructive pattern blocking, and mandatory confirmation for sensitive commands.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { RISK_LEVELS } from '../config/constants.js';
import { permissionManager } from '../core/permissions.js';
import { successResult, failureResult } from '../core/errors.js';

const execAsync = promisify(exec);

export const systemTool = {
  name: 'run_system_command',
  description: 'Runs controlled, safe terminal commands on Android / Linux (e.g. "pwd", "date", "whoami", "uname", "uptime", "free"). Unsafe or destructive commands are strictly blocked.',
  riskLevel: RISK_LEVELS.DANGEROUS,
  parameters: {
    type: 'OBJECT',
    properties: {
      command: {
        type: 'STRING',
        description: 'The terminal command to execute.',
      },
      confirmed: {
        type: 'BOOLEAN',
        description: 'True if user explicitly approved executing this command.',
      },
    },
    required: ['command'],
  },
  execute: async (args = {}) => {
    const { command, confirmed } = args;
    if (!command || !command.trim()) {
      return failureResult('Empty command', 'Please specify a command.');
    }

    const evaluation = permissionManager.evaluateShellCommand(command);

    if (!evaluation.allowed) {
      return failureResult(
        'Blocked command',
        `Command blocked for safety: ${evaluation.reason}`
      );
    }

    if (evaluation.requiresConfirmation && !confirmed) {
      return {
        success: true,
        needsConfirmation: true,
        prompt: `Execute shell command: "${command}"?`,
        command,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      });

      const output = (stdout || stderr || '(No output)').trim();
      return successResult({ command, output }, output);
    } catch (err) {
      return failureResult(err.message, `Command failed: ${err.message}`);
    }
  },
};
