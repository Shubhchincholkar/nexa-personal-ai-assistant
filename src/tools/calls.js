/**
 * NEXA Tool - Phone Calls
 * Places calls to contacts. Marked SENSITIVE and strictly requires user confirmation.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { searchContactsList } from './contacts.js';
import { successResult, failureResult } from '../core/errors.js';

export const callsTool = {
  name: 'call_contact',
  description: 'Initiates a phone call to a contact. Searches device contacts and requires user confirmation before placing the call.',
  riskLevel: RISK_LEVELS.SENSITIVE,
  parameters: {
    type: 'OBJECT',
    properties: {
      contactName: {
        type: 'STRING',
        description: 'Name of the person to call (e.g. "Rahul", "Priya", "Mom")',
      },
      confirmed: {
        type: 'BOOLEAN',
        description: 'True if user has explicitly confirmed placing this phone call.',
      },
      phoneNumber: {
        type: 'STRING',
        description: 'Direct phone number if known or selected.',
      },
    },
    required: ['contactName'],
  },
  execute: async (args = {}, context = {}) => {
    const { contactName, confirmed, phoneNumber } = args;

    if (!contactName && !phoneNumber) {
      return failureResult('Contact name or phone number is required.', 'Who would you like me to call?');
    }

    // If direct confirmed call with phone number
    if (confirmed && phoneNumber) {
      const callRes = await termuxService.callNumber(phoneNumber, contactName || phoneNumber);
      return successResult(callRes, `Calling ${contactName || phoneNumber}...`);
    }

    // Step 1: Look up contacts
    const contactsRes = await termuxService.getContacts();
    const contacts = contactsRes.contacts || [];
    const matches = searchContactsList(contacts, contactName);

    if (matches.length === 0) {
      return failureResult(
        'Contact not found',
        `I couldn't find "${contactName}" in your contacts. Make sure the name is saved in your phone.`
      );
    }

    // Multiple matches exist: require disambiguation
    if (matches.length > 1) {
      return {
        success: true,
        needsSelection: true,
        prompt: `I found ${matches.length} contacts matching "${contactName}":\n` +
          matches.map((m, i) => `${i + 1}. ${m.name}`).join('\n') +
          `\nWhich one?`,
        options: matches.map((m, i) => ({
          label: m.name,
          number: m.number,
          index: i + 1,
        })),
        contactName,
      };
    }

    // Single match found
    const target = matches[0];

    // If confirmed flag was passed by agent
    if (confirmed) {
      const callRes = await termuxService.callNumber(target.number, target.name);
      return successResult(callRes, `Calling ${target.name}...`);
    }

    // Needs single confirmation
    return {
      success: true,
      needsConfirmation: true,
      prompt: `Call ${target.name}?`,
      targetContact: target,
    };
  },
};
