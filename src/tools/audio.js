/**
 * NEXA Tool - Audio & Speech
 * Text-to-speech reading and microphone recording via Termux:API.
 */
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RISK_LEVELS } from '../config/constants.js';
import { env } from '../config/environment.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

const execAsync = promisify(exec);

export const audioTool = {
  name: 'audio_control',
  description: 'Handles audio capabilities: read text aloud via Text-To-Speech (TTS) or record audio from microphone.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['speak', 'record'],
        description: '"speak" to read text aloud with TTS, "record" to record audio.',
      },
      text: {
        type: 'STRING',
        description: 'Text to speak aloud (required for "speak").',
      },
      durationSeconds: {
        type: 'INTEGER',
        description: 'Seconds to record audio (for "record"). Defaults to 10.',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, text, durationSeconds = 10 } = args;

    if (action === 'speak') {
      if (!text) return failureResult('Missing text', 'What would you like me to read aloud?');
      const res = await termuxService.ttsSpeak(text);
      return successResult({ spoken: text }, `Speaking: "${text}"`);
    }

    if (action === 'record') {
      const isAvailable = await termuxService.isTermuxApiAvailable();
      const filename = `recording_${Date.now()}.mp3`;
      const outputPath = path.join(env.dataDir, filename);

      if (isAvailable) {
        try {
          await execAsync(`termux-microphone-record -d -l ${durationSeconds} -f "${outputPath}"`, {
            timeout: (durationSeconds + 5) * 1000,
          });
          return successResult(
            { path: outputPath, durationSeconds },
            `Recorded ${durationSeconds} seconds of audio: saved to ${outputPath}.`
          );
        } catch (err) {
          return failureResult(
            err.message,
            `Microphone error: ${err.message}. Please grant RECORD_AUDIO permission to Termux:API.`
          );
        }
      }

      return successResult(
        { path: outputPath, simulated: true, durationSeconds },
        `[Device Simulator] Recorded ${durationSeconds}s audio to ${outputPath}.`
      );
    }

    return failureResult('Invalid action', 'Audio action must be "speak" or "record".');
  },
};
