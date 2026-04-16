import { Router } from 'express';
import { MetricsManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/metrics
router.get('/', async (_req, res) => {
  try {
    const mgr = new MetricsManager(getClaudeHome());
    const metrics = await mgr.getMetrics();
    res.json(metrics);
  } catch (err) {
    console.error('[GET /api/metrics]', err);
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

export { router as metricsRouter };
