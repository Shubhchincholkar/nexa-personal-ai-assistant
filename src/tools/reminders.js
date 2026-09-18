/**
 * NEXA Tool - Reminders System
 * Stores reminders locally, schedules notifications via Termux, and supports listing/deletion.
 */
import fs from 'fs';
import path from 'path';
import { RISK_LEVELS } from '../config/constants.js';
import { env } from '../config/environment.js';
import { termuxService } from '../services/android/termux.js';
import { successResult, failureResult } from '../core/errors.js';

export class ReminderManager {
  constructor() {
    this.filePath = path.join(env.dataDir, 'reminders.json');
    this.reminders = this.load();
    this.activeTimeouts = new Map();
    this.rescheduleAll();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.reminders, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
  }

  rescheduleAll() {
    // Clear old handles
    for (const handle of this.activeTimeouts.values()) {
      clearTimeout(handle);
    }
    this.activeTimeouts.clear();

    const now = Date.now();
    for (const rem of this.reminders) {
      if (!rem.completed && rem.targetTime > now) {
        const delay = rem.targetTime - now;
        // Schedule if within 24 hours
        if (delay < 24 * 3600 * 1000) {
          const handle = setTimeout(() => {
            this.triggerReminder(rem.id);
          }, delay);
          if (handle.unref) handle.unref();
          this.activeTimeouts.set(rem.id, handle);
        }
      }
    }
  }

  async triggerReminder(id) {
    const rem = this.reminders.find((r) => r.id === id);
    if (!rem || rem.completed) return;

    rem.completed = true;
    this.save();

    await termuxService.showNotification('🔔 Reminder', rem.text);
    await termuxService.ttsSpeak(`Reminder: ${rem.text}`);
  }

  add(text, timeString) {
    let targetTime = Date.now() + 3600 * 1000; // default 1 hour from now

    if (timeString) {
      const parsed = Date.parse(timeString);
      if (!isNaN(parsed)) {
        targetTime = parsed;
      } else {
        // Simple relative matching
        const hoursMatch = timeString.match(/in\s+(\d+)\s*(?:hours?|hrs?|h)/i);
        const minsMatch = timeString.match(/in\s+(\d+)\s*(?:minutes?|mins?|m)/i);
        if (hoursMatch) {
          targetTime = Date.now() + parseInt(hoursMatch[1], 10) * 3600 * 1000;
        } else if (minsMatch) {
          targetTime = Date.now() + parseInt(minsMatch[1], 10) * 60 * 1000;
        }
      }
    }

    const reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      timeString: timeString || new Date(targetTime).toLocaleTimeString(),
      targetTime,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    this.reminders.push(reminder);
    this.save();
    this.rescheduleAll();
    return reminder;
  }

  list() {
    return this.reminders.filter((r) => !r.completed);
  }

  delete(idOrText) {
    const initialLen = this.reminders.length;
    this.reminders = this.reminders.filter(
      (r) => r.id !== idOrText && !r.text.toLowerCase().includes(idOrText.toLowerCase())
    );
    const deleted = this.reminders.length < initialLen;
    if (deleted) {
      this.save();
      this.rescheduleAll();
    }
    return deleted;
  }
}

export const reminderManager = new ReminderManager();

export const remindersTool = {
  name: 'manage_reminders',
  description: 'Creates, lists, or deletes local personal reminders.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['add', 'list', 'delete'],
        description: 'Action to perform: "add", "list", or "delete"',
      },
      text: {
        type: 'STRING',
        description: 'The reminder message or task (e.g. "submit assignment", "study for exam")',
      },
      time: {
        type: 'STRING',
        description: 'When to remind (e.g. "7 PM", "tomorrow at 10 AM", "in 30 minutes")',
      },
      reminderId: {
        type: 'STRING',
        description: 'ID or text of reminder to delete.',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, text, time, reminderId } = args;

    if (action === 'add') {
      if (!text) return failureResult('Missing text', 'What would you like me to remind you about?');
      const reminder = reminderManager.add(text, time);
      const timeDisplay = new Date(reminder.targetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return successResult(
        reminder,
        `Reminder set for ${time || timeDisplay}: "${text}".`
      );
    }

    if (action === 'list') {
      const list = reminderManager.list();
      if (list.length === 0) {
        return successResult({ reminders: [] }, 'You have no active reminders.');
      }
      const summary = list
        .map((r, i) => `${i + 1}. [${r.timeString}] ${r.text}`)
        .join('\n');
      return successResult({ reminders: list }, `Your Reminders:\n${summary}`);
    }

    if (action === 'delete') {
      const target = reminderId || text;
      if (!target) return failureResult('Missing ID', 'Which reminder should I remove?');
      const deleted = reminderManager.delete(target);
      if (deleted) {
        return successResult({ target }, `Removed reminder matching "${target}".`);
      }
      return failureResult('Not found', `Could not find a reminder matching "${target}".`);
    }

    return failureResult('Unknown action', 'Supported reminder actions are: add, list, delete.');
  },
};
