import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execFile);

interface SkillResult {
  name: string;        // e.g., "vercel-labs/agent-skills@vercel-react-best-practices"
  installs: string;    // e.g., "320.7K installs"
  url: string;         // e.g., "https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices"
  installCommand: string; // "npx skills add vercel-labs/agent-skills@vercel-react-best-practices"
}

// Cache search results for 5 minutes
const searchCache = new Map<string, { data: SkillResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  if (!query.trim()) {
    return NextResponse.json([]);
  }

  // Check cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Use locally installed skills package (faster than npx)
    const { resolve } = await import('path');
    const skillsBin = resolve(process.cwd(), '..', '..', 'node_modules', 'skills', 'bin', 'cli.mjs');
    const { stdout } = await exec('node', [skillsBin, 'find', query], {
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });

    const results = parseSkillsOutput(stdout);
    searchCache.set(query, { data: results, timestamp: Date.now() });
    return NextResponse.json(results);
  } catch (err) {
    console.error('[GET /api/skills/search]', err);
    return NextResponse.json([]);
  }
}

function parseSkillsOutput(output: string): SkillResult[] {
  const results: SkillResult[] = [];
  const lines = output.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '').trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines like: "vercel-labs/agent-skills@vercel-react-best-practices 320.7K installs"
    const match = line.match(/^([\w\-\.]+\/[\w\-\.]+@[\w\-\.:]+)\s+([\d\.]+[KMB]?\s+installs?)$/);
    if (match) {
      const name = match[1];
      const installs = match[2];
      // Next line should be the URL
      const urlLine = lines[i + 1] ?? '';
      const urlMatch = urlLine.match(/(https:\/\/skills\.sh\/\S+)/);
      const url = urlMatch ? urlMatch[1] : `https://skills.sh/${name.replace('@', '/')}`;

      results.push({
        name,
        installs,
        url,
        installCommand: `npx skills add ${name}`,
      });
      i++; // skip url line
    }
  }

  return results;
}
