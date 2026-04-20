import { Router } from 'express';
import { SessionManager, getClaudeHome } from '@ccm/core';

const router = Router();
const sessionManager = new SessionManager(getClaudeHome());

// GET /api/sessions
router.get('/', async (_req, res, next) => {
  try {
    const sessions = await sessionManager.listAllSessions();
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/history?file=&limit=
router.get('/history', async (req, res, next) => {
  try {
    const historyFile = req.query.file as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    if (!historyFile) {
      res.status(400).json({ error: 'Missing "file" query parameter' }); return;
    }

    const history = await sessionManager.getSessionHistory(historyFile, limit);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export { router as sessionsRouter };
