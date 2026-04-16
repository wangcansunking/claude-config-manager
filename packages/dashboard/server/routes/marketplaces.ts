import { Router } from 'express';
import { MarketplaceManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/marketplaces
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const marketplaces = await new MarketplaceManager(home).listMarketplaces();
    res.json(marketplaces);
  } catch (err) {
    console.error('[GET /api/marketplaces]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/marketplaces
router.post('/', async (req, res) => {
  try {
    const { name, repo } = req.body as { name?: string; repo?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (!repo || typeof repo !== 'string') {
      return res.status(400).json({ error: 'Missing required field: repo' });
    }
    const home = getClaudeHome();
    await new MarketplaceManager(home).addMarketplace(name, repo);
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/marketplaces]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(400).json({ error: message });
  }
});

// DELETE /api/marketplaces/:name
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new MarketplaceManager(home).removeMarketplace(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/marketplaces/:name]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(400).json({ error: message });
  }
});

// GET /api/marketplaces/:name/plugins
router.get('/:name/plugins', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    const plugins = await new MarketplaceManager(home).listAvailablePlugins(
      decodeURIComponent(name),
    );
    res.json(plugins);
  } catch (err) {
    console.error('[GET /api/marketplaces/:name/plugins]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(400).json({ error: message });
  }
});

export { router as marketplacesRouter };
