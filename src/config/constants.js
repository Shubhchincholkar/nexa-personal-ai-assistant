/**
 * NEXA - Constants & Configuration Defaults
 */

export const RISK_LEVELS = {
  SAFE: 'SAFE',
  SENSITIVE: 'SENSITIVE',
  DANGEROUS: 'DANGEROUS',
};

export const PLATFORMS = {
  ANDROID_TERMUX: 'android_termux',
  LINUX: 'linux',
  DARWIN: 'darwin',
  WINDOWS: 'win32',
  UNKNOWN: 'unknown',
};

export const DEFAULT_ALLOWED_COMMANDS = [
  'pwd',
  'ls',
  'date',
  'whoami',
  'uname',
  'df',
  'free',
  'uptime',
  'node -v',
  'npm -v',
  'git --version',
  'cat',
  'echo',
];

export const FORBIDDEN_COMMAND_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /rm\s+-rf\s+~/i,
  />\s*\/dev\/sd/i,
  /mkfs/i,
  /dd\s+if=/i,
  /:(){:|:&};:/, // fork bomb
  /chmod\s+-R\s+777\s+\//i,
  /shutdown/i,
  /reboot/i,
  /init\s+0/i,
];

export const POPULAR_ANDROID_APPS = {
  whatsapp: {
    name: 'WhatsApp',
    package: 'com.whatsapp',
    intent: 'android.intent.action.MAIN',
    category: 'android.intent.category.LAUNCHER',
  },
  youtube: {
    name: 'YouTube',
    package: 'com.google.android.youtube',
    urlScheme: 'vnd.youtube://',
  },
  chrome: {
    name: 'Google Chrome',
    package: 'com.android.chrome',
    urlScheme: 'googlechrome://',
  },
  gmail: {
    name: 'Gmail',
    package: 'com.google.android.gm',
  },
  maps: {
    name: 'Google Maps',
    package: 'com.google.android.apps.maps',
    urlScheme: 'geo:0,0',
  },
  spotify: {
    name: 'Spotify',
    package: 'com.spotify.music',
    urlScheme: 'spotify://',
  },
  camera: {
    name: 'Camera',
    package: 'com.google.android.GoogleCamera',
    fallbackPackage: 'com.android.camera',
  },
  settings: {
    name: 'Settings',
    package: 'com.android.settings',
  },
  telegram: {
    name: 'Telegram',
    package: 'org.telegram.messenger',
  },
  instagram: {
    name: 'Instagram',
    package: 'com.instagram.android',
  },
  twitter: {
    name: 'X / Twitter',
    package: 'com.twitter.android',
  },
  clock: {
    name: 'Clock',
    package: 'com.google.android.deskclock',
    fallbackPackage: 'com.android.deskclock',
  },
};
