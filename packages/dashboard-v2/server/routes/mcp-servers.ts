import { Router } from 'express';
import { McpManager, getClaudeHome } from '@ccm/core';
import type { McpServerConfig } from '@ccm/types';

const router = Router();

// GET /api/mcp-servers
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const servers = await new McpManager(home).list();
    res.json(servers);
  } catch (err) {
    console.error('[GET /api/mcp-servers]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/mcp-servers
router.post('/', async (req, res) => {
  try {
    const { name, config } = req.body as { name?: string; config?: McpServerConfig };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Missing required field: config' });
    }
    const home = getClaudeHome();
    await new McpManager(home).add(name, config);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[POST /api/mcp-servers]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/mcp-servers/:name
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new McpManager(home).remove(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/mcp-servers/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as mcpServersRouter };
