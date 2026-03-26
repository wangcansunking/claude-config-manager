import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const body = await request.json();
    const home = getClaudeHome();
    const updated = await new ProfileManager(home).update(decodeURIComponent(name), body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/profiles/[name]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const home = getClaudeHome();
    await new ProfileManager(home).delete(decodeURIComponent(name));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/profiles/[name]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
