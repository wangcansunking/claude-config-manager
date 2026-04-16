import { Router } from 'express';
import { getClaudeHome } from '@ccm/core';
import { watch } from 'chokidar';

const router = Router();

// GET /api/events (SSE)
router.get('/', (req, res) => {
  const home = getClaudeHome();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Flush headers immediately
  res.flushHeaders();

  const watcher = watch(
    [
      `${home}/settings.json`,
      `${home}/plugins/installed_plugins.json`,
      `${home}/.mcp.json`,
      `${home}/sessions/*.json`,
      `${home}/plugins/profiles/*.json`,
    ],
    {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300 },
    },
  );

  watcher.on('all', (event: string, filePath: string) => {
    let category = 'unknown';
    const normPath = filePath.replace(/\\/g, '/');
    if (normPath.includes('settings.json') && !normPath.includes('/profiles/')) {
      category = 'settings';
    } else if (normPath.includes('installed_plugins')) {
      category = 'plugins';
    } else if (normPath.includes('.mcp.json')) {
      category = 'mcps';
    } else if (normPath.includes('/sessions/')) {
      category = 'sessions';
    } else if (normPath.includes('/profiles/')) {
      category = 'profiles';
    }

    const data = JSON.stringify({
      type: 'change',
      category,
      event,
      timestamp: Date.now(),
    });
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // stream may be closed
    }
  });

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: {"type":"heartbeat"}\n\n`);
    } catch {
      // stream may be closed
    }
  }, 30000);

  req.on('close', () => {
    watcher.close();
    clearInterval(heartbeat);
  });
});

export { router as eventsRouter };
