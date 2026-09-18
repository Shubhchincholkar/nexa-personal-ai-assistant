/**
 * NEXA Tool - Notifications & Alerts
 * Sends notifications or alerts to the Android notification drawer or desktop.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

export const notificationsTool = {
  name: 'show_notification',
  description: 'Displays a notification or alert banner on the device.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      title: {
        type: 'STRING',
        description: 'Notification title (e.g. "NEXA Alert")',
      },
      content: {
        type: 'STRING',
        description: 'Notification body text.',
      },
    },
    required: ['content'],
  },
  execute: async (args = {}) => {
    const title = args.title || 'NEXA Assistant';
    const content = args.content;
    if (!content) {
      return failureResult('Missing content', 'What notification message should I show?');
    }

    await termuxService.showNotification(title, content);
    return successResult({ title, content }, `Notification sent: "${title} - ${content}"`);
  },
};
