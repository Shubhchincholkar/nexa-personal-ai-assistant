/**
 * NEXA Tool - Calculator
 * Safe mathematical expression evaluator without using arbitrary eval.
 */
import { RISK_LEVELS } from '../config/constants.js';
import { successResult, failureResult } from '../core/errors.js';

export function evaluateMath(expression) {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Please provide a valid math expression.');
  }

  // Sanitize: allow only numbers, basic operators, parentheses, commas, whitespace, and known math words
  const sanitized = expression
    .trim()
    .replace(/x/gi, '*')
    .replace(/\^/g, '**')
    .replace(/pi/gi, Math.PI.toString())
    .replace(/e\b/gi, Math.E.toString());

  // Validate that sanitized expression only contains allowed tokens
  const stripped = sanitized.replace(/\b(sqrt|abs|sin|cos|tan|log|ln|pow|round|floor|ceil)\b/gi, '');
  if (!/^[0-9+\-*/().,%^\s*]+$/.test(stripped)) {
    throw new Error('Expression contains invalid characters or unsafe identifiers.');
  }

  // Safe recursive descent or token replacement parser
  const safeFuncs = {
    sqrt: Math.sqrt,
    abs: Math.abs,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log10,
    ln: Math.log,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
  };

  // Replace function calls with Math references
  let parsed = sanitized;
  for (const name of Object.keys(safeFuncs)) {
    const reg = new RegExp(`\\b${name}\\s*\\(`, 'gi');
    parsed = parsed.replace(reg, `safeFuncs.${name}(`);
  }

  // Safely evaluate isolated mathematical expression using Function with restricted scope
  // eslint-disable-next-line no-new-func
  const fn = new Function('safeFuncs', `"use strict"; return (${parsed});`);
  const result = fn(safeFuncs);

  if (typeof result !== 'number' || isNaN(result)) {
    throw new Error('Calculation resulted in an invalid number or NaN.');
  }

  return Number(result.toFixed(8)) / 1; // Strip excess float trailing zeros
}

export const calculatorTool = {
  name: 'calculate',
  description: 'Calculates mathematical expressions such as arithmetic, percentages, powers, square roots, and basic functions.',
  riskLevel: RISK_LEVELS.SAFE,
  parameters: {
    type: 'OBJECT',
    properties: {
      expression: {
        type: 'STRING',
        description: 'Mathematical expression to compute, e.g. "45 * 12", "sqrt(144) + 10", "15% of 2500"',
      },
    },
    required: ['expression'],
  },
  execute: async (args = {}) => {
    try {
      let expr = args.expression || '';
      // Handle percentage patterns like "20% of 150"
      const pctMatch = expr.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/i);
      if (pctMatch) {
        expr = `(${pctMatch[1]} / 100) * ${pctMatch[2]}`;
      }

      const result = evaluateMath(expr);
      return successResult(
        { expression: args.expression, result },
        `${args.expression} = ${result}`
      );
    } catch (err) {
      return failureResult(err.message, `Could not calculate '${args.expression}': ${err.message}`);
    }
  },
};
