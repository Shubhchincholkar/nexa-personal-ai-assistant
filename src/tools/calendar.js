/**
 * NEXA Tool - Google Calendar
 * Create, list, and search Google Calendar events.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { googleCalendarService } from '../services/google/calendar.js';
import { successResult, failureResult } from '../core/errors.js';

export const calendarTool = {
  name: 'manage_calendar',
  description: 'Manages Google Calendar: list upcoming events or create a new calendar event with confirmation.',
  riskLevel: RISK_LEVELS.SENSITIVE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['list', 'create'],
        description: '"list" to view upcoming events, "create" to schedule a new event.',
      },
      summary: {
        type: 'STRING',
        description: 'Title of the event (for "create").',
      },
      startTime: {
        type: 'STRING',
        description: 'ISO 8601 start date-time string (e.g. "2026-09-19T17:00:00Z").',
      },
      endTime: {
        type: 'STRING',
        description: 'ISO 8601 end date-time string.',
      },
      confirmed: {
        type: 'BOOLEAN',
        description: 'True if user has confirmed scheduling this event.',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, summary, startTime, endTime, confirmed } = args;

    if (action === 'list') {
      const res = await googleCalendarService.listEvents(5);
      if (!res.success) {
        return failureResult(res.error, res.userMessage || 'Could not fetch Google Calendar events.');
      }
      if (res.events.length === 0) {
        return successResult({ events: [] }, 'No upcoming Google Calendar events found.');
      }
      const text = res.events
        .map((e) => `• ${e.summary} (${new Date(e.start).toLocaleString()})`)
        .join('\n');
      return successResult({ events: res.events }, `Upcoming Calendar Events:\n${text}`);
    }

    if (action === 'create') {
      if (!summary || !startTime) {
        return failureResult('Missing details', 'Please specify the event title and start time.');
      }

      if (!confirmed) {
        const displayTime = new Date(startTime).toLocaleString();
        return {
          success: true,
          needsConfirmation: true,
          prompt: `Create event "${summary}" for ${displayTime}?`,
          summary,
          startTime,
          endTime: endTime || new Date(new Date(startTime).getTime() + 3600000).toISOString(),
        };
      }

      const res = await googleCalendarService.createEvent({
        summary,
        startTime,
        endTime: endTime || new Date(new Date(startTime).getTime() + 3600000).toISOString(),
      });

      if (!res.success) {
        return failureResult(res.error, res.userMessage || 'Could not create event.');
      }

      return successResult(res.event, `Created event "${summary}".`);
    }

    return failureResult('Invalid action', 'Supported actions are list and create.');
  },
};
