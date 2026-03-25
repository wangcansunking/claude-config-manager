import { NextRequest, NextResponse } from 'next/server';
import { PluginManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const plugins = await new PluginManager(home).list();
    return NextResponse.json(plugins);
  } catch (err) {
    console.error('[GET /api/plugins]', err);
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
    // Install is a stub — actual installation requires CLI tooling
    return NextResponse.json(
      { message: `Plugin installation for "${name}" is not yet supported via the dashboard.` },
      { status: 501 },
    );
  } catch (err) {
    console.error('[POST /api/plugins]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
