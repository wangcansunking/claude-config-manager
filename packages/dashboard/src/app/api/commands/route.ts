import { NextResponse } from 'next/server';
import { SkillScanner, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const commands = await new SkillScanner(home).scanCommands();
    return NextResponse.json(commands);
  } catch (err) {
    console.error('[GET /api/commands]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
