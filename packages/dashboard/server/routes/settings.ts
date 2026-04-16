import { Router } from 'express';
import { ConfigManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/settings
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const settings = await new ConfigManager(home).getSettings();
    res.json(settings);
  } catch (err) {
    console.error('[GET /api/settings]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/settings
router.patch('/', async (req, res) => {
  try {
    const patch = req.body as Record<string, unknown>;
    const home = getClaudeHome();
    await new ConfigManager(home).updateSettings(patch);
    res.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/env
router.get('/env', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const env = await new ConfigManager(home).getEnvVars();
    res.json(env);
  } catch (err) {
    console.error('[GET /api/settings/env]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/env
router.put('/env', async (req, res) => {
  try {
    const { key, value } = req.body as { key?: string; value?: string };
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Missing required field: key' });
    }
    if (value === undefined || typeof value !== 'string') {
      return res.status(400).json({ error: 'Missing required field: value' });
    }
    const home = getClaudeHome();
    await new ConfigManager(home).setEnvVar(key, value);
    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/settings/env]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/settings/env/:key
router.delete('/env/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const home = getClaudeHome();
    await new ConfigManager(home).removeEnvVar(decodeURIComponent(key));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/settings/env/:key]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingsRouter };
