/**
 * NEXA Tool - Gmail
 * Summarizes recent important emails or searches mailbox via Google OAuth.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { gmailService } from '../services/google/gmail.js';
import { successResult, failureResult } from '../core/errors.js';

export const gmailTool = {
  name: 'gmail',
  description: 'Searches or lists recent important emails from Gmail to provide summaries.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      query: {
        type: 'STRING',
        description: 'Search query, e.g. "is:unread", "from:colleague", "important"',
      },
      maxResults: {
        type: 'INTEGER',
        description: 'Max emails to inspect (default 5).',
      },
    },
  },
  execute: async (args = {}) => {
    const { query = '', maxResults = 5 } = args;
    const res = await gmailService.listRecentMessages(query, maxResults);

    if (!res.success) {
      return failureResult(res.error, res.userMessage || 'Could not access Gmail.');
    }

    if (res.messages.length === 0) {
      return successResult({ messages: [] }, 'No matching emails found.');
    }

    const summary = res.messages
      .map((m, i) => `${i + 1}. From: ${m.from}\n   Subject: ${m.subject}\n   Snippet: ${m.snippet}`)
      .join('\n\n');

    return successResult(
      { count: res.messages.length, messages: res.messages },
      `Recent Gmail Messages:\n\n${summary}`
    );
  },
};
