/**
 * NEXA - Environment Configuration
 * Centralized loader for environment variables with safe getters.
 * NEVER logs or prints secret keys.
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Attempt to load .env from current directory or home directory
dotenv.config();

// Also check ~/.nexa/.env if it exists
const homeEnvPath = path.join(os.homedir(), '.nexa', '.env');
if (fs.existsSync(homeEnvPath)) {
  dotenv.config({ path: homeEnvPath });
}

export const env = {
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY || '';
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID || '';
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },
  get webSearchApiKey() {
    return process.env.WEB_SEARCH_API_KEY || '';
  },
  get imageApiKey() {
    return process.env.IMAGE_API_KEY || '';
  },
  get isDebug() {
    return process.env.NEXA_DEBUG === 'true' || process.env.DEBUG === 'true';
  },
  get appUrl() {
    return process.env.APP_URL || 'http://localhost:3000';
  },
  get dataDir() {
    const dir = process.env.NEXA_DATA_DIR || path.join(os.homedir(), '.nexa');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        // Fallback to local .nexa in current working directory
        const fallback = path.join(process.cwd(), '.nexa-data');
        if (!fs.existsSync(fallback)) {
          fs.mkdirSync(fallback, { recursive: true });
        }
        return fallback;
      }
    }
    return dir;
  },

  /**
   * Safe status object suitable for printing / debugging without exposing secrets.
   */
  getSafeStatus() {
    return {
      geminiConfigured: Boolean(this.geminiApiKey),
      googleOAuthConfigured: Boolean(this.googleClientId && this.googleClientSecret),
      webSearchConfigured: Boolean(this.webSearchApiKey),
      imageApiConfigured: Boolean(this.imageApiKey),
      debugMode: this.isDebug,
      dataDirectory: this.dataDir,
      nodeVersion: process.version,
      platform: process.platform,
    };
  },
};
