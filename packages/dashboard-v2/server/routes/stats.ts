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

// GET /api/stats
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const [plugins, mcps, skills, profiles, sessions] = await Promise.all([
      new PluginManager(home).list(),
      new McpManager(home).list(),
      new SkillScanner(home).scan(),
      new ProfileManager(home).list(),
      new SessionManager(home).getActiveSessions(),
    ]);
    res.json({
      plugins: plugins.length,
      mcpServers: mcps.length,
      skills: skills.length,
      profiles: profiles.length,
      sessions: sessions.length,
    });
  } catch (err) {
    console.error('[GET /api/stats]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as statsRouter };
