/**
 * NEXA Tool - Battery Status
 * Reads device battery information from Termux:API or platform adapter.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { termuxService } from '../services/android/termux.js';
import { successResult } from '../core/errors.js';

export const batteryTool = {
  name: 'get_battery_status',
  description: 'Gets current battery percentage, charging state, health, and temperature from Android or system.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {},
  },
  execute: async () => {
    const res = await termuxService.getBatteryStatus();
    const { percentage, status, plugged, temperature } = res.data;

    const message = `Battery is at ${percentage}% (${status.toLowerCase()}, ${plugged.toLowerCase()})${
      temperature ? `, temp: ${temperature}°C` : ''
    }.`;

    return successResult(
      {
        percentage,
        status,
        plugged,
        temperature,
        source: res.source,
      },
      message
    );
  },
};
