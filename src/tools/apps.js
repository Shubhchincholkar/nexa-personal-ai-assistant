/**
 * NEXA Tool - App Launcher
 * Launches Android applications using Termux intents and platform openers.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { androidIntents } from '../services/android/intents.js';
import { successResult, failureResult } from '../core/errors.js';

export const appsTool = {
  name: 'open_app',
  description: 'Opens or launches an application on the Android device or system, such as WhatsApp, YouTube, Chrome, Settings, Spotify, Maps, etc.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      appName: {
        type: 'STRING',
        description: 'Name of the app to open (e.g., "WhatsApp", "YouTube", "Chrome", "Camera", "Settings")',
      },
    },
    required: ['appName'],
  },
  execute: async (args = {}) => {
    const appName = args.appName;
    if (!appName) {
      return failureResult('App name is required.', 'Which app would you like me to open?');
    }

    const res = await androidIntents.launchApp(appName);
    if (res.success) {
      return successResult(res, res.message || `Opening ${res.appName || appName}.`);
    }

    return failureResult(res.error || 'App not found', res.userMessage);
  },
};
