import { NextResponse } from 'next/server';
import { SkillScanner, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const skills = await new SkillScanner(home).scan();
    return NextResponse.json(skills);
  } catch (err) {
    console.error('[GET /api/skills]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
