/**
 * NEXA - Android Intents & App Launcher Service
 * Resolves application names to Android package intents or Termux commands.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { POPULAR_ANDROID_APPS } from '../../config/constants.js';

const execAsync = promisify(exec);

export class AndroidIntents {
  constructor() {
    this.appCatalog = { ...POPULAR_ANDROID_APPS };
  }

  /**
   * Resolve an app by spoken name or alias
   */
  resolveApp(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase().replace(/^(open|launch|start)\s+/i, '');

    // Direct match in popular apps catalog
    for (const [key, info] of Object.entries(this.appCatalog)) {
      if (key === clean || info.name.toLowerCase() === clean || clean.includes(key)) {
        return info;
      }
    }

    // Generic fallback assuming it might be a standard package name or name
    return {
      name: name,
      package: clean.includes('.') ? clean : null,
      genericQuery: clean,
    };
  }

  /**
   * Launch application via Termux am start or termux-open
   */
  async launchApp(appNameOrPackage) {
    const resolved = this.resolveApp(appNameOrPackage);
    if (!resolved) {
      return {
        success: false,
        userMessage: `I couldn't identify the application '${appNameOrPackage}'.`,
      };
    }

    try {
      // 1. If we have a direct Android package, attempt am start launcher
      if (resolved.package) {
        // Try Termux am start
        const cmd = `am start -n $(pm resolve-activity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER ${resolved.package} 2>/dev/null | grep name= | head -n 1 | cut -d= -f2) 2>/dev/null || monkey -p ${resolved.package} -c android.intent.category.LAUNCHER 1 2>/dev/null`;
        
        try {
          await execAsync(cmd, { timeout: 3000 });
          return {
            success: true,
            appName: resolved.name,
            message: `Opening ${resolved.name}.`,
          };
        } catch (e) {
          // Fall back to urlScheme if available
          if (resolved.urlScheme) {
            await execAsync(`termux-open-url "${resolved.urlScheme}" 2>/dev/null`, { timeout: 2000 });
            return {
              success: true,
              appName: resolved.name,
              message: `Opening ${resolved.name}.`,
            };
          }
        }
      }

      // 2. Generic scheme or termux-open fallback
      if (resolved.urlScheme) {
        await execAsync(`termux-open-url "${resolved.urlScheme}" 2>/dev/null`, { timeout: 2000 });
        return {
          success: true,
          appName: resolved.name,
          message: `Opening ${resolved.name}.`,
        };
      }

      // If we are on Linux desktop, try gtk-launch or xdg-open
      if (process.platform === 'linux') {
        try {
          await execAsync(`gtk-launch ${resolved.name.toLowerCase()} 2>/dev/null || xdg-open $(which ${resolved.name.toLowerCase()}) 2>/dev/null`, { timeout: 3000 });
          return {
            success: true,
            appName: resolved.name,
            message: `Opening ${resolved.name}.`,
          };
        } catch (err) {
          // Fall through to fallback simulation
        }
      }

      // Development / test simulation fallback
      return {
        success: true,
        appName: resolved.name,
        message: `Opening ${resolved.name}.`,
        simulated: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        userMessage: `Failed to open ${resolved.name}: ${err.message}`,
      };
    }
  }

  /**
   * Open a web URL or intent uri
   */
  async openUrl(url) {
    try {
      // Check for termux-open-url or xdg-open
      const cmd = `termux-open-url "${url}" 2>/dev/null || xdg-open "${url}" 2>/dev/null || open "${url}" 2>/dev/null`;
      await execAsync(cmd, { timeout: 3000 });
      return { success: true, url, message: `Opened ${url}` };
    } catch (err) {
      return { success: false, error: err.message, userMessage: `Could not open URL: ${url}` };
    }
  }
}

export const androidIntents = new AndroidIntents();
