/**
 * NEXA - Response Formatter
 * Natural response crafting, tool outcome feedback, and conversational styling.
 */

export function formatActionResponse(action, target, status = 'success') {
  if (status === 'success') {
    switch (action) {
      case 'open_app':
        return `Opening ${target}.`;
      case 'call':
        return `Calling ${target}...`;
      case 'sms':
        return `Message sent to ${target}.`;
      case 'timer':
        return `Timer set for ${target}.`;
      default:
        return `Done: ${action} completed.`;
    }
  }
  return `Could not complete ${action}.`;
}

export function formatErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;
  return err.userMessage || err.message || 'An unexpected error occurred.';
}
