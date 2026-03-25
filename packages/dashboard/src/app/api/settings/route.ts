import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const settings = await new ConfigManager(home).getSettings();
    return NextResponse.json(settings);
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const patch = await request.json() as Record<string, unknown>;
    const home = getClaudeHome();
    await new ConfigManager(home).updateSettings(patch);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
