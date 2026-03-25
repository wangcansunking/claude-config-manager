import { NextRequest, NextResponse } from 'next/server';
import { McpManager, getClaudeHome } from '@ccm/core';
import type { McpServerConfig } from '@ccm/types';

export async function GET() {
  try {
    const home = getClaudeHome();
    const servers = await new McpManager(home).list();
    return NextResponse.json(servers);
  } catch (err) {
    console.error('[GET /api/mcp-servers]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; config?: McpServerConfig };
    const { name, config } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Missing required field: config' }, { status: 400 });
    }
    const home = getClaudeHome();
    await new McpManager(home).add(name, config);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/mcp-servers]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
