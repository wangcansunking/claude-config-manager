import { NextRequest } from 'next/server';
import { getClaudeHome } from '@ccm/core';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const home = getClaudeHome();

  // Dynamic import for chokidar (ESM-only in v4, safe to require in v3)
  const { watch } = await import('chokidar');

  const stream = new ReadableStream({
    start(controller) {
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
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream may be closed
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`));
        } catch {
          // stream may be closed
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
        watcher.close();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
