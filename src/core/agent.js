/**
 * NEXA - Core Agent Orchestrator
 * Glues Intent Routing, Memory, Gemini AI Reasoning, Tool Registry,
 * Permission Gates, and Confirmation Management into an intelligent loop.
 */
import { router } from './router.js';
import { memory } from './memory.js';
import { toolRegistry } from '../tools/registry.js';
import { permissionManager } from './permissions.js';
import { confirmationManager } from './confirmations.js';
import { geminiService } from '../ai/gemini.js';
import { env } from '../config/environment.js';

export class NexaAgent {
  constructor() {
    this.memory = memory;
    this.toolRegistry = toolRegistry;
    this.permissionManager = permissionManager;
    this.confirmationManager = confirmationManager;
    this.geminiService = geminiService;
    this.router = router;
  }

  /**
   * Main entry point for user requests
   * @param {string} input - User query or input
   * @param {Object} options - Optional flags
   * @returns {Promise<{ text: string, toolUsed?: string, pendingAction?: any, success: boolean }>}
   */
  async processInput(input, options = {}) {
    const rawInput = (input || '').trim();
    if (!rawInput) {
      return { text: 'How can I assist you?', success: true };
    }

    // 1. Check if there is an active confirmation or choice selection pending
    if (this.confirmationManager.hasPending()) {
      const confirmResult = await this.confirmationManager.handleUserInput(rawInput);
      if (confirmResult.handled) {
        if (confirmResult.cancelled) {
          this.memory.addMessage('user', rawInput);
          this.memory.addMessage('assistant', confirmResult.message);
          return { text: confirmResult.message, success: true };
        }
        if (confirmResult.retry) {
          return { text: confirmResult.message, success: true, pendingAction: this.confirmationManager.getPending() };
        }

        // Action was confirmed or option selected!
        const actionResult = confirmResult.actionResult;
        // If the action returned another confirmation step (e.g. selection -> confirmation)
        if (actionResult?.needsConfirmation) {
          this.confirmationManager.setPending({
            type: 'CONFIRM_ACTION',
            prompt: actionResult.prompt,
            onConfirm: async () => {
              if (actionResult.targetContact) {
                return await this.toolRegistry.execute('call_contact', {
                  contactName: actionResult.targetContact.name,
                  phoneNumber: actionResult.targetContact.number,
                  confirmed: true,
                });
              }
              return { success: true, message: 'Confirmed.' };
            },
          });

          this.memory.addMessage('user', rawInput);
          this.memory.addMessage('assistant', actionResult.prompt);
          return {
            text: actionResult.prompt,
            success: true,
            pendingAction: this.confirmationManager.getPending(),
          };
        }

        const reply = actionResult?.userMessage || actionResult?.message || 'Done.';
        this.memory.addMessage('user', rawInput);
        this.memory.addMessage('assistant', reply);
        return { text: reply, toolUsed: 'confirmation_flow', success: true };
      }
    }

    // 2. Add user input to conversation memory
    this.memory.addMessage('user', rawInput);

    // 3. Fast Intent Route check (instant response for time, battery, math, open app, direct actions)
    const routed = this.router.route(rawInput);
    if (routed && routed.fastPath) {
      const toolRes = await this.executeToolWithSafety(routed.toolName, routed.args);
      if (toolRes.needsConfirmation || toolRes.needsSelection) {
        const prompt = toolRes.prompt;
        this.memory.addMessage('assistant', prompt);
        return {
          text: prompt,
          toolUsed: routed.toolName,
          pendingAction: this.confirmationManager.getPending(),
          success: true,
        };
      }
      const responseText = toolRes.userMessage || toolRes.message || JSON.stringify(toolRes.data);
      this.memory.addMessage('assistant', responseText);
      return {
        text: responseText,
        toolUsed: routed.toolName,
        success: toolRes.success !== false,
      };
    }

    // 4. Send to Gemini AI with structured tool declarations
    const geminiTools = this.toolRegistry.getGeminiToolDeclarations();
    const history = this.memory.getHistory().slice(0, -1); // exclude current user message
    const longTermContext = this.memory.getContextSummary();

    const aiRes = await this.geminiService.generateWithTools({
      prompt: rawInput,
      history,
      tools: geminiTools,
      longTermContext,
    });

    if (!aiRes.success) {
      // 4a. If input is a conversational greeting, respond warmly even during AI outages
      if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo|sup|namaste)\b/i.test(rawInput)) {
        const greeting = `Hello! I am NEXA, your personal AI assistant. How can I help you today?

(Note: Upstream Gemini models are currently experiencing high traffic, but all local device tools—system time, battery, app launching, countdown timers, calculator, notes, and contacts—are active and ready!)`;
        this.memory.addMessage('assistant', greeting);
        return { text: greeting, success: true };
      }

      // 4b. If input is asking for help or available tools
      if (/^(help|what can you do|commands|\/help|\/tools)\b/i.test(rawInput)) {
        const helpText = `Here is what NEXA can do:
• Device Status: "What time is it?", "What is my battery level?"
• Quick Utilities: "Calculate 15% of 350", "Set a timer for 10 minutes"
• App Launching: "Open WhatsApp", "Start YouTube"
• Communication: "Call Rahul", "Send SMS"
• Notes & Memory: "Take note: buy groceries", "Show notes"
• System: Safe terminal commands, contacts search

Type any request or command to proceed!`;
        this.memory.addMessage('assistant', helpText);
        return { text: helpText, success: true };
      }

      // Fallback: If AI is not available (e.g. 503 or no GEMINI_API_KEY), try local heuristics or report error
      if (routed && routed.type === 'TOOL') {
        const fallbackRes = await this.executeToolWithSafety(routed.toolName, routed.args);
        if (fallbackRes.needsConfirmation || fallbackRes.needsSelection) {
          const prompt = fallbackRes.prompt;
          this.memory.addMessage('assistant', prompt);
          return {
            text: prompt,
            toolUsed: routed.toolName,
            pendingAction: this.confirmationManager.getPending(),
            success: true,
          };
        }
        const reply = fallbackRes.userMessage || fallbackRes.message || 'Action executed.';
        this.memory.addMessage('assistant', reply);
        return { text: reply, toolUsed: routed.toolName, success: true };
      }

      this.memory.addMessage('assistant', aiRes.userMessage);
      return { text: aiRes.userMessage, success: false };
    }

    // 5. If Gemini chose to call a tool
    if (aiRes.functionCalls && aiRes.functionCalls.length > 0) {
      const toolCall = aiRes.functionCalls[0];
      const toolName = toolCall.name;
      const toolArgs = toolCall.args || {};

      if (env.isDebug) {
        console.log(`[NEXA] AI selected tool: ${toolName} with args:`, toolArgs);
      }

      const toolResult = await this.executeToolWithSafety(toolName, toolArgs);

      // If tool requires confirmation or disambiguation from user
      if (toolResult.needsConfirmation || toolResult.needsSelection) {
        const prompt = toolResult.prompt;
        this.memory.addMessage('assistant', prompt);
        return {
          text: prompt,
          toolUsed: toolName,
          pendingAction: this.confirmationManager.getPending(),
          success: true,
        };
      }

      // Generate natural, concise AI response with the tool's result
      const naturalResponse = await this.geminiService.generateFinalResponse({
        originalPrompt: rawInput,
        toolName,
        toolResult,
        history,
      });

      this.memory.addMessage('assistant', naturalResponse);
      return {
        text: naturalResponse,
        toolUsed: toolName,
        toolData: toolResult.data,
        success: toolResult.success !== false,
      };
    }

    // 6. Direct conversational text response from Gemini
    const textOutput = aiRes.text || "I'm not sure how to answer that.";

    // Check if user is sharing a fact to remember (e.g. "My name is X", "I live in Y")
    const nameMatch = rawInput.match(/my name is\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      try {
        this.memory.setFact('user_name', nameMatch[1].trim());
      } catch {}
    }

    this.memory.addMessage('assistant', textOutput);
    return {
      text: textOutput,
      success: true,
    };
  }

  /**
   * Executes a tool with permission checks and confirmation interception
   */
  async executeToolWithSafety(toolName, args = {}) {
    const risk = this.permissionManager.getToolRisk(toolName);

    // If sensitive, execute tool to see if it needs confirmation or selection
    const result = await this.toolRegistry.execute(toolName, args);

    if (result.needsSelection) {
      this.confirmationManager.setPending({
        type: 'SELECT_OPTION',
        toolName,
        prompt: result.prompt,
        options: result.options,
        onSelect: async (chosen) => {
          // Once chosen, if it's a call tool, ask for confirmation
          if (toolName === 'call_contact') {
            return {
              needsConfirmation: true,
              prompt: `Call ${chosen.label}?`,
              targetContact: { name: chosen.label, number: chosen.number },
            };
          }
          if (toolName === 'send_sms') {
            return {
              needsConfirmation: true,
              prompt: `Send message to ${chosen.label}?\n"${result.pendingMessage}"\nConfirm?`,
              targetContact: { name: chosen.label, number: chosen.number },
            };
          }
          return await this.toolRegistry.execute(toolName, { ...args, ...chosen });
        },
      });
      return result;
    }

    if (result.needsConfirmation) {
      this.confirmationManager.setPending({
        type: 'CONFIRM_ACTION',
        toolName,
        prompt: result.prompt,
        onConfirm: async () => {
          return await this.toolRegistry.execute(toolName, { ...args, confirmed: true });
        },
      });
      return result;
    }

    return result;
  }
}

export const agent = new NexaAgent();
