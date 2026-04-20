import { Router } from 'express';
import { ConfigManager, getClaudeHome } from '@ccm/core';

const router = Router();
const configManager = new ConfigManager(getClaudeHome());

// GET /api/settings
router.get('/', async (_req, res, next) => {
  try {
    const settings = await configManager.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/settings
router.patch('/', async (req, res, next) => {
  try {
    const patch = req.body as Record<string, unknown>;
    await configManager.updateSettings(patch);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/settings/env
router.get('/env', async (_req, res, next) => {
  try {
    const env = await configManager.getEnvVars();
    res.json(env);
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/env
router.put('/env', async (req, res, next) => {
  try {
    const { key, value } = req.body as { key?: string; value?: string };
    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'Missing required field: key' }); return;
    }
    if (value === undefined || typeof value !== 'string') {
      res.status(400).json({ error: 'Missing required field: value' }); return;
    }
    await configManager.setEnvVar(key, value);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/settings/env/:key
router.delete('/env/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    await configManager.removeEnvVar(decodeURIComponent(key));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as settingsRouter };
