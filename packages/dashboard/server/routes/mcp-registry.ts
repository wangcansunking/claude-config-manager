import { Router } from 'express';
import { McpManager, getClaudeHome } from '@ccm/core';

const router = Router();
const mcpManager = new McpManager(getClaudeHome());

// ---------------------------------------------------------------------------
// Unified registry result type
// ---------------------------------------------------------------------------

interface McpRegistryResult {
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
// In-memory search cache (5 minute TTL)
// ---------------------------------------------------------------------------

const searchCache = new Map<string, { data: { results: McpRegistryResult[]; smitheryAvailable: boolean }; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// GET /api/mcp-registry?q=search-term
// ---------------------------------------------------------------------------

router.get('/', async (req, res, _next) => {
  const query = (req.query.q as string)?.trim();
  if (!query) {
    res.json({ results: [], smitheryAvailable: !!process.env.SMITHERY_API_KEY }); return;
  }

  // Check cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.json(cached.data); return;
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

  const responseData = {
    results,
    smitheryAvailable: !!process.env.SMITHERY_API_KEY,
  };

  // Cache result
  searchCache.set(query, { data: responseData, timestamp: Date.now() });

  res.json(responseData);
});

// ---------------------------------------------------------------------------
// GET /api/mcp-registry/top — returns top 20 MCP servers (npm popularity + official registry)
// ---------------------------------------------------------------------------

const topMcpCache: { data: { results: McpRegistryResult[]; smitheryAvailable: boolean } | null; timestamp: number } = { data: null, timestamp: 0 };
const TOP_MCP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get('/top', async (_req, res, _next) => {
  // Return cached if fresh
  if (topMcpCache.data && Date.now() - topMcpCache.timestamp < TOP_MCP_CACHE_TTL) {
    res.json(topMcpCache.data); return;
  }

  try {
    // Fetch from npm (popular MCP servers) and official registry in parallel
    const [npmResult, officialResult] = await Promise.allSettled([
      (async () => {
        const r = await fetch(
          'https://registry.npmjs.org/-/v1/search?text=mcp+server&size=20&popularity=1.0',
          { signal: AbortSignal.timeout(8000) },
        );
        if (!r.ok) return [];
        const data = (await r.json()) as {
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
        return data.objects.map((obj): McpRegistryResult => ({
          name: obj.package.name ?? 'unknown',
          description: obj.package.description ?? '',
          source: 'npm' as const,
          version: obj.package.version,
          npmUrl: obj.package.links?.npm,
          repositoryUrl: obj.package.links?.repository,
          installCommand: obj.package.name ? `npx -y ${obj.package.name}` : undefined,
          score: (obj.score?.final ?? 0.5) * 0.8,
        }));
      })(),
      (async () => {
        const r = await fetch(
          'https://registry.modelcontextprotocol.io/v0.1/servers?limit=20',
          { signal: AbortSignal.timeout(8000) },
        );
        if (!r.ok) return [];
        const data = (await r.json()) as {
          servers?: { name?: string; description?: string; repositoryUrl?: string }[];
        };
        if (!Array.isArray(data?.servers)) return [];
        return data.servers.map((s): McpRegistryResult => ({
          name: s.name ?? 'unknown',
          description: s.description ?? '',
          source: 'mcp-registry' as const,
          repositoryUrl: s.repositoryUrl,
          installCommand: s.name ? `npx -y ${s.name}` : undefined,
          score: 0.9,
        }));
      })(),
    ]);

    const all: McpRegistryResult[] = [];
    if (npmResult.status === 'fulfilled') all.push(...npmResult.value);
    if (officialResult.status === 'fulfilled') all.push(...officialResult.value);

    // Deduplicate by name (keep the one with highest score)
    const deduped = new Map<string, McpRegistryResult>();
    for (const item of all) {
      const key = item.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
        deduped.set(key, item);
      }
    }

    // Sort by score descending, take top 20
    const results = [...deduped.values()]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 20);

    const responseData = {
      results,
      smitheryAvailable: !!process.env.SMITHERY_API_KEY,
    };

    topMcpCache.data = responseData;
    topMcpCache.timestamp = Date.now();

    res.json(responseData);
  } catch (err) {
    console.error('[GET /api/mcp-registry/top]', err);
    // Try returning stale cache if available
    if (topMcpCache.data) {
      res.json(topMcpCache.data); return;
    }
    res.json({ results: [], smitheryAvailable: !!process.env.SMITHERY_API_KEY });
  }
});

// ---------------------------------------------------------------------------
// POST /api/mcp-registry/install
// ---------------------------------------------------------------------------

router.post('/install', async (req, res, next) => {
  try {
    const { name, command, args, env } = req.body as {
      name?: string;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Missing required field: name' }); return;
    }
    if (!command || typeof command !== 'string') {
      res.status(400).json({ error: 'Missing required field: command' }); return;
    }
    if (args !== undefined && !Array.isArray(args)) {
      res.status(400).json({ error: 'Field args must be an array' }); return;
    }

    const config: { command: string; args?: string[]; env?: Record<string, string> } = { command };
    if (args && args.length > 0) config.args = args;
    if (env && Object.keys(env).length > 0) config.env = env;

    await mcpManager.add(name, config);

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as mcpRegistryRouter };
