import { Router } from 'express';
import { ProfileManager, getClaudeHome } from '@ccm/core';

const router = Router();
const profileManager = new ProfileManager(getClaudeHome());

// GET /api/profiles
router.get('/', async (_req, res, next) => {
  try {
    const profiles = await profileManager.list();
    res.json(profiles);
  } catch (err) {
    next(err);
  }
});

// POST /api/profiles
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Missing required field: name' }); return;
    }
    const profile = await profileManager.create(name);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/profiles/:name/activate
router.post('/:name/activate', async (req, res, next) => {
  try {
    const { name } = req.params;
    await profileManager.activate(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/profiles/:name
router.patch('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const body = req.body;
    const updated = await profileManager.update(decodeURIComponent(name), body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/profiles/:name
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await profileManager.delete(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/profiles/export (mapped from old /api/export)
router.post('/export', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Missing required field: name' }); return;
    }
    const exported = await profileManager.exportProfile(name);
    res.json({ data: exported });
  } catch (err) {
    next(err);
  }
});

// POST /api/profiles/import (mapped from old /api/import)
router.post('/import', async (req, res, next) => {
  try {
    const { data, strategy = 'replace' } = req.body as { data?: string; strategy?: 'merge' | 'replace' };
    if (!data || typeof data !== 'string') {
      res.status(400).json({ error: 'Missing required field: data' }); return;
    }
    if (strategy !== 'merge' && strategy !== 'replace') {
      res.status(400).json({ error: 'Invalid value for strategy: must be "merge" or "replace"' }); return;
    }
    const profile = await profileManager.importProfile(data, strategy);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

export { router as profilesRouter };
