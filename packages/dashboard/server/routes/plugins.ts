import { Router } from 'express';
import { PluginManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/plugins
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const plugins = await new PluginManager(home).list();
    res.json(plugins);
  } catch (err) {
    console.error('[GET /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plugins
router.post('/', async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    // Install is a stub — actual installation requires CLI tooling
    res.status(501).json({
      message: `Plugin installation for "${name}" is not yet supported via the dashboard.`,
    });
  } catch (err) {
    console.error('[POST /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/plugins/:name
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new PluginManager(home).remove(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/plugins/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/plugins/:name
router.patch('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Missing required field: enabled (boolean)' });
    }
    const home = getClaudeHome();
    await new PluginManager(home).toggle(decodeURIComponent(name), enabled);
    res.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/plugins/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as pluginsRouter };
