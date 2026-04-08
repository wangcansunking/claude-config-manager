import { NextResponse } from 'next/server';
import { SessionManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const mgr = new SessionManager(getClaudeHome());
    const sessions = await mgr.listSessions();
    return NextResponse.json(sessions);
  } catch (err) {
    console.error('[GET /api/sessions]', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
