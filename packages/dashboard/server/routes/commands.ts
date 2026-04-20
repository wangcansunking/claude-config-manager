import { Router } from 'express';
import { SkillScanner, getClaudeHome } from '@ccm/core';

const router = Router();
const skillScanner = new SkillScanner(getClaudeHome());

// GET /api/commands
router.get('/', async (_req, res, next) => {
  try {
    const commands = await skillScanner.scanCommands();
    // Strip content from response to reduce payload size
    const lightweight = commands.map(({ content: _content, ...rest }) => rest);
    res.json(lightweight);
  } catch (err) {
    next(err);
  }
});

export { router as commandsRouter };
