import { NextResponse } from 'next/server';
import { MetricsManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const mgr = new MetricsManager(getClaudeHome());
    const metrics = await mgr.getMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    console.error('[GET /api/metrics]', err);
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}
