import { NextResponse } from 'next/server';
import { SkillScanner, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const commands = await new SkillScanner(home).scanCommands();
    // Strip content from response to reduce payload size
    const lightweight = commands.map(({ content: _content, ...rest }) => rest);
    return NextResponse.json(lightweight);
  } catch (err) {
    console.error('[GET /api/commands]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
