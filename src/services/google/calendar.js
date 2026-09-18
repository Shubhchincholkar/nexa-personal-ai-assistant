/**
 * NEXA - Google Calendar Integration
 * Uses official Google Calendar REST API with OAuth 2.0.
 */
import { googleOAuthService } from './oauth.js';

export class GoogleCalendarService {
  async listEvents(maxResults = 10) {
    const token = await googleOAuthService.getAccessToken();
    if (!token) {
      return {
        success: false,
        requiresAuth: true,
        userMessage: 'Google Calendar requires OAuth authorization. Configure GOOGLE_CLIENT_ID or connect your account.',
      };
    }

    try {
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return { success: false, error: `Calendar API error: ${res.statusText}` };
      }

      const data = await res.json();
      const events = (data.items || []).map((ev) => ({
        id: ev.id,
        summary: ev.summary || '(Untitled)',
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        location: ev.location,
      }));

      return { success: true, events };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async createEvent({ summary, startTime, endTime, description, location }) {
    const token = await googleOAuthService.getAccessToken();
    if (!token) {
      return {
        success: false,
        requiresAuth: true,
        userMessage: 'Google Calendar requires OAuth authorization.',
      };
    }

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          location,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
        }),
      });

      if (!res.ok) {
        return { success: false, error: `Calendar create failed: ${res.statusText}` };
      }

      const created = await res.json();
      return { success: true, event: created, message: `Event "${summary}" created in Google Calendar.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
