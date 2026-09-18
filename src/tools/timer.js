/**
 * NEXA Tool - Timers
 * Sets countdown timers for seconds, minutes, and hours with alerts/notifications.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

// In-memory registry of active timers
export const activeTimers = new Map();

/**
 * Parses duration from strings like "30 seconds", "5 minutes", "2 hours", "90s"
 */
export function parseDurationToSeconds(input) {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return 0;

  const text = input.toLowerCase().trim();

  let totalSeconds = 0;

  // Hours
  const hMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hMatch) totalSeconds += parseFloat(hMatch[1]) * 3600;

  // Minutes
  const mMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);
  if (mMatch) totalSeconds += parseFloat(mMatch[1]) * 60;

  // Seconds
  const sMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  if (sMatch) totalSeconds += parseFloat(sMatch[1]);

  // Plain number fallback
  if (totalSeconds === 0) {
    const rawNum = parseFloat(text);
    if (!isNaN(rawNum)) {
      // Default to minutes if > 0 and no unit specified, unless very small
      totalSeconds = rawNum > 60 ? rawNum : rawNum * 60;
    }
  }

  return Math.round(totalSeconds);
}

export function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (mins < 60) {
    return remSec > 0 ? `${mins} min ${remSec} sec` : `${mins} minute${mins === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours} hr ${remMins} min` : `${hours} hour${hours === 1 ? '' : 's'}`;
}

export const timerTool = {
  name: 'set_timer',
  description: 'Sets a countdown timer for a specified duration in seconds, minutes, or hours (e.g., "30 seconds", "5 minutes", "2 hours").',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      duration: {
        type: 'STRING',
        description: 'Duration string, e.g. "30 seconds", "5 minutes", "2 hours", "10m"',
      },
      label: {
        type: 'STRING',
        description: 'Optional label or purpose of timer (e.g. "Boil eggs", "Study break")',
      },
    },
    required: ['duration'],
  },
  execute: async (args = {}) => {
    const durationInput = args.duration;
    const label = args.label || 'Timer';
    const totalSeconds = parseDurationToSeconds(durationInput);

    if (totalSeconds <= 0) {
      return failureResult(
        'Invalid duration',
        'Please specify a valid duration, for example: "30 seconds", "5 minutes", or "2 hours".'
      );
    }

    const timerId = `timer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const formattedDuration = formatSeconds(totalSeconds);
    const endsAt = Date.now() + totalSeconds * 1000;

    const timeoutHandle = setTimeout(async () => {
      activeTimers.delete(timerId);
      // Trigger notification and alert
      await termuxService.showNotification('⏰ Timer Finished!', `${label} (${formattedDuration}) is up!`);
      await termuxService.ttsSpeak(`${label} for ${formattedDuration} is done!`);
    }, totalSeconds * 1000);

    // Prevent Node process from hanging indefinitely on tests if unref requested
    if (timeoutHandle.unref) {
      timeoutHandle.unref();
    }

    activeTimers.set(timerId, {
      id: timerId,
      label,
      durationSeconds: totalSeconds,
      formattedDuration,
      startedAt: Date.now(),
      endsAt,
      handle: timeoutHandle,
    });

    return successResult(
      {
        timerId,
        label,
        durationSeconds: totalSeconds,
        formattedDuration,
        endsAt: new Date(endsAt).toLocaleTimeString(),
      },
      `Timer set for ${formattedDuration}${label !== 'Timer' ? ` (${label})` : ''}.`
    );
  },
};

export const listTimersTool = {
  name: 'list_timers',
  description: 'Lists all currently running countdown timers.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {},
  },
  execute: async () => {
    const list = Array.from(activeTimers.values()).map((t) => {
      const remainingMs = Math.max(0, t.endsAt - Date.now());
      return {
        id: t.id,
        label: t.label,
        remaining: formatSeconds(Math.ceil(remainingMs / 1000)),
      };
    });

    if (list.length === 0) {
      return successResult({ timers: [] }, 'No active timers right now.');
    }

    const summary = list.map((t) => `• ${t.label}: ${t.remaining} left`).join('\n');
    return successResult({ timers: list }, `Active Timers:\n${summary}`);
  },
};
