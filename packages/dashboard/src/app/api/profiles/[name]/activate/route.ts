import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const home = getClaudeHome();
    await new ProfileManager(home).activate(decodeURIComponent(name));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/profiles/[name]/activate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
