/**
 * NEXA Tool - Local Notes System
 * Structured storage for user notes, quick memories, and task scratchpads.
 */
import fs from 'fs';
import path from 'path';
import { RISK_LEVELS } from '../config/constants.js';
import { env } from '../config/environment.js';
import { successResult, failureResult } from '../core/errors.js';

export class NotesManager {
  constructor() {
    this.filePath = path.join(env.dataDir, 'notes.json');
    this.notes = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.notes, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
  }

  setNote(title, content) {
    const key = title.trim().toLowerCase();
    const existing = this.notes[key];

    this.notes[key] = {
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    this.save();
    return this.notes[key];
  }

  getNote(title) {
    const key = title.trim().toLowerCase();
    if (this.notes[key]) return this.notes[key];

    // Partial search
    for (const [k, val] of Object.entries(this.notes)) {
      if (k.includes(key) || val.title.toLowerCase().includes(key)) {
        return val;
      }
    }
    return null;
  }

  listNotes() {
    return Object.values(this.notes);
  }

  deleteNote(title) {
    const key = title.trim().toLowerCase();
    if (this.notes[key]) {
      delete this.notes[key];
      this.save();
      return true;
    }
    for (const [k, val] of Object.entries(this.notes)) {
      if (k.includes(key) || val.title.toLowerCase().includes(key)) {
        delete this.notes[k];
        this.save();
        return true;
      }
    }
    return false;
  }
}

export const notesManager = new NotesManager();

export const notesTool = {
  name: 'manage_notes',
  description: 'Creates, reads, lists, or deletes local personal notes (e.g. "Create a note called college", "Remember that seminar is on Friday", "Show my college notes").',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['save', 'get', 'list', 'delete'],
        description: 'Action: "save" (create/update), "get" (read specific note), "list" (view all notes), or "delete".',
      },
      title: {
        type: 'STRING',
        description: 'Title or topic of the note (e.g. "college", "ideas", "groceries", "seminar")',
      },
      content: {
        type: 'STRING',
        description: 'Content of the note.',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, title, content } = args;

    if (action === 'save') {
      const noteTitle = title || 'Quick Note';
      const noteContent = content || title;
      if (!noteContent) {
        return failureResult('Missing content', 'What would you like me to write in the note?');
      }
      const note = notesManager.setNote(noteTitle, noteContent);
      return successResult(note, `Saved note "${note.title}".`);
    }

    if (action === 'get') {
      if (!title) return failureResult('Missing title', 'Which note would you like to see?');
      const note = notesManager.getNote(title);
      if (!note) {
        return failureResult('Note not found', `I couldn't find a note titled "${title}".`);
      }
      return successResult(note, `Note "${note.title}":\n${note.content}`);
    }

    if (action === 'list') {
      const list = notesManager.listNotes();
      if (list.length === 0) {
        return successResult({ notes: [] }, 'You have no saved notes yet.');
      }
      const summary = list.map((n) => `• ${n.title}: ${n.content.slice(0, 60)}${n.content.length > 60 ? '...' : ''}`).join('\n');
      return successResult({ notes: list }, `Your Notes:\n${summary}`);
    }

    if (action === 'delete') {
      if (!title) return failureResult('Missing title', 'Which note would you like to delete?');
      const ok = notesManager.deleteNote(title);
      if (ok) return successResult({ title }, `Deleted note "${title}".`);
      return failureResult('Not found', `Could not find note "${title}" to delete.`);
    }

    return failureResult('Invalid action', 'Supported actions are save, get, list, delete.');
  },
};
