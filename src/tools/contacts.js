/**
 * NEXA Tool - Contacts Search
 * Searches device contacts case-insensitively with partial matching support.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

export function searchContactsList(contacts, query) {
  if (!query) return [];
  const cleanQuery = query.toLowerCase().trim();

  // 1. Exact name match
  const exact = contacts.filter((c) => (c.name || '').toLowerCase() === cleanQuery);
  if (exact.length > 0) return exact;

  // 2. Starts-with match
  const startsWith = contacts.filter((c) => (c.name || '').toLowerCase().startsWith(cleanQuery));
  if (startsWith.length > 0) return startsWith;

  // 3. Partial substring match
  return contacts.filter((c) => (c.name || '').toLowerCase().includes(cleanQuery));
}

export const contactsTool = {
  name: 'search_contacts',
  description: 'Searches contacts on the device by name or partial name (e.g. "Rahul", "Mom").',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      name: {
        type: 'STRING',
        description: 'Name or partial name of contact to search for.',
      },
    },
    required: ['name'],
  },
  execute: async (args = {}) => {
    const query = args.name;
    if (!query) {
      return failureResult('Contact name query is required.', 'Who would you like to search for?');
    }

    const res = await termuxService.getContacts();
    if (!res.success) {
      return failureResult(res.error, 'Could not access contacts list.');
    }

    const matches = searchContactsList(res.contacts, query);

    if (matches.length === 0) {
      return successResult(
        { matches: [], query },
        `I couldn't find any contact matching "${query}".`
      );
    }

    return successResult(
      {
        query,
        count: matches.length,
        matches,
      },
      `Found ${matches.length} matching contact(s).`
    );
  },
};
