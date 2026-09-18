/**
 * NEXA - Safe Web Page Fetcher
 * Retrieves web page content with size limits and HTML tag stripping.
 */
export async function fetchWebPage(url, maxChars = 3000) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NEXA-Bot/1.0)',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP status ${res.status}` };
    }

    const html = await res.text();

    // Strip scripts, styles, and html tags
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      success: true,
      url,
      content: cleaned.slice(0, maxChars),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}
