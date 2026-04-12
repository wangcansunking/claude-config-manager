import { NextRequest, NextResponse } from 'next/server';
import { McpManager, getClaudeHome } from '@ccm/core';

// ---------------------------------------------------------------------------
// POST /api/mcp-registry/install
// Body: { name: string, command: string, args: string[], env?: Record<string, string> }
// Writes to ~/.claude/.mcp.json via McpManager.add()
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };

    const { name, command, args, env } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Missing required field: command' }, { status: 400 });
    }
    if (args !== undefined && !Array.isArray(args)) {
      return NextResponse.json({ error: 'Field args must be an array' }, { status: 400 });
    }

    const config: { command: string; args?: string[]; env?: Record<string, string> } = { command };
    if (args && args.length > 0) config.args = args;
    if (env && Object.keys(env).length > 0) config.env = env;

    const home = getClaudeHome();
    const manager = new McpManager(home);
    await manager.add(name, config);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('already exists') ? 409 : 500;
    console.error('[POST /api/mcp-registry/install]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
