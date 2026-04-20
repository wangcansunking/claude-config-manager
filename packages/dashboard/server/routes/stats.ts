import { Router } from 'express';
import {
  PluginManager,
  McpManager,
  SkillScanner,
  ProfileManager,
  SessionManager,
  getClaudeHome,
} from '@ccm/core';

const router = Router();
const home = getClaudeHome();
const pluginManager = new PluginManager(home);
const mcpManager = new McpManager(home);
const skillScanner = new SkillScanner(home);
const profileManager = new ProfileManager(home);
const sessionManager = new SessionManager(home);

// GET /api/stats
router.get('/', async (_req, res, next) => {
  try {
    const [plugins, mcps, skills, profiles, sessions] = await Promise.all([
      pluginManager.list(),
      mcpManager.list(),
      skillScanner.scan(),
      profileManager.list(),
      sessionManager.getActiveSessions(),
    ]);
    res.json({
      plugins: plugins.length,
      mcpServers: mcps.length,
      skills: skills.length,
      profiles: profiles.length,
      sessions: sessions.length,
    });
  } catch (err) {
    next(err);
  }
});

export { router as statsRouter };
