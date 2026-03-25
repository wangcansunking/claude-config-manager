import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager, getClaudeHome } from '@ccm/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string };
    const { name } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    const home = getClaudeHome();
    const exported = await new ProfileManager(home).exportProfile(name);
    return NextResponse.json({ data: exported });
  } catch (err) {
    console.error('[POST /api/export]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
