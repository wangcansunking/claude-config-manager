import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const home = getClaudeHome();
    const plugins = await new MarketplaceManager(home).listAvailablePlugins(
      decodeURIComponent(name),
    );
    return NextResponse.json(plugins);
  } catch (err) {
    console.error('[GET /api/marketplaces/[name]/plugins]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
