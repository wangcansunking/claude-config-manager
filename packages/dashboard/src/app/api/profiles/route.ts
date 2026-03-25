import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const profiles = await new ProfileManager(home).list();
    return NextResponse.json(profiles);
  } catch (err) {
    console.error('[GET /api/profiles]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string };
    const { name } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    const home = getClaudeHome();
    const profile = await new ProfileManager(home).create(name);
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error('[POST /api/profiles]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
