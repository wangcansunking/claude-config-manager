import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const { filePath, content } = await request.json();

    // Security: only allow writing to ~/.claude/skills/ and ~/.claude/commands/
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.includes('/.claude/skills/') && !normalizedPath.includes('/.claude/commands/')) {
      return NextResponse.json({ error: 'Cannot edit system files' }, { status: 403 });
    }

    await writeFile(filePath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/skills/update]', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
