/**
 * NEXA - Confirmation & Disambiguation Manager
 * Handles pending sensitive actions, contact choice selections, and user prompts.
 */

export class ConfirmationManager {
  constructor() {
    this.pendingAction = null;
  }

  /**
   * Sets a pending action that requires user confirmation or selection
   * @param {Object} action
   *   type: 'CONFIRM_ACTION' | 'SELECT_OPTION'
   *   prompt: string
   *   toolName: string
   *   params: any
   *   options?: Array<{ label: string, value: any }>
   *   onConfirm: (response: string, selectedOption?: any) => Promise<any>
   */
  setPending(action) {
    this.pendingAction = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      ...action,
    };
    return this.pendingAction;
  }

  getPending() {
    return this.pendingAction;
  }

  hasPending() {
    return this.pendingAction !== null;
  }

  clear() {
    this.pendingAction = null;
  }

  /**
   * Evaluates user input against the pending confirmation
   * Returns { handled: boolean, actionResult?: any, promptAgain?: string, cancelled?: boolean }
   */
  async handleUserInput(input) {
    if (!this.pendingAction) {
      return { handled: false };
    }

    const trimmed = (input || '').trim();
    const action = this.pendingAction;

    // Check for cancellation
    if (/^(no|n|cancel|abort|stop|quit)$/i.test(trimmed)) {
      this.clear();
      return {
        handled: true,
        cancelled: true,
        message: 'Action cancelled.',
      };
    }

    // Option Selection flow (e.g., "Which one? 1/2/3")
    if (action.type === 'SELECT_OPTION') {
      const selectedIndex = parseInt(trimmed, 10);
      if (
        !isNaN(selectedIndex) &&
        selectedIndex >= 1 &&
        selectedIndex <= action.options.length
      ) {
        const chosen = action.options[selectedIndex - 1];
        this.clear();
        const result = await action.onSelect(chosen);
        return {
          handled: true,
          actionResult: result,
        };
      }

      // Check if user typed the name or part of name directly
      const match = action.options.find(
        (opt) => opt.label.toLowerCase().includes(trimmed.toLowerCase())
      );
      if (match) {
        this.clear();
        const result = await action.onSelect(match);
        return {
          handled: true,
          actionResult: result,
        };
      }

      return {
        handled: true,
        retry: true,
        message: `Please enter a valid choice between 1 and ${action.options.length}, or type 'cancel'.`,
      };
    }

    // Yes/No Confirmation flow
    if (action.type === 'CONFIRM_ACTION') {
      if (/^(yes|y|yeah|yep|sure|proceed|ok|okay|confirm)$/i.test(trimmed)) {
        this.clear();
        const result = await action.onConfirm();
        return {
          handled: true,
          actionResult: result,
        };
      }

      return {
        handled: true,
        retry: true,
        message: `Please reply 'yes' to confirm, or 'no' to cancel. (${action.prompt})`,
      };
    }

    return { handled: false };
  }
}

export const confirmationManager = new ConfirmationManager();
