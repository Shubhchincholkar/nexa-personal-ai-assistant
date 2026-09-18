/**
 * NEXA - Google OAuth 2.0 Client & Token Manager
 * Manages OAuth credentials and stored access/refresh tokens.
 * NEVER stores passwords. Follows Google OAuth 2.0 specifications.
 */
import fs from 'fs';
import path from 'path';
import { env } from '../../config/environment.js';

export class GoogleOAuthService {
  constructor() {
    this.tokenFilePath = path.join(env.dataDir, 'google-tokens.json');
  }

  isConfigured() {
    return Boolean(env.googleClientId && env.googleClientSecret);
  }

  getTokens() {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        return JSON.parse(fs.readFileSync(this.tokenFilePath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  saveTokens(tokens) {
    try {
      fs.writeFileSync(this.tokenFilePath, JSON.stringify(tokens, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }

  clearTokens() {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        fs.unlinkSync(this.tokenFilePath);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  getAuthUrl(scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.readonly']) {
    if (!this.isConfigured()) {
      return null;
    }
    const redirectUri = `${env.appUrl}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: env.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCode(code) {
    const redirectUri = `${env.appUrl}/api/auth/google/callback`;
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to exchange token: ${err}`);
    }

    const tokens = await res.json();
    this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Returns a valid access token or refreshes it
   */
  async getAccessToken() {
    const tokens = this.getTokens();
    if (!tokens || !tokens.access_token) {
      return null;
    }

    // Refresh if needed
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000 && tokens.refresh_token) {
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.googleClientId,
            client_secret: env.googleClientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        if (res.ok) {
          const fresh = await res.json();
          const updated = {
            ...tokens,
            ...fresh,
            expiry_date: Date.now() + fresh.expires_in * 1000,
          };
          this.saveTokens(updated);
          return updated.access_token;
        }
      } catch (err) {
        if (env.isDebug) console.warn('[OAuth] Refresh failed:', err.message);
      }
    }

    return tokens.access_token;
  }
}

export const googleOAuthService = new GoogleOAuthService();
