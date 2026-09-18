/**
 * NEXA - Terminal ANSI Colors
 * Zero-dependency formatting for Node.js CLI
 */

const isColorSupported = Boolean(
  process.stdout &&
  process.stdout.isTTY &&
  process.env.TERM !== 'dumb'
);

export const colors = {
  reset: (text) => (isColorSupported ? `\x1b[0m${text}\x1b[0m` : text),
  bold: (text) => (isColorSupported ? `\x1b[1m${text}\x1b[0m` : text),
  dim: (text) => (isColorSupported ? `\x1b[2m${text}\x1b[0m` : text),
  italic: (text) => (isColorSupported ? `\x1b[3m${text}\x1b[0m` : text),
  underline: (text) => (isColorSupported ? `\x1b[4m${text}\x1b[0m` : text),

  // Foreground
  black: (text) => (isColorSupported ? `\x1b[30m${text}\x1b[0m` : text),
  red: (text) => (isColorSupported ? `\x1b[31m${text}\x1b[0m` : text),
  green: (text) => (isColorSupported ? `\x1b[32m${text}\x1b[0m` : text),
  yellow: (text) => (isColorSupported ? `\x1b[33m${text}\x1b[0m` : text),
  blue: (text) => (isColorSupported ? `\x1b[34m${text}\x1b[0m` : text),
  magenta: (text) => (isColorSupported ? `\x1b[35m${text}\x1b[0m` : text),
  cyan: (text) => (isColorSupported ? `\x1b[36m${text}\x1b[0m` : text),
  white: (text) => (isColorSupported ? `\x1b[37m${text}\x1b[0m` : text),
  gray: (text) => (isColorSupported ? `\x1b[90m${text}\x1b[0m` : text),

  // Semantic
  primary: (text) => (isColorSupported ? `\x1b[36m\x1b[1m${text}\x1b[0m` : text), // Bold Cyan
  success: (text) => (isColorSupported ? `\x1b[32m${text}\x1b[0m` : text),
  warning: (text) => (isColorSupported ? `\x1b[33m${text}\x1b[0m` : text),
  danger: (text) => (isColorSupported ? `\x1b[31m\x1b[1m${text}\x1b[0m` : text),
  muted: (text) => (isColorSupported ? `\x1b[90m${text}\x1b[0m` : text),
};

/**
 * Strip ANSI escape codes (useful for web display or log storage)
 */
export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}
