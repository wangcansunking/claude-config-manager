import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager, getClaudeHome } from '@ccm/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { data?: string; strategy?: 'merge' | 'replace' };
    const { data, strategy = 'replace' } = body;
    if (!data || typeof data !== 'string') {
      return NextResponse.json({ error: 'Missing required field: data' }, { status: 400 });
    }
    if (strategy !== 'merge' && strategy !== 'replace') {
      return NextResponse.json(
        { error: 'Invalid value for strategy: must be "merge" or "replace"' },
        { status: 400 },
      );
    }
    const home = getClaudeHome();
    const profile = await new ProfileManager(home).importProfile(data, strategy);
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error('[POST /api/import]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
