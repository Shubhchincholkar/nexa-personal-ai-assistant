/**
 * NEXA Tool - SMS & Messaging
 * Sends SMS messages through Android Termux:API. Marked SENSITIVE and strictly requires user confirmation.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { searchContactsList } from './contacts.js';
import { successResult, failureResult } from '../core/errors.js';

export const smsTool = {
  name: 'send_sms',
  description: 'Sends an SMS text message to a contact or phone number. Requires confirmation before dispatching.',
  riskLevel: RISK_LEVELS.SENSITIVE,
  parameters: {
    type: 'OBJECT',
    properties: {
      contactName: {
        type: 'STRING',
        description: 'Name of the contact or recipient.',
      },
      message: {
        type: 'STRING',
        description: 'The body of the text message to send.',
      },
      confirmed: {
        type: 'BOOLEAN',
        description: 'True if user has explicitly reviewed and confirmed sending.',
      },
      phoneNumber: {
        type: 'STRING',
        description: 'Direct phone number if known.',
      },
    },
    required: ['contactName', 'message'],
  },
  execute: async (args = {}, context = {}) => {
    const { contactName, message, confirmed, phoneNumber } = args;

    if (!message || !message.trim()) {
      return failureResult('Message body cannot be empty.', 'What message would you like to send?');
    }

    if (confirmed && phoneNumber) {
      const res = await termuxService.sendSms(phoneNumber, message, contactName || phoneNumber);
      return successResult(res, `SMS sent to ${contactName || phoneNumber}.`);
    }

    // Lookup contact
    const contactsRes = await termuxService.getContacts();
    const contacts = contactsRes.contacts || [];
    const matches = searchContactsList(contacts, contactName);

    if (matches.length === 0) {
      return failureResult(
        'Contact not found',
        `I couldn't find "${contactName}" in your contacts. Please provide a phone number.`
      );
    }

    if (matches.length > 1) {
      return {
        success: true,
        needsSelection: true,
        prompt: `Multiple contacts found for "${contactName}":\n` +
          matches.map((m, i) => `${i + 1}. ${m.name}`).join('\n') +
          `\nWhich one should I text?`,
        options: matches.map((m, i) => ({
          label: m.name,
          number: m.number,
          index: i + 1,
        })),
        pendingMessage: message,
      };
    }

    const target = matches[0];

    if (confirmed) {
      const res = await termuxService.sendSms(target.number, message, target.name);
      return successResult(res, `SMS sent to ${target.name}.`);
    }

    return {
      success: true,
      needsConfirmation: true,
      prompt: `Send this message to ${target.name}?\n\n"${message}"\n\nConfirm?`,
      targetContact: target,
      message,
    };
  },
};
