/**
 * NEXA - Termux:API Service
 * Interacts directly with Termux:API tools and commands.
 * Provides fallback mock data when running in simulator/Linux environments.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/environment.js';

const execAsync = promisify(exec);

export class TermuxService {
  constructor() {
    this._hasTermuxApiCache = null;
    this._mockStateFile = path.join(env.dataDir, 'termux-sim-state.json');
    this.mockState = this._loadMockState();
  }

  _loadMockState() {
    try {
      if (fs.existsSync(this._mockStateFile)) {
        return JSON.parse(fs.readFileSync(this._mockStateFile, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
    return {
      battery: { percentage: 84, status: 'DISCHARGING', plugged: 'UNPLUGGED', health: 'GOOD', temperature: 29.4 },
      clipboard: 'https://github.com/google-gemini',
      contacts: [
        { name: 'Rahul Sharma', number: '+91 98765 43210' },
        { name: 'Rahul Patil', number: '+91 91234 56789' },
        { name: 'Rahul Verma', number: '+91 99887 76655' },
        { name: 'Priya Singh', number: '+91 98111 22233' },
        { name: 'Ananya Gupta', number: '+91 98333 44455' },
        { name: 'Mom', number: '+91 98000 11122' },
        { name: 'Dad', number: '+91 98000 33344' },
      ],
      notifications: [
        { id: 1, title: 'Calendar', content: 'Meeting with Dev team at 4:00 PM', when: Date.now() - 3600000 },
        { id: 2, title: 'Messages', content: 'Rahul: Let me know when you are free', when: Date.now() - 1800000 },
      ],
      callsMade: [],
      smsSent: [],
    };
  }

  _saveMockState() {
    try {
      fs.writeFileSync(this._mockStateFile, JSON.stringify(this.mockState, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
  }

  /**
   * Probes if Termux:API is available on the system
   */
  async isTermuxApiAvailable() {
    if (this._hasTermuxApiCache !== null) return this._hasTermuxApiCache;
    try {
      const { stdout } = await execAsync('which termux-battery-status 2>/dev/null || true', { timeout: 1500 });
      this._hasTermuxApiCache = stdout.trim().length > 0;
    } catch {
      this._hasTermuxApiCache = false;
    }
    return this._hasTermuxApiCache;
  }

  /**
   * Get battery status
   */
  async getBatteryStatus() {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const { stdout } = await execAsync('termux-battery-status', { timeout: 4000 });
        const data = JSON.parse(stdout);
        return {
          success: true,
          data: {
            percentage: data.percentage,
            status: data.status,
            plugged: data.plugged,
            health: data.health,
            temperature: data.temperature,
          },
          source: 'termux:api',
        };
      } catch (err) {
        if (env.isDebug) console.warn('[TermuxService] battery error:', err.message);
      }
    }

    // Return device state / simulation
    return {
      success: true,
      data: this.mockState.battery,
      source: isAvailable ? 'termux:api' : 'simulated (device fallback)',
    };
  }

  /**
   * Get contacts list
   */
  async getContacts() {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const { stdout } = await execAsync('termux-contact-list', { timeout: 5000 });
        const list = JSON.parse(stdout);
        const mapped = list.map((c) => ({
          name: c.name || 'Unnamed',
          number: c.number || (c.phones && c.phones[0]) || '',
        }));
        return {
          success: true,
          contacts: mapped,
          source: 'termux:api',
        };
      } catch (err) {
        if (env.isDebug) console.warn('[TermuxService] contact-list error:', err.message);
      }
    }

    return {
      success: true,
      contacts: this.mockState.contacts,
      source: isAvailable ? 'termux:api' : 'simulated (device fallback)',
    };
  }

  /**
   * Make a phone call
   */
  async callNumber(phoneNumber, contactName = '') {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        await execAsync(`termux-telephony-call "${phoneNumber.replace(/[^\d+]/g, '')}"`, { timeout: 5000 });
        return {
          success: true,
          message: `Calling ${contactName || phoneNumber}...`,
          source: 'termux:api',
        };
      } catch (err) {
        return {
          success: false,
          error: err.message,
          userMessage: `Could not place call: ${err.message}. Make sure Termux:API has CALL_PHONE permission.`,
        };
      }
    }

    // Simulator / desktop tracking
    this.mockState.callsMade.push({
      number: phoneNumber,
      name: contactName,
      time: new Date().toISOString(),
    });
    this._saveMockState();

    return {
      success: true,
      message: `[Simulated Call] Calling ${contactName || phoneNumber} (${phoneNumber}).`,
      source: 'simulated (device fallback)',
    };
  }

  /**
   * Send SMS
   */
  async sendSms(phoneNumber, text, contactName = '') {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        const escapedText = text.replace(/"/g, '\\"');
        await execAsync(`termux-sms-send -n "${cleanNumber}" "${escapedText}"`, { timeout: 5000 });
        return {
          success: true,
          message: `SMS sent to ${contactName || phoneNumber}.`,
          source: 'termux:api',
        };
      } catch (err) {
        return {
          success: false,
          error: err.message,
          userMessage: `Could not send SMS: ${err.message}. Make sure Termux:API has SEND_SMS permission.`,
        };
      }
    }

    this.mockState.smsSent.push({
      number: phoneNumber,
      name: contactName,
      text,
      time: new Date().toISOString(),
    });
    this._saveMockState();

    return {
      success: true,
      message: `[Simulated SMS] Sent to ${contactName || phoneNumber}: "${text}"`,
      source: 'simulated (device fallback)',
    };
  }

  /**
   * Get clipboard
   */
  async getClipboard() {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const { stdout } = await execAsync('termux-clipboard-get', { timeout: 3000 });
        return { success: true, text: stdout.trim() };
      } catch (err) {
        // ignore
      }
    }
    return { success: true, text: this.mockState.clipboard };
  }

  /**
   * Set clipboard
   */
  async setClipboard(text) {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const escaped = text.replace(/"/g, '\\"');
        await execAsync(`termux-clipboard-set "${escaped}"`, { timeout: 3000 });
        return { success: true, message: 'Copied to clipboard.' };
      } catch (err) {
        // ignore
      }
    }
    this.mockState.clipboard = text;
    this._saveMockState();
    return { success: true, message: 'Copied to clipboard.' };
  }

  /**
   * Show notification or toast
   */
  async showNotification(title, content) {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        await execAsync(`termux-notification -t "${title.replace(/"/g, '\\"')}" -c "${content.replace(/"/g, '\\"')}"`, { timeout: 3000 });
      } catch (e) {
        // try toast
        try {
          await execAsync(`termux-toast "${title}: ${content}"`, { timeout: 2000 });
        } catch {}
      }
    }
    this.mockState.notifications.unshift({
      id: Date.now(),
      title,
      content,
      when: Date.now(),
    });
    this._saveMockState();
    return { success: true, title, content };
  }

  /**
   * Text to speech
   */
  async ttsSpeak(text) {
    const isAvailable = await this.isTermuxApiAvailable();
    if (isAvailable) {
      try {
        const escaped = text.replace(/"/g, '\\"');
        await execAsync(`termux-tts-speak "${escaped}"`, { timeout: 10000 });
        return { success: true, message: 'Spoken aloud via Termux:TTS.' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true, message: `[TTS Simulated] "${text}"` };
  }
}

export const termuxService = new TermuxService();
