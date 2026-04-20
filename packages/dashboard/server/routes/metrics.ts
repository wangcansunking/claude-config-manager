import { Router } from 'express';
import { MetricsManager, getClaudeHome } from '@ccm/core';

const router = Router();
const metricsManager = new MetricsManager(getClaudeHome());

// GET /api/metrics
router.get('/', async (_req, res, next) => {
  try {
    const metrics = await metricsManager.getMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

export { router as metricsRouter };
