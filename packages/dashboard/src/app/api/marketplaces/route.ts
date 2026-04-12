import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const marketplaces = await new MarketplaceManager(home).listMarketplaces();
    return NextResponse.json(marketplaces);
  } catch (err) {
    console.error('[GET /api/marketplaces]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string; repo?: string };
    const { name, repo } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    if (!repo || typeof repo !== 'string') {
      return NextResponse.json({ error: 'Missing required field: repo' }, { status: 400 });
    }
    const home = getClaudeHome();
    await new MarketplaceManager(home).addMarketplace(name, repo);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/marketplaces]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
