/**
 * NEXA Tool - Clipboard
 * Reads or writes text to the Android / system clipboard.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

export const clipboardTool = {
  name: 'clipboard',
  description: 'Reads from or writes text to the device clipboard.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['get', 'set'],
        description: '"get" to read clipboard, "set" to write text to clipboard.',
      },
      text: {
        type: 'STRING',
        description: 'Text to copy (required if action is "set").',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, text } = args;

    if (action === 'get') {
      const res = await termuxService.getClipboard();
      if (!res.text) {
        return successResult({ text: '' }, 'Clipboard is empty.');
      }
      return successResult({ text: res.text }, `Clipboard contains: "${res.text}"`);
    }

    if (action === 'set') {
      if (!text) {
        return failureResult('Missing text', 'What text should I copy to your clipboard?');
      }
      await termuxService.setClipboard(text);
      return successResult({ copied: text }, 'Copied to clipboard.');
    }

    return failureResult('Invalid action', 'Action must be "get" or "set".');
  },
};
