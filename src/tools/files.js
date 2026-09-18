/**
 * NEXA Tool - Safe File System
 * Scoped file operations restricted to working directories, with confirmation on deletion.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RISK_LEVELS } from '../config/constants.js';
import { successResult, failureResult } from '../core/errors.js';

// Safe root paths: user home directory or current working directory
const ALLOWED_ROOTS = [
  os.homedir(),
  process.cwd(),
  '/sdcard', // Android standard storage root
  '/storage/emulated/0', // Android emulated storage
];

function isPathAllowed(targetPath) {
  const resolved = path.resolve(targetPath);
  return ALLOWED_ROOTS.some((root) => resolved.startsWith(root));
}

export const filesTool = {
  name: 'file_operations',
  description: 'Safe file management: find files by extension, list directories, read text files, create folders, rename files, or delete files with confirmation.',
  riskLevel: RISK_LEVELS.SENSITIVE,
  parameters: {
    type: 'OBJECT',
    properties: {
      action: {
        type: 'STRING',
        enum: ['find', 'list', 'read', 'mkdir', 'rename', 'delete'],
        description: 'File action to execute.',
      },
      targetPath: {
        type: 'STRING',
        description: 'Target directory or file path.',
      },
      destinationPath: {
        type: 'STRING',
        description: 'Destination path for rename or move.',
      },
      extension: {
        type: 'STRING',
        description: 'File extension to search for (e.g. ".pdf", ".txt", ".json")',
      },
      confirmed: {
        type: 'BOOLEAN',
        description: 'True if user has confirmed destructive deletion.',
      },
    },
    required: ['action'],
  },
  execute: async (args = {}) => {
    const { action, targetPath = '.', destinationPath, extension, confirmed } = args;
    const resolvedTarget = path.resolve(targetPath);

    if (!isPathAllowed(resolvedTarget)) {
      return failureResult(
        'Access denied',
        'For your security, file operations are restricted to your home, working, and storage directories.'
      );
    }

    try {
      // 1. Find files by extension (e.g., "Find my PDF files")
      if (action === 'find') {
        const ext = (extension || '.pdf').toLowerCase().replace(/^\./, '');
        const found = [];

        function scanDir(dir, depth = 0) {
          if (depth > 3) return; // Limit depth to prevent runaway scans
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name.startsWith('.')) continue; // skip hidden
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                scanDir(full, depth + 1);
              } else if (entry.isFile() && entry.name.toLowerCase().endsWith(`.${ext}`)) {
                found.push({ name: entry.name, path: full });
                if (found.length >= 20) return;
              }
            }
          } catch (e) {
            // permission or unreadable
          }
        }

        scanDir(resolvedTarget);
        if (found.length === 0) {
          return successResult({ files: [] }, `No .${ext} files found in ${resolvedTarget}.`);
        }
        const summary = found.map((f) => `• ${f.name} (${f.path})`).join('\n');
        return successResult({ files: found }, `Found ${found.length} .${ext} file(s):\n${summary}`);
      }

      // 2. List directory
      if (action === 'list') {
        if (!fs.existsSync(resolvedTarget)) {
          return failureResult('Directory not found', `The folder "${resolvedTarget}" does not exist.`);
        }
        const entries = fs.readdirSync(resolvedTarget, { withFileTypes: true });
        const list = entries.slice(0, 30).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file',
        }));
        const summary = list.map((e) => `${e.type === 'directory' ? '📁' : '📄'} ${e.name}`).join('\n');
        return successResult({ entries: list }, `Contents of ${targetPath}:\n${summary}`);
      }

      // 3. Read file
      if (action === 'read') {
        if (!fs.existsSync(resolvedTarget)) {
          return failureResult('File not found', `The file "${targetPath}" could not be found.`);
        }
        const stats = fs.statSync(resolvedTarget);
        if (stats.size > 200000) {
          // Truncate to first 5000 characters
          const content = fs.readFileSync(resolvedTarget, 'utf8').slice(0, 5000);
          return successResult({ content, truncated: true }, `(Preview of ${targetPath}):\n\n${content}`);
        }
        const content = fs.readFileSync(resolvedTarget, 'utf8');
        return successResult({ content }, content);
      }

      // 4. Create directory (e.g., "Create a folder called College")
      if (action === 'mkdir') {
        if (!fs.existsSync(resolvedTarget)) {
          fs.mkdirSync(resolvedTarget, { recursive: true });
          return successResult({ created: resolvedTarget }, `Folder created: ${targetPath}`);
        }
        return successResult({ existing: resolvedTarget }, `Folder already exists: ${targetPath}`);
      }

      // 5. Rename file
      if (action === 'rename') {
        if (!destinationPath) {
          return failureResult('Missing destination', 'Please provide the new name or destination path.');
        }
        const resolvedDest = path.resolve(destinationPath);
        fs.renameSync(resolvedTarget, resolvedDest);
        return successResult({ from: resolvedTarget, to: resolvedDest }, `Renamed "${targetPath}" to "${destinationPath}".`);
      }

      // 6. Delete file (SENSITIVE / requires confirmation)
      if (action === 'delete') {
        if (!fs.existsSync(resolvedTarget)) {
          return failureResult('Not found', `File "${targetPath}" does not exist.`);
        }
        if (!confirmed) {
          return {
            success: true,
            needsConfirmation: true,
            prompt: `Are you sure you want to delete "${targetPath}"?`,
            targetPath: resolvedTarget,
          };
        }
        const stats = fs.statSync(resolvedTarget);
        if (stats.isDirectory()) {
          fs.rmdirSync(resolvedTarget);
        } else {
          fs.unlinkSync(resolvedTarget);
        }
        return successResult({ deleted: resolvedTarget }, `Deleted "${targetPath}".`);
      }

      return failureResult('Unknown file action', 'Supported actions are find, list, read, mkdir, rename, delete.');
    } catch (err) {
      return failureResult(err.message, `File operation failed: ${err.message}`);
    }
  },
};
