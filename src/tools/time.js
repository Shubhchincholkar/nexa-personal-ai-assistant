/**
 * NEXA Tool - Time & Date
 * Uses real system / device clock. Never asks Gemini.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { successResult } from '../core/errors.js';

export const timeTool = {
  name: 'get_current_time',
  description: 'Returns the current real device/system time and date. Use whenever the user asks for the time, date, day of week, or current timestamp.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      timezone: {
        type: 'STRING',
        description: 'Optional IANA timezone name (e.g. "Asia/Kolkata", "America/New_York"). Defaults to device local timezone.',
      },
    },
  },
  execute: async (args = {}) => {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    if (args.timezone) {
      options.timeZone = args.timezone;
    }

    const formatted = new Intl.DateTimeFormat(undefined, options).format(now);
    const timeOnly = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: args.timezone,
    }).format(now);

    return successResult(
      {
        time: timeOnly,
        fullDateTime: formatted,
        iso: now.toISOString(),
        timestamp: now.getTime(),
        timezone: args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      `The current time is ${timeOnly} (${formatted}).`
    );
  },
};
