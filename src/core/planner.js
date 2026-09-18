/**
 * NEXA - Multi-Step Planner
 * Deconstructs multi-intent or composite prompts into sequential tool actions.
 */

export class Planner {
  /**
   * Identifies if a request contains multiple connected steps
   */
  isMultiStep(input) {
    const text = (input || '').toLowerCase();
    return /\b(and then|and also|then|after that|and call|and text)\b/i.test(text);
  }

  /**
   * Plans execution sequence for complex prompts
   */
  plan(input) {
    // Basic multi-step detection
    const segments = input.split(/\b(?:and then|then|after that)\b/i).map((s) => s.trim());
    return {
      isMultiStep: segments.length > 1,
      steps: segments,
    };
  }
}

export const planner = new Planner();
