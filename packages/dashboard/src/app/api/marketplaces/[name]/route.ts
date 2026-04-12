import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceManager, getClaudeHome } from '@ccm/core';

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const home = getClaudeHome();
    await new MarketplaceManager(home).removeMarketplace(decodeURIComponent(name));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/marketplaces/[name]]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
