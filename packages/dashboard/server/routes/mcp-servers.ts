import { Router } from 'express';
import { McpManager, getClaudeHome } from '@ccm/core';
import type { McpServerConfig } from '@ccm/types';

const router = Router();
const mcpManager = new McpManager(getClaudeHome());

// GET /api/mcp-servers
router.get('/', async (_req, res, next) => {
  try {
    const servers = await mcpManager.list();
    res.json(servers);
  } catch (err) {
    next(err);
  }
});

// POST /api/mcp-servers
router.post('/', async (req, res, next) => {
  try {
    const { name, config } = req.body as { name?: string; config?: McpServerConfig };
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Missing required field: name' }); return;
    }
    if (!config || typeof config !== 'object') {
      res.status(400).json({ error: 'Missing required field: config' }); return;
    }
    await mcpManager.add(name, config);
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mcp-servers/:name
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await mcpManager.remove(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as mcpServersRouter };
