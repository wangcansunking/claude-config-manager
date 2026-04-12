import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Unified registry result type
// ---------------------------------------------------------------------------

export interface McpRegistryResult {
  name: string;
  description: string;
  source: 'mcp-registry' | 'npm' | 'smithery';
  version?: string;
  installCommand?: string;
  repositoryUrl?: string;
  npmUrl?: string;
  score?: number;
}

// ---------------------------------------------------------------------------
// Source 1: Official MCP Registry
// ---------------------------------------------------------------------------

async function searchOfficialRegistry(query: string): Promise<McpRegistryResult[]> {
  const res = await fetch(
    `https://registry.modelcontextprotocol.io/v0.1/servers?search=${encodeURIComponent(query)}&limit=10`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    servers?: { name?: string; description?: string; repositoryUrl?: string }[];
  };
  if (!Array.isArray(data?.servers)) return [];
  return data.servers.map((s) => ({
    name: s.name ?? 'unknown',
    description: s.description ?? '',
    source: 'mcp-registry' as const,
    repositoryUrl: s.repositoryUrl,
    installCommand: s.name ? `npx -y ${s.name}` : undefined,
    score: 0.9, // boost official results
  }));
}

// ---------------------------------------------------------------------------
// Source 2: npm search
// ---------------------------------------------------------------------------

async function searchNpm(query: string): Promise<McpRegistryResult[]> {
  const res = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=mcp+${encodeURIComponent(query)}&size=10`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    objects?: {
      package: {
        name?: string;
        description?: string;
        version?: string;
        links?: { npm?: string; repository?: string };
      };
      score?: { final?: number };
    }[];
  };
  if (!Array.isArray(data?.objects)) return [];
  return data.objects.map((obj) => ({
    name: obj.package.name ?? 'unknown',
    description: obj.package.description ?? '',
    source: 'npm' as const,
    version: obj.package.version,
    npmUrl: obj.package.links?.npm,
    repositoryUrl: obj.package.links?.repository,
    installCommand: obj.package.name ? `npx -y ${obj.package.name}` : undefined,
    score: (obj.score?.final ?? 0.5) * 0.8, // slightly lower than official
  }));
}

// ---------------------------------------------------------------------------
// Source 3: Smithery (optional — needs SMITHERY_API_KEY)
// ---------------------------------------------------------------------------

async function searchSmithery(query: string): Promise<McpRegistryResult[]> {
  const apiKey = process.env.SMITHERY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://registry.smithery.ai/servers?q=${encodeURIComponent(query)}&pageSize=10`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      servers?: {
        qualifiedName?: string;
        displayName?: string;
        description?: string;
        homepage?: string;
      }[];
    };
    if (!Array.isArray(data?.servers)) return [];
    return data.servers.map((s) => ({
      name: s.qualifiedName ?? s.displayName ?? 'unknown',
      description: s.description ?? '',
      source: 'smithery' as const,
      repositoryUrl: s.homepage,
      installCommand: s.qualifiedName
        ? `npx -y @smithery/cli install ${s.qualifiedName} --client claude`
        : undefined,
      score: 0.7,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GET /api/mcp-registry?q=search-term
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ results: [], smitheryAvailable: !!process.env.SMITHERY_API_KEY });
  }

  // Fetch all sources in parallel — tolerant of individual failures
  const [officialResult, npmResult, smitheryResult] = await Promise.allSettled([
    searchOfficialRegistry(query),
    searchNpm(query),
    searchSmithery(query),
  ]);

  const all: McpRegistryResult[] = [];
  if (officialResult.status === 'fulfilled') all.push(...officialResult.value);
  if (npmResult.status === 'fulfilled') all.push(...npmResult.value);
  if (smitheryResult.status === 'fulfilled') all.push(...smitheryResult.value);

  // Deduplicate by name (keep the one with highest score)
  const deduped = new Map<string, McpRegistryResult>();
  for (const item of all) {
    const key = item.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
      deduped.set(key, item);
    }
  }

  // Sort by score descending
  const results = [...deduped.values()].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  return NextResponse.json({
    results,
    smitheryAvailable: !!process.env.SMITHERY_API_KEY,
  });
}
