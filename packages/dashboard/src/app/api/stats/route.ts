import { NextResponse } from 'next/server';
import { PluginManager, McpManager, SkillScanner, ProfileManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const [plugins, mcps, skills, profiles] = await Promise.all([
      new PluginManager(home).list(),
      new McpManager(home).list(),
      new SkillScanner(home).scan(),
      new ProfileManager(home).list(),
    ]);
    return NextResponse.json({
      plugins: plugins.length,
      mcpServers: mcps.length,
      skills: skills.length,
      profiles: profiles.length,
    });
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
