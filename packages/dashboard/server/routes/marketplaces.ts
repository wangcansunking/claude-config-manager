import { Router } from 'express';
import { MarketplaceManager, getClaudeHome } from '@ccm/core';

const router = Router();
const marketplaceManager = new MarketplaceManager(getClaudeHome());

// GET /api/marketplaces
router.get('/', async (_req, res, next) => {
  try {
    const marketplaces = await marketplaceManager.listMarketplaces();
    res.json(marketplaces);
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplaces
router.post('/', async (req, res, next) => {
  try {
    const { name, repo } = req.body as { name?: string; repo?: string };
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Missing required field: name' }); return;
    }
    if (!repo || typeof repo !== 'string') {
      res.status(400).json({ error: 'Missing required field: repo' }); return;
    }
    await marketplaceManager.addMarketplace(name, repo);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/marketplaces/:name
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await marketplaceManager.removeMarketplace(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplaces/:name/refresh — git pull to update
router.post('/:name/refresh', async (req, res, next) => {
  try {
    const { name } = req.params;
    await marketplaceManager.refreshMarketplace(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/marketplaces/:name/plugins
router.get('/:name/plugins', async (req, res, next) => {
  try {
    const { name } = req.params;
    const plugins = await marketplaceManager.listAvailablePlugins(
      decodeURIComponent(name),
    );
    res.json(plugins);
  } catch (err) {
    next(err);
  }
});

export { router as marketplacesRouter };
