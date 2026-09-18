/**
 * NEXA - Platform Adapter
 * Detects whether running on Android (Termux), Linux, macOS, or desktop simulation.
 * Ensures Android-specific commands are insulated behind clean adapter calls.
 */
import os from 'os';
import fs from 'fs';
import { PLATFORMS } from '../../config/constants.js';
import { termuxService } from './termux.js';

export class PlatformAdapter {
  constructor() {
    this._platformType = null;
  }

  getPlatformType() {
    if (this._platformType) return this._platformType;

    // Check Termux environment variables or standard paths
    const isTermuxEnv = Boolean(
      process.env.TERMUX_VERSION ||
      process.env.PREFIX?.includes('com.termux') ||
      fs.existsSync('/data/data/com.termux/files')
    );

    if (isTermuxEnv) {
      this._platformType = PLATFORMS.ANDROID_TERMUX;
    } else if (process.platform === 'linux') {
      this._platformType = PLATFORMS.LINUX;
    } else if (process.platform === 'darwin') {
      this._platformType = PLATFORMS.DARWIN;
    } else if (process.platform === 'win32') {
      this._platformType = PLATFORMS.WINDOWS;
    } else {
      this._platformType = PLATFORMS.UNKNOWN;
    }

    return this._platformType;
  }

  isAndroid() {
    return this.getPlatformType() === PLATFORMS.ANDROID_TERMUX;
  }

  isLinux() {
    return this.getPlatformType() === PLATFORMS.LINUX;
  }

  async getDeviceInfo() {
    const platform = this.getPlatformType();
    const hasTermuxApi = await termuxService.isTermuxApiAvailable();

    return {
      platform,
      isAndroidTermux: platform === PLATFORMS.ANDROID_TERMUX,
      isLinux: platform === PLATFORMS.LINUX,
      hasTermuxApi,
      hostname: os.hostname(),
      arch: os.arch(),
      osRelease: os.release(),
      uptimeHours: Math.round((os.uptime() / 3600) * 10) / 10,
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
    };
  }
}

export const platformAdapter = new PlatformAdapter();
