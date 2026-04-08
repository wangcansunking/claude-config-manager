import { NextRequest, NextResponse } from 'next/server';
import { SessionManager, getClaudeHome } from '@ccm/core';

export async function GET(request: NextRequest) {
  try {
    const historyFile = request.nextUrl.searchParams.get('file');
    const limitStr = request.nextUrl.searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    if (!historyFile) {
      return NextResponse.json(
        { error: 'Missing "file" query parameter' },
        { status: 400 },
      );
    }

    const mgr = new SessionManager(getClaudeHome());
    const history = await mgr.getSessionHistory(historyFile, limit);
    return NextResponse.json(history);
  } catch (err) {
    console.error('[GET /api/sessions/history]', err);
    return NextResponse.json(
      { error: 'Failed to load session history' },
      { status: 500 },
    );
  }
}
