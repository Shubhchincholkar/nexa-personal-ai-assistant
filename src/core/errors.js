/**
 * NEXA - Custom Errors and Structured Result Helpers
 */

export class NexaError extends Error {
  constructor(message, userMessage = message, code = 'NEXA_ERROR') {
    super(message);
    this.name = 'NexaError';
    this.userMessage = userMessage;
    this.code = code;
  }
}

export class ToolExecutionError extends NexaError {
  constructor(toolName, reason, userMessage) {
    super(
      `Tool '${toolName}' failed: ${reason}`,
      userMessage || `I ran into an issue while running ${toolName}: ${reason}`,
      'TOOL_EXECUTION_ERROR'
    );
    this.toolName = toolName;
  }
}

export class PermissionDeniedError extends NexaError {
  constructor(permission, details) {
    super(
      `Permission denied: ${permission}`,
      details || `I don't have Android permission for ${permission}. Please grant it in Termux:API settings.`,
      'PERMISSION_DENIED'
    );
    this.permission = permission;
  }
}

export class ConfirmationRequiredError extends NexaError {
  constructor(actionName, prompt, payload) {
    super(
      `Confirmation required for: ${actionName}`,
      prompt,
      'CONFIRMATION_REQUIRED'
    );
    this.actionName = actionName;
    this.payload = payload;
  }
}

/**
 * Standard tool success response
 */
export function successResult(data, message = null) {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Standard tool failure response
 */
export function failureResult(error, userMessage = null) {
  return {
    success: false,
    error: typeof error === 'string' ? error : (error?.message || 'Unknown error'),
    userMessage: userMessage || (typeof error === 'string' ? error : (error?.message || 'The action could not be completed.')),
  };
}
