import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const home = getClaudeHome();
    await new ConfigManager(home).removeEnvVar(decodeURIComponent(key));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/settings/env/[key]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
