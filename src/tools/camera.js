/**
 * NEXA Tool - Camera
 * Takes photos via Termux:API camera-photo.
 */
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RISK_LEVELS } from '../config/constants.js';
import { env } from '../config/environment.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

const execAsync = promisify(exec);

export const cameraTool = {
  name: 'take_photo',
  description: 'Takes a photo using the device camera via Termux:API and saves it locally.',
  riskLevel: RISK_LEVELS.SENSITIVE,
  parameters: {
    type: 'OBJECT',
    properties: {
      cameraId: {
        type: 'INTEGER',
        description: 'Camera ID (0 for rear, 1 for front/selfie). Defaults to 0.',
      },
    },
  },
  execute: async (args = {}) => {
    const isAvailable = await termuxService.isTermuxApiAvailable();
    const cameraId = args.cameraId || 0;
    const filename = `photo_${Date.now()}.jpg`;
    const outputPath = path.join(env.dataDir, filename);

    if (isAvailable) {
      try {
        await execAsync(`termux-camera-photo -c ${cameraId} "${outputPath}"`, { timeout: 10000 });
        return successResult(
          { path: outputPath, cameraId },
          `Photo captured and saved to ${outputPath}.`
        );
      } catch (err) {
        return failureResult(
          err.message,
          `Could not take photo: ${err.message}. Please verify Termux:API CAMERA permission is granted.`
        );
      }
    }

    return successResult(
      { path: outputPath, simulated: true },
      `[Device Simulator] Camera photo captured: saved to ${outputPath}. On real Android, ensure Termux:API is installed.`
    );
  },
};
