/**
 * NEXA - Safety & Permission System
 * Enforces SAFE, SENSITIVE, and DANGEROUS levels with confirmation gating.
 */
import { RISK_LEVELS } from '../config/constants.js';

export class PermissionManager {
  constructor() {
    this.toolRiskMap = new Map();
  }

  /**
   * Registers or updates risk level for a tool
   */
  setToolRisk(toolName, riskLevel) {
    if (!Object.values(RISK_LEVELS).includes(riskLevel)) {
      throw new Error(`Invalid risk level: ${riskLevel}`);
    }
    this.toolRiskMap.set(toolName, riskLevel);
  }

  getToolRisk(toolName) {
    return this.toolRiskMap.get(toolName) || RISK_LEVELS.SAFE;
  }

  /**
   * Returns true if executing this tool requires explicit user confirmation
   */
  requiresConfirmation(toolName) {
    const risk = this.getToolRisk(toolName);
    return risk === RISK_LEVELS.SENSITIVE || risk === RISK_LEVELS.DANGEROUS;
  }

  /**
   * Evaluates if a shell command is allowed or dangerous
   */
  evaluateShellCommand(command) {
    const trimmed = (command || '').trim();
    if (!trimmed) {
      return { allowed: false, reason: 'Empty command' };
    }

    // Check against forbidden destructive patterns
    import('../config/constants.js').then();
    const dangerousPatterns = [
      /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f?|-[a-zA-Z]*f[a-zA-Z]*r?)\s+[\/\~]/i,
      />\s*\/dev\/sd/i,
      /mkfs/i,
      /dd\s+if=/i,
      /chmod\s+-R\s+777\s+\//i,
      /shutdown/i,
      /reboot/i,
      /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          requiresConfirmation: false,
          risk: RISK_LEVELS.DANGEROUS,
          reason: 'Command matched a forbidden destructive pattern and is blocked for safety.',
        };
      }
    }

    const baseCmd = trimmed.split(/\s+/)[0];
    const allowedSafe = ['pwd', 'ls', 'date', 'whoami', 'uname', 'uptime', 'free', 'df', 'node', 'npm', 'git', 'echo'];

    if (allowedSafe.includes(baseCmd)) {
      return {
        allowed: true,
        requiresConfirmation: false,
        risk: RISK_LEVELS.SAFE,
        reason: 'Command in safe allowlist',
      };
    }

    // Any other shell command is considered sensitive and requires user confirmation
    return {
      allowed: true,
      risk: RISK_LEVELS.SENSITIVE,
      requiresConfirmation: true,
      reason: 'Command is not in the safe allowlist and requires confirmation before running.',
    };
  }
}

export const permissionManager = new PermissionManager();
