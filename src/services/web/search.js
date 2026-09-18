/**
 * NEXA - Real-Time Web Search Service
 * Provides web search capability using DuckDuckGo (free, zero-config)
 * or SerpAPI/Tavily when an API key is configured.
 */
import { env } from '../../config/environment.js';

export class WebSearchService {
  /**
   * Performs real-time web search
   */
  async search(query, limit = 5) {
    if (!query || !query.trim()) {
      return { success: false, error: 'Empty search query.' };
    }

    const cleanQuery = query.trim();

    // 1. If custom API key provided for SerpAPI / Tavily
    if (env.webSearchApiKey) {
      try {
        const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(cleanQuery)}&api_key=${env.webSearchApiKey}`;
        const res = await fetch(serpUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const results = (data.organic_results || []).slice(0, limit).map((item) => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
          }));
          return {
            success: true,
            query: cleanQuery,
            results,
            provider: 'serpapi',
          };
        }
      } catch (err) {
        if (env.isDebug) console.warn('[WebSearch] SerpAPI error, falling back:', err.message);
      }
    }

    // 2. Free DuckDuckGo Instant Answer / HTML Search fallback
    try {
      // First try DuckDuckGo Instant Answer JSON API
      const ddgApi = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(ddgApi, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NEXA-Bot/1.0)' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const results = [];

        if (data.AbstractText) {
          results.push({
            title: data.Heading || cleanQuery,
            snippet: data.AbstractText,
            link: data.AbstractURL || '',
          });
        }

        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (topic.Text && results.length < limit) {
              results.push({
                title: topic.Text.split(' - ')[0] || cleanQuery,
                snippet: topic.Text,
                link: topic.FirstURL || '',
              });
            }
          }
        }

        if (results.length > 0) {
          return {
            success: true,
            query: cleanQuery,
            results,
            provider: 'duckduckgo_instant',
          };
        }
      }

      // Fallback: DuckDuckGo HTML Lite search
      const liteUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
      const liteRes = await fetch(liteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(7000),
      });

      if (liteRes.ok) {
        const html = await liteRes.text();
        const results = [];
        // Regex extract title, url, snippet from duckduckgo html
        const regex = /<a class="result__snippet[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const titleRegex = /<a class="result__url[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        
        // Simpler tag extraction
        const snippets = [...html.matchAll(/class="result__snippet[^"]*">([^<]+)<\/a>/g)].map(m => m[1]);
        const titles = [...html.matchAll(/class="result__title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
        
        for (let i = 0; i < Math.min(titles.length, limit); i++) {
          results.push({
            title: titles[i] || `Result ${i + 1}`,
            snippet: snippets[i] || 'Web search snippet.',
            link: '',
          });
        }

        if (results.length > 0) {
          return {
            success: true,
            query: cleanQuery,
            results,
            provider: 'duckduckgo_html',
          };
        }
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
        userMessage: `Web search temporarily unavailable: ${err.message}`,
      };
    }

    return {
      success: true,
      query: cleanQuery,
      results: [
        {
          title: `Search for ${cleanQuery}`,
          snippet: `No direct instant answer found for "${cleanQuery}".`,
          link: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
        },
      ],
      provider: 'fallback',
    };
  }
}

export const webSearchService = new WebSearchService();
