/**
 * NEXA - Gemini AI Service
 * Integrates Google's official @google/genai SDK with function calling,
 * automatic exponential-backoff retries, and transparent fallback models
 * to seamlessly recover from transient 503 (high demand) and 429 errors.
 */
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/environment.js';
import { NEXA_SYSTEM_INSTRUCTION } from './prompts.js';

// Models in priority order. If the primary model experiences high demand (503),
// NEXA automatically fails over to the next capable Flash model.
export const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

/**
 * Parses raw or stringified JSON errors returned by the Gemini API
 */
export function parseGeminiError(err) {
  if (!err) {
    return { isTransient: false, isUnavailable: false, isRateLimited: false, message: 'Unknown error', code: 500 };
  }

  let rawMessage = err.message || String(err);
  let parsedJson = null;

  if (typeof rawMessage === 'string' && rawMessage.trim().startsWith('{')) {
    try {
      parsedJson = JSON.parse(rawMessage);
    } catch {}
  }

  const code = err.status || err.code || parsedJson?.error?.code || parsedJson?.code || 500;
  const status = err.statusText || parsedJson?.error?.status || parsedJson?.status || '';
  const message = parsedJson?.error?.message || parsedJson?.message || rawMessage;

  const msgLower = (message + ' ' + rawMessage + ' ' + status).toLowerCase();

  const isUnavailable =
    code === 503 ||
    msgLower.includes('503') ||
    msgLower.includes('unavailable') ||
    msgLower.includes('high demand') ||
    msgLower.includes('temporarily unavailable') ||
    msgLower.includes('overloaded');

  const isRateLimited =
    code === 429 ||
    msgLower.includes('429') ||
    msgLower.includes('resource_exhausted') ||
    msgLower.includes('quota') ||
    msgLower.includes('rate limit');

  const isTransient = isUnavailable || isRateLimited || code === 504 || code === 500 || msgLower.includes('504');

  let userFriendly = message;
  if (isUnavailable) {
    userFriendly =
      'This model is currently experiencing high demand (503 Service Unavailable). NEXA automatically retried with fallback models, but AI servers are currently busy. Please try again in a few moments, or use direct device commands (e.g. "time", "battery", "open <app>", "timer", "calculate").';
  } else if (isRateLimited) {
    userFriendly =
      'Gemini API request rate limit reached (429). Please pause briefly before sending another request.';
  }

  return {
    isTransient,
    isUnavailable,
    isRateLimited,
    code,
    status,
    message,
    userFriendly,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiService {
  constructor() {
    this._client = null;
    this.activeModel = CANDIDATE_MODELS[0];
    this.lastModelUsed = CANDIDATE_MODELS[0];
  }

  getClient() {
    if (!this._client && env.geminiApiKey) {
      this._client = new GoogleGenAI({
        apiKey: env.geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this._client;
  }

  isAvailable() {
    return Boolean(env.geminiApiKey);
  }

  /**
   * Returns models prioritizing the currently active healthy model
   */
  getCandidateModels() {
    if (this.activeModel && CANDIDATE_MODELS.includes(this.activeModel)) {
      return [this.activeModel, ...CANDIDATE_MODELS.filter((m) => m !== this.activeModel)];
    }
    return [...CANDIDATE_MODELS];
  }

  /**
   * Executes a Gemini call with exponential backoff retries and model fallbacks
   */
  async executeWithResilience(executeFn) {
    const client = this.getClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    let lastError = null;
    const candidateModels = this.getCandidateModels();

    // Iterate through candidate models if transient 503/429 errors occur
    for (let m = 0; m < candidateModels.length; m++) {
      const model = candidateModels[m];
      const maxRetries = 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await executeFn(client, model);
          this.activeModel = model;
          this.lastModelUsed = model;
          return { success: true, response, modelUsed: model };
        } catch (err) {
          lastError = err;
          const parsed = parseGeminiError(err);

          // Fast backoff retry if transient and retries remain
          if (parsed.isTransient && attempt < maxRetries) {
            const delay = 150 * Math.pow(1.5, attempt) + Math.random() * 50;
            await sleep(delay);
            continue;
          }

          // If this model is unavailable (503), fail over to the next candidate model
          if (parsed.isTransient && m < candidateModels.length - 1) {
            break;
          }

          // If non-transient error (e.g. invalid API key or bad prompt syntax), fail immediately
          if (!parsed.isTransient) {
            return {
              success: false,
              error: parsed.message,
              parsed,
              userMessage: `Gemini encountered an error: ${parsed.message}`,
            };
          }
        }
      }
    }

    const finalParsed = parseGeminiError(lastError);
    return {
      success: false,
      error: finalParsed.message,
      parsed: finalParsed,
      userMessage: finalParsed.userFriendly,
    };
  }

  /**
   * Generates response or tool-calling plans using Gemini
   */
  async generateWithTools({ prompt, history = [], tools = [], longTermContext = '' }) {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not set.',
        userMessage: 'NEXA is currently running in offline tool mode because GEMINI_API_KEY is not set. Set GEMINI_API_KEY in your .env to enable AI reasoning.',
      };
    }

    // Build contents array formatted for generateContent
    const contents = [];

    // Include short-term conversation context
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Add current user prompt with long-term memory context if present
    let finalPrompt = prompt;
    if (longTermContext) {
      finalPrompt = `[User Background Context:\n${longTermContext}]\n\nUser Request: ${prompt}`;
    }
    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    // Format tools for Gemini SDK
    const geminiConfig = {
      systemInstruction: NEXA_SYSTEM_INSTRUCTION,
    };

    if (tools && tools.length > 0) {
      geminiConfig.tools = tools;
    }

    const execResult = await this.executeWithResilience(async (genClient, model) => {
      return await genClient.models.generateContent({
        model,
        contents,
        config: geminiConfig,
      });
    });

    if (!execResult.success) {
      return {
        success: false,
        error: execResult.error,
        userMessage: execResult.userMessage,
      };
    }

    const response = execResult.response;
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check for function calls
    const functionCalls = [];
    let textResponse = '';

    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
      if (part.text) {
        textResponse += part.text;
      }
    }

    return {
      success: true,
      text: textResponse.trim(),
      functionCalls,
      modelUsed: execResult.modelUsed,
      rawResponse: response,
    };
  }

  /**
   * Finalizes natural response given tool execution outputs
   */
  async generateFinalResponse({ originalPrompt, toolName, toolResult, history = [] }) {
    const client = this.getClient();
    if (!client) {
      return toolResult.userMessage || toolResult.message || JSON.stringify(toolResult.data || toolResult);
    }

    try {
      const summaryPrompt = `User said: "${originalPrompt}"
You executed tool "${toolName}". Result:
${JSON.stringify(toolResult, null, 2)}

Provide a natural, concise, and helpful response to the user based on this result. If an action succeeded (like opening an app, setting a timer, or calling), be direct and concise.`;

      const execResult = await this.executeWithResilience(async (genClient, model) => {
        return await genClient.models.generateContent({
          model,
          contents: summaryPrompt,
          config: {
            systemInstruction: 'You are NEXA. Speak naturally and concisely. Never say "according to the JSON" or "the tool returned".',
          },
        });
      });

      if (execResult.success && execResult.response?.text) {
        return execResult.response.text.trim();
      }

      return toolResult.userMessage || toolResult.message || 'Done.';
    } catch (e) {
      return toolResult.userMessage || toolResult.message || 'Done.';
    }
  }
}

export const geminiService = new GeminiService();
