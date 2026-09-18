/**
 * NEXA - Full-Stack Server
 * Express backend powering the interactive terminal web interface and API routes.
 */
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { agent } from './src/core/agent.js';
import { toolRegistry } from './src/tools/registry.js';
import { memory } from './src/core/memory.js';
import { env } from './src/config/environment.js';
import { platformAdapter } from './src/services/android/adapter.js';
import { geminiService, parseGeminiError } from './src/ai/gemini.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', assistant: 'NEXA' });
  });

  app.get('/api/status', async (req, res) => {
    try {
      const devInfo = await platformAdapter.getDeviceInfo();
      const safeEnv = env.getSafeStatus();
      const tools = toolRegistry.listTools();

      res.json({
        success: true,
        platform: devInfo.platform,
        isAndroidTermux: devInfo.isAndroidTermux,
        hasTermuxApi: devInfo.hasTermuxApi,
        geminiConfigured: safeEnv.geminiConfigured,
        model: (geminiService as any).lastModelUsed || 'gemini-3.8-flash',
        toolsCount: tools.length,
        dataDirectory: safeEnv.dataDirectory,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/tools', (req, res) => {
    try {
      const tools = toolRegistry.listTools();
      res.json({ success: true, tools });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const result: any = await agent.processInput(message);
      res.json({
        success: true,
        text: result.text,
        toolUsed: result.toolUsed,
        toolData: result.toolData,
        pendingAction: result.pendingAction,
      });
    } catch (err: any) {
      const parsed = parseGeminiError(err);
      res.status(500).json({ success: false, error: parsed.userFriendly || err.message });
    }
  });

  app.get('/api/history', (req, res) => {
    try {
      const history = memory.getHistory();
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/clear', (req, res) => {
    try {
      memory.clearHistory();
      res.json({ success: true, message: 'Session history cleared' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/memory', (req, res) => {
    try {
      const facts = memory.listFacts();
      res.json({ success: true, facts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 NEXA Server running on port ${PORT}`);
  });
}

startServer();
