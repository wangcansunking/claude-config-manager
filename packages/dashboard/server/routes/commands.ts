import { Router } from 'express';
import { SkillScanner, getClaudeHome } from '@ccm/core';

const router = Router();

// GET /api/commands
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const commands = await new SkillScanner(home).scanCommands();
    // Strip content from response to reduce payload size
    const lightweight = commands.map(({ content: _content, ...rest }) => rest);
    res.json(lightweight);
  } catch (err) {
    console.error('[GET /api/commands]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as commandsRouter };
