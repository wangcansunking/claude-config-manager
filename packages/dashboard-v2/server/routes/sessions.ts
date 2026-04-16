import { Router } from 'express';
import { SessionManager, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/sessions
router.get('/', async (_req, res) => {
  try {
    const mgr = new SessionManager(getClaudeHome());
    const sessions = await mgr.listAllSessions();
    res.json(sessions);
  } catch (err) {
    console.error('[GET /api/sessions]', err);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// GET /api/sessions/history?file=&limit=
router.get('/history', async (req, res) => {
  try {
    const historyFile = req.query.file as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    if (!historyFile) {
      return res.status(400).json({ error: 'Missing "file" query parameter' });
    }

    const mgr = new SessionManager(getClaudeHome());
    const history = await mgr.getSessionHistory(historyFile, limit);
    res.json(history);
  } catch (err) {
    console.error('[GET /api/sessions/history]', err);
    res.status(500).json({ error: 'Failed to load session history' });
  }
});

export { router as sessionsRouter };
