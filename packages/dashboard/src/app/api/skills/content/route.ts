import { NextRequest, NextResponse } from 'next/server';
import { SkillScanner, getClaudeHome } from '@ccm/core';

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const scanner = new SkillScanner(getClaudeHome());
    const content = await scanner.getSkillContent(filePath);
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
