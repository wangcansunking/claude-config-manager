import { Router } from 'express';
import { ProfileManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/profiles
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const profiles = await new ProfileManager(home).list();
    res.json(profiles);
  } catch (err) {
    console.error('[GET /api/profiles]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profiles
router.post('/', async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    const home = getClaudeHome();
    const profile = await new ProfileManager(home).create(name);
    res.status(201).json(profile);
  } catch (err) {
    console.error('[POST /api/profiles]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profiles/:name/activate
router.post('/:name/activate', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new ProfileManager(home).activate(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/profiles/:name/activate]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/profiles/:name
router.patch('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const body = req.body;
    const home = getClaudeHome();
    const updated = await new ProfileManager(home).update(decodeURIComponent(name), body);
    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/profiles/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profiles/:name
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new ProfileManager(home).delete(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/profiles/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profiles/export (mapped from old /api/export)
router.post('/export', async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    const home = getClaudeHome();
    const exported = await new ProfileManager(home).exportProfile(name);
    res.json({ data: exported });
  } catch (err) {
    console.error('[POST /api/profiles/export]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profiles/import (mapped from old /api/import)
router.post('/import', async (req, res) => {
  try {
    const { data, strategy = 'replace' } = req.body as { data?: string; strategy?: 'merge' | 'replace' };
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Missing required field: data' });
    }
    if (strategy !== 'merge' && strategy !== 'replace') {
      return res.status(400).json({ error: 'Invalid value for strategy: must be "merge" or "replace"' });
    }
    const home = getClaudeHome();
    const profile = await new ProfileManager(home).importProfile(data, strategy);
    res.status(201).json(profile);
  } catch (err) {
    console.error('[POST /api/profiles/import]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as profilesRouter };
