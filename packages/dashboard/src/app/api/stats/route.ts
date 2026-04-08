import { NextResponse } from 'next/server';
import { PluginManager, McpManager, SkillScanner, ProfileManager, SessionManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const [plugins, mcps, skills, profiles, sessions] = await Promise.all([
      new PluginManager(home).list(),
      new McpManager(home).list(),
      new SkillScanner(home).scan(),
      new ProfileManager(home).list(),
      new SessionManager(home).getActiveSessions(),
    ]);
    return NextResponse.json({
      plugins: plugins.length,
      mcpServers: mcps.length,
      skills: skills.length,
      profiles: profiles.length,
      sessions: sessions.length,
    });
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
