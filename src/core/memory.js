/**
 * NEXA - Memory Abstraction
 * Supports short-term conversational context and optional persistent long-term memory.
 */
import fs from 'fs';
import path from 'path';
import { env } from '../config/environment.js';

export class Memory {
  constructor(options = {}) {
    this.maxHistory = options.maxHistory || 30;
    this.history = []; // Short-term session messages: Array<{ role: 'user'|'assistant'|'system', content: string, timestamp: number }>
    this.longTermFilePath = path.join(env.dataDir, 'memory.json');
    this.longTermMemories = this.loadLongTerm();
  }

  loadLongTerm() {
    try {
      if (fs.existsSync(this.longTermFilePath)) {
        const raw = fs.readFileSync(this.longTermFilePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      if (env.isDebug) console.warn('[Memory] Could not load long-term memory:', e.message);
    }
    return {};
  }

  saveLongTerm() {
    try {
      fs.writeFileSync(this.longTermFilePath, JSON.stringify(this.longTermMemories, null, 2), 'utf8');
    } catch (e) {
      if (env.isDebug) console.warn('[Memory] Could not save long-term memory:', e.message);
    }
  }

  /**
   * Add a turn to short-term conversation context
   */
  addMessage(role, content) {
    if (!content) return;
    this.history.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Enforce sliding window
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  /**
   * Long-term memory store (key-value pair)
   */
  setFact(key, value) {
    // Basic sanitization to prevent saving passwords or raw tokens
    if (/token|secret|password|bearer|api_?key/i.test(key)) {
      throw new Error('Sensitive credentials cannot be stored in persistent memory.');
    }
    this.longTermMemories[key.toLowerCase().trim()] = {
      value,
      updatedAt: new Date().toISOString(),
    };
    this.saveLongTerm();
    return true;
  }

  getFact(key) {
    const item = this.longTermMemories[key.toLowerCase().trim()];
    return item ? item.value : null;
  }

  listFacts() {
    return Object.entries(this.longTermMemories).map(([k, v]) => ({
      key: k,
      value: v.value,
      updatedAt: v.updatedAt,
    }));
  }

  deleteFact(key) {
    const k = key.toLowerCase().trim();
    if (this.longTermMemories[k]) {
      delete this.longTermMemories[k];
      this.saveLongTerm();
      return true;
    }
    return false;
  }

  clearLongTerm() {
    this.longTermMemories = {};
    this.saveLongTerm();
  }

  /**
   * Returns a context snippet of long-term memories for inclusion in prompts
   */
  getContextSummary() {
    const entries = Object.entries(this.longTermMemories);
    if (entries.length === 0) return '';
    return entries.map(([k, v]) => `- ${k}: ${JSON.stringify(v.value)}`).join('\n');
  }
}

export const memory = new Memory();
