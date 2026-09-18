/**
 * NEXA - Central Tool Registry
 * Extensible catalog of tools with schema validation, permission checks, and execution wrappers.
 */
import { permissionManager } from '../core/permissions.js';
import { RISK_LEVELS } from '../config/constants.js';

import { timeTool } from './time.js';
import { calculatorTool } from './calculator.js';
import { batteryTool } from './battery.js';
import { appsTool } from './apps.js';
import { contactsTool } from './contacts.js';
import { callsTool } from './calls.js';
import { smsTool } from './sms.js';
import { timerTool, listTimersTool } from './timer.js';
import { remindersTool } from './reminders.js';
import { notesTool } from './notes.js';
import { clipboardTool } from './clipboard.js';
import { notificationsTool } from './notifications.js';
import { webSearchTool } from './web-search.js';
import { filesTool } from './files.js';
import { systemTool } from './system.js';
import { cameraTool } from './camera.js';
import { audioTool } from './audio.js';
import { imageGenerationTool } from './image-generation.js';
import { calendarTool } from './calendar.js';
import { gmailTool } from './gmail.js';

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    const defaults = [
      timeTool,
      calculatorTool,
      batteryTool,
      appsTool,
      contactsTool,
      callsTool,
      smsTool,
      timerTool,
      listTimersTool,
      remindersTool,
      notesTool,
      clipboardTool,
      notificationsTool,
      webSearchTool,
      filesTool,
      systemTool,
      cameraTool,
      audioTool,
      imageGenerationTool,
      calendarTool,
      gmailTool,
    ];

    for (const tool of defaults) {
      this.registerTool(tool);
    }
  }

  /**
   * Registers a tool into the registry
   * @param {Object} tool
   *   name: string
   *   description: string
   *   parameters: object (JSON Schema)
   *   riskLevel: 'SAFE' | 'SENSITIVE' | 'DANGEROUS'
   *   requiredPermissions?: string[]
   *   execute: (args: any, context?: any) => Promise<any>
   */
  registerTool(tool) {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool must have a valid string name.');
    }
    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error(`Tool '${tool.name}' must have an execute function.`);
    }

    const risk = tool.riskLevel || RISK_LEVELS.SAFE;
    permissionManager.setToolRisk(tool.name, risk);

    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || { type: 'OBJECT', properties: {} },
      riskLevel: risk,
      requiredPermissions: tool.requiredPermissions || [],
      execute: tool.execute,
    });
  }

  getTool(name) {
    return this.tools.get(name);
  }

  hasTool(name) {
    return this.tools.has(name);
  }

  listTools() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel,
      parameters: t.parameters,
      requiredPermissions: t.requiredPermissions,
    }));
  }

  /**
   * Generates tool declarations in Gemini function-calling format
   */
  getGeminiToolDeclarations() {
    const functionDeclarations = [];

    for (const tool of this.tools.values()) {
      functionDeclarations.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }

    return [{ functionDeclarations }];
  }

  /**
   * Safely executes a registered tool
   */
  async execute(name, args = {}, context = {}) {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' is not registered.`,
        userMessage: `I don't know how to run '${name}'.`,
      };
    }

    try {
      const result = await tool.execute(args, context);
      return result;
    } catch (err) {
      return {
        success: false,
        error: err.message,
        userMessage: `An error occurred while executing ${name}: ${err.message}`,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
