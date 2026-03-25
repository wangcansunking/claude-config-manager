import { NextRequest, NextResponse } from 'next/server';
import { PluginManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const home = getClaudeHome();
    await new PluginManager(home).remove(decodeURIComponent(name));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/plugins/[name]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const body = await request.json() as { enabled?: boolean };
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing required field: enabled (boolean)' }, { status: 400 });
    }
    const home = getClaudeHome();
    await new PluginManager(home).toggle(decodeURIComponent(name), body.enabled);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/plugins/[name]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
