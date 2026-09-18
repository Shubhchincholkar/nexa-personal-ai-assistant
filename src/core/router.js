/**
 * NEXA - Fast Intent Router
 * Determines whether a query can be handled immediately by deterministic tools/heuristics
 * or requires full Gemini AI reasoning & function calling.
 */

export class Router {
  /**
   * Evaluates if user input matches an instant deterministic tool pattern
   */
  route(input) {
    const text = (input || '').trim();
    if (!text) return null;

    // 1. Time / Date queries
    if (/^(what('s| is) the (time|date)|current time|time now|what time is it\??)$/i.test(text)) {
      return {
        type: 'TOOL',
        toolName: 'get_current_time',
        args: {},
        fastPath: true,
      };
    }

    // 2. Battery queries
    if (/^(what('s| is) (my )?battery( percentage| level| status)?\??|battery percentage\??|battery\??)$/i.test(text)) {
      return {
        type: 'TOOL',
        toolName: 'get_battery_status',
        args: {},
        fastPath: true,
      };
    }

    // 3. Calculator queries (e.g. "calculate 50 * 20", "what is 15% of 200", "124 / 4")
    const calcMatch = text.match(/^(?:calculate|compute|what is)\s+([0-9+\-*/().,%^\s\w]+)$/i);
    if (calcMatch && /[0-9]/.test(calcMatch[1]) && /[+\-*/%^]|sqrt|pow/i.test(calcMatch[1])) {
      return {
        type: 'TOOL',
        toolName: 'calculate',
        args: { expression: calcMatch[1].trim() },
        fastPath: true,
      };
    }

    // Pure math expression directly typed (e.g. "45 * 12", "sqrt(144)")
    if (/^[0-9+\-*/().,%^\s]|(sqrt|abs|sin|cos|tan)\([0-9.]+\)$/.test(text) && /[+\-*/^]|sqrt/.test(text)) {
      return {
        type: 'TOOL',
        toolName: 'calculate',
        args: { expression: text },
        fastPath: true,
      };
    }

    // 4. Open app (e.g. "Open WhatsApp", "Launch YouTube", "Start Chrome")
    const appMatch = text.match(/^(?:open|launch|start)\s+([a-zA-Z0-9\s]+)$/i);
    if (appMatch) {
      const appName = appMatch[1].trim();
      // Make sure it's not "open a file" or "open browser"
      if (!/^(a |the )?(file|folder|document|link|url)\b/i.test(appName)) {
        return {
          type: 'TOOL',
          toolName: 'open_app',
          args: { appName },
          fastPath: true,
        };
      }
    }

    // 5. Timer (e.g. "Set a timer for 10 minutes", "Timer 5m", "Set timer 30 seconds")
    const timerMatch = text.match(/^(?:set (?:a )?timer(?: for)?|timer)\s+([\d.]+\s*(?:seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h))\b/i);
    if (timerMatch) {
      return {
        type: 'TOOL',
        toolName: 'set_timer',
        args: { duration: timerMatch[1].trim() },
        fastPath: true,
      };
    }

    // 6. Direct contact calls (e.g. "Call Rahul", "Call Mom")
    const callMatch = text.match(/^call\s+([a-zA-Z\s]+)$/i);
    if (callMatch) {
      return {
        type: 'TOOL',
        toolName: 'call_contact',
        args: { contactName: callMatch[1].trim() },
        fastPath: true,
      };
    }

    // Default: Send to Gemini AI reasoning agent
    return {
      type: 'AI_REASONING',
      input: text,
    };
  }
}

export const router = new Router();
