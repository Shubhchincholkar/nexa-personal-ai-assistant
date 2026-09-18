/**
 * NEXA - Gmail Integration
 * Uses official Gmail REST API with OAuth 2.0.
 * Read-only summary features without permanent message storage.
 */
import { googleOAuthService } from './oauth.js';

export class GmailService {
  async listRecentMessages(query = '', maxResults = 5) {
    const token = await googleOAuthService.getAccessToken();
    if (!token) {
      return {
        success: false,
        requiresAuth: true,
        userMessage: 'Gmail access requires Google OAuth authorization.',
      };
    }

    try {
      const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;
      const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return { success: false, error: `Gmail API error: ${res.statusText}` };
      }

      const listData = await res.json();
      const messages = [];

      for (const item of (listData.messages || [])) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (msgRes.ok) {
          const detail = await msgRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
          const from = headers.find((h) => h.name === 'From')?.value || '(Unknown)';
          const date = headers.find((h) => h.name === 'Date')?.value || '';
          messages.push({
            id: item.id,
            snippet: detail.snippet,
            subject,
            from,
            date,
          });
        }
      }

      return { success: true, messages };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const gmailService = new GmailService();
