/**
 * NEXA Tool - Real-Time Web Search
 * Retrieves fresh web information and search results.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { webSearchService } from '../services/web/search.js';
import { successResult, failureResult } from '../core/errors.js';

export const webSearchTool = {
  name: 'web_search',
  description: 'Searches the web in real-time for recent information, latest news, software versions, or documentation.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      query: {
        type: 'STRING',
        description: 'The search query to look up on the web.',
      },
    },
    required: ['query'],
  },
  execute: async (args = {}) => {
    const query = args.query;
    if (!query) {
      return failureResult('Missing query', 'What would you like me to search for on the web?');
    }

    const res = await webSearchService.search(query, 5);
    if (!res.success) {
      return failureResult(res.error, res.userMessage || 'Could not fetch web search results.');
    }

    const formatted = res.results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}${r.link ? `\n   Source: ${r.link}` : ''}`)
      .join('\n\n');

    return successResult(
      {
        query: res.query,
        provider: res.provider,
        results: res.results,
      },
      `Web Search Results for "${query}":\n\n${formatted}`
    );
  },
};
