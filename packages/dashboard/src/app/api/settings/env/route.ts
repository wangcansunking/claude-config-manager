import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const env = await new ConfigManager(home).getEnvVars();
    return NextResponse.json(env);
  } catch (err) {
    console.error('[GET /api/settings/env]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { key?: string; value?: string };
    const { key, value } = body;
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing required field: key' }, { status: 400 });
    }
    if (value === undefined || typeof value !== 'string') {
      return NextResponse.json({ error: 'Missing required field: value' }, { status: 400 });
    }
    const home = getClaudeHome();
    await new ConfigManager(home).setEnvVar(key, value);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/settings/env]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
