import { Router } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import {
  RecommendationManager,
  PluginManager,
  McpManager,
  SkillScanner,
  MarketplaceManager,
  getClaudeHome,
} from '@ccm/core';
import type { Recommendation, AvailablePlugin } from '@ccm/core';

const exec = promisify(execFile);
const router = Router();

// GET /api/recommendations
router.get('/', async (_req, res) => {
  try {
    const mgr = new RecommendationManager(getClaudeHome());
    const cached = await mgr.getCached();
    if (cached) {
      return res.json(cached);
    }
    res.json({ recommendations: [], generatedAt: null, model: null });
  } catch (err) {
    console.error('[GET /api/recommendations]', err);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

// POST /api/recommendations
router.post('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const mgr = new RecommendationManager(home);

    // Get what's already installed (fail-safe each)
    const [installedPlugins, installedMcps, installedSkills] = await Promise.all([
      safeList(() => new PluginManager(home).list()),
      safeList(() => new McpManager(home).list()),
      safeList(() => new SkillScanner(home).scan()),
    ]);

    const installedPluginNames = new Set(
      installedPlugins.map((p) => String(p.name).split('@')[0]),
    );
    const installedMcpNames = new Set(installedMcps.map((m) => String(m.name)));
    const installedSkillNames = new Set(installedSkills.map((s) => String(s.name)));

    // Fetch data in parallel from real sources
    const [topSkillsRes, trendingSkillsRes, topMcpsRes, trendingMcpsRes, marketplacePluginsRes] =
      await Promise.allSettled([
        fetchTopSkills(),
        fetchTrendingSkills(),
        fetchTopMcps(),
        fetchTrendingMcps(),
        fetchMarketplacePlugins(home),
      ]);

    const topSkills = topSkillsRes.status === 'fulfilled' ? topSkillsRes.value : [];
    const trendingSkills =
      trendingSkillsRes.status === 'fulfilled' ? trendingSkillsRes.value : [];
    const topMcps = topMcpsRes.status === 'fulfilled' ? topMcpsRes.value : [];
    const trendingMcps =
      trendingMcpsRes.status === 'fulfilled' ? trendingMcpsRes.value : [];
    const marketplacePlugins =
      marketplacePluginsRes.status === 'fulfilled' ? marketplacePluginsRes.value : [];

    // Split plugins into Top/Trending (first half = top by order, second half = trending).
    // Marketplace results are already sorted by the marketplace's ordering which is
    // typically "popular first". Use simple halving for variety.
    const sortedPlugins = marketplacePlugins.slice();
    const halfIdx = Math.ceil(sortedPlugins.length / 2);
    const topPluginsSource = sortedPlugins.slice(0, halfIdx);
    const trendingPluginsSource = sortedPlugins.slice(halfIdx);

    // Build recommendations — 10 per bucket, 6 buckets = up to 60
    const recommendations: Recommendation[] = [];
    recommendations.push(...buildSkillRecs(topSkills, 'Top', installedSkillNames));
    recommendations.push(...buildSkillRecs(trendingSkills, 'Trending', installedSkillNames));
    recommendations.push(...buildMcpRecs(topMcps, 'Top', installedMcpNames));
    recommendations.push(...buildMcpRecs(trendingMcps, 'Trending', installedMcpNames));
    recommendations.push(
      ...buildPluginRecs(topPluginsSource, 'Top', installedPluginNames),
    );
    recommendations.push(
      ...buildPluginRecs(trendingPluginsSource, 'Trending', installedPluginNames),
    );

    // If a category came up empty (fetch failed + nothing left), top up with static
    // recommendations for that type so we never return too few.
    const staticRecs = getStaticRecommendations();
    const typesWithAny = new Set(recommendations.map((r) => r.type));
    for (const type of ['skill', 'mcp', 'plugin'] as const) {
      if (!typesWithAny.has(type)) {
        for (const rec of staticRecs.filter((r) => r.type === type)) {
          recommendations.push(rec);
        }
      }
    }

    const result = {
      recommendations,
      generatedAt: new Date().toISOString(),
      model: 'generated-v2',
    };

    await mgr.saveCache(result);
    res.json(result);
  } catch (err) {
    console.error('[POST /api/recommendations]', err);
    // On error return static as fallback
    const staticRecs = getStaticRecommendations();
    res.json({
      recommendations: staticRecs,
      generatedAt: new Date().toISOString(),
      model: 'static-fallback',
    });
  }
});

// ---------------------------------------------------------------------------
// Helpers — safe list wrapper
// ---------------------------------------------------------------------------

async function safeList<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Skills — via skills.sh CLI
// ---------------------------------------------------------------------------

interface SkillResult {
  name: string;
  installs: string;
  url: string;
  installCommand: string;
}

function parseSkillsOutput(output: string): SkillResult[] {
  const results: SkillResult[] = [];
  const lines = output
    .split('\n')
    .map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match either "owner/repo@skill" or "owner@skill" (skills.sh allows both)
    const match = line?.match(
      /^([\w\-.]+(?:\/[\w\-.]+)?@[\w\-.:]+)\s+([\d.]+[KMB]?\s+installs?)$/,
    );
    if (match) {
      const name = match[1] ?? '';
      const installs = match[2] ?? '';
      const urlLine = lines[i + 1] ?? '';
      const urlMatch = urlLine.match(/(https:\/\/skills\.sh\/\S+)/);
      const url = urlMatch ? urlMatch[1] : `https://skills.sh/${name.replace('@', '/')}`;
      results.push({
        name,
        installs,
        url,
        installCommand: `npx skills add ${name}`,
      });
      i++;
    }
  }
  return results;
}

async function runSkillsFind(query: string): Promise<SkillResult[]> {
  const skillsBin = resolve(
    process.cwd(),
    '..',
    '..',
    'node_modules',
    'skills',
    'bin',
    'cli.mjs',
  );
  const { stdout } = await exec('node', [skillsBin, 'find', query], {
    timeout: 15000,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  return parseSkillsOutput(stdout);
}

async function runSkillsFindMany(queries: string[]): Promise<SkillResult[]> {
  const settled = await Promise.allSettled(queries.map((q) => runSkillsFind(q)));
  const all: SkillResult[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') all.push(...s.value);
  }
  return dedupeByName(all);
}

async function fetchTopSkills(): Promise<SkillResult[]> {
  // The skills.sh CLI typically returns only a handful of results per query.
  // Aggregate across multiple "popular" style queries to reach >= 10.
  return runSkillsFindMany(['popular', 'skills', 'best-practices', 'code']);
}

async function fetchTrendingSkills(): Promise<SkillResult[]> {
  return runSkillsFindMany(['trending', 'new', 'agents', 'test']);
}

function skillCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/test|playwright|e2e|vitest|jest/.test(lower)) return 'testing';
  if (/react|vue|frontend|ui|design|css|tailwind/.test(lower)) return 'design';
  if (/azure|aws|gcp|kubernetes|docker|devops|cicd/.test(lower)) return 'devops';
  if (/db|sql|database|postgres|mongo/.test(lower)) return 'database';
  if (/ai|llm|prompt|agent/.test(lower)) return 'ai';
  return 'development';
}

function buildSkillRecs(
  results: SkillResult[],
  popularity: 'Top' | 'Trending',
  installed: Set<string>,
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const s of results) {
    if (recs.length >= 10) break;
    const bare = s.name.split('@')[0] ?? s.name;
    if (installed.has(s.name) || installed.has(bare)) continue;
    const installs = s.installs || '';
    const reason =
      popularity === 'Top'
        ? `Among the most-installed skills${installs ? ` (${installs})` : ''}`
        : `Currently trending on skills.sh${installs ? ` (${installs})` : ''}`;
    recs.push({
      name: s.name,
      type: 'skill',
      description: `Skill from ${s.name.split('@')[0]}`,
      reason,
      popularity,
      installCommand: s.installCommand,
      url: s.url,
      category: skillCategory(s.name),
    });
  }
  return recs;
}

// ---------------------------------------------------------------------------
// MCP Servers — from npm + official registry
// ---------------------------------------------------------------------------

interface McpSource {
  name: string;
  description: string;
  url?: string;
  installCommand?: string;
  category?: string;
}

interface NpmSearchResponse {
  objects?: {
    package: {
      name?: string;
      description?: string;
      version?: string;
      keywords?: string[];
      links?: { npm?: string; repository?: string; homepage?: string };
    };
    score?: { final?: number };
  }[];
}

interface McpRegistryResponse {
  servers?: {
    name?: string;
    description?: string;
    repositoryUrl?: string;
  }[];
}

function mcpCategoryFromName(name: string, description: string): string {
  const lower = `${name} ${description}`.toLowerCase();
  if (/sql|postgres|mysql|mongo|redis|sqlite|database/.test(lower)) return 'database';
  if (/docker|kubernetes|aws|azure|gcp|devops|deploy/.test(lower)) return 'devops';
  if (/github|git|gitlab|linear|jira|notion/.test(lower)) return 'productivity';
  if (/test|playwright|browser|selenium/.test(lower)) return 'testing';
  if (/ai|llm|model|agent|prompt/.test(lower)) return 'ai';
  return 'development';
}

async function fetchNpmMcps(sortParam: string): Promise<McpSource[]> {
  const url = `https://registry.npmjs.org/-/v1/search?text=mcp+server&size=30&${sortParam}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return [];
  const data = (await r.json()) as NpmSearchResponse;
  if (!Array.isArray(data.objects)) return [];
  return data.objects
    .map((obj): McpSource | null => {
      const name = obj.package.name;
      if (!name) return null;
      return {
        name,
        description: obj.package.description ?? '',
        url: obj.package.links?.repository ?? obj.package.links?.npm,
        installCommand: `npx -y ${name}`,
        category: mcpCategoryFromName(name, obj.package.description ?? ''),
      };
    })
    .filter((v): v is McpSource => v !== null);
}

async function fetchOfficialMcps(): Promise<McpSource[]> {
  const r = await fetch(
    'https://registry.modelcontextprotocol.io/v0.1/servers?limit=30',
    { signal: AbortSignal.timeout(10000) },
  );
  if (!r.ok) return [];
  const data = (await r.json()) as McpRegistryResponse;
  if (!Array.isArray(data.servers)) return [];
  return data.servers
    .map((s): McpSource | null => {
      if (!s.name) return null;
      return {
        name: s.name,
        description: s.description ?? '',
        url: s.repositoryUrl,
        installCommand: `npx -y ${s.name}`,
        category: mcpCategoryFromName(s.name, s.description ?? ''),
      };
    })
    .filter((v): v is McpSource => v !== null);
}

async function fetchTopMcps(): Promise<McpSource[]> {
  // Popular: npm sorted by popularity + the official registry (authoritative)
  const [npmRes, officialRes] = await Promise.allSettled([
    fetchNpmMcps('popularity=1.0'),
    fetchOfficialMcps(),
  ]);
  const merged: McpSource[] = [];
  if (officialRes.status === 'fulfilled') merged.push(...officialRes.value);
  if (npmRes.status === 'fulfilled') merged.push(...npmRes.value);
  return dedupeByName(merged);
}

async function fetchTrendingMcps(): Promise<McpSource[]> {
  // Trending: newer packages (quality-weighted)
  return fetchNpmMcps('quality=1.0');
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function buildMcpRecs(
  results: McpSource[],
  popularity: 'Top' | 'Trending',
  installed: Set<string>,
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const m of results) {
    if (recs.length >= 10) break;
    if (installed.has(m.name)) continue;
    // Also skip if bare (without scope) matches
    const bare = m.name.replace(/^@[^/]+\//, '');
    if (installed.has(bare)) continue;
    const reason =
      popularity === 'Top'
        ? 'Widely used MCP server across the community'
        : 'Trending MCP server gaining traction';
    recs.push({
      name: m.name,
      type: 'mcp',
      description: m.description || `MCP server: ${m.name}`,
      reason,
      popularity,
      installCommand: m.installCommand ?? `npx -y ${m.name}`,
      url: m.url,
      category: m.category ?? 'development',
    });
  }
  return recs;
}

// ---------------------------------------------------------------------------
// Plugins — from configured marketplaces
// ---------------------------------------------------------------------------

interface PluginSource {
  name: string;
  description: string;
  marketplace: string;
  url?: string;
  category?: string;
}

async function fetchMarketplacePlugins(home: string): Promise<PluginSource[]> {
  const mm = new MarketplaceManager(home);
  let marketplaces: { name: string }[] = [];
  try {
    marketplaces = await mm.listMarketplaces();
  } catch {
    return [];
  }
  if (marketplaces.length === 0) return [];

  const allPlugins: PluginSource[] = [];
  const perMarketplace = await Promise.allSettled(
    marketplaces.map(async (m) => {
      try {
        const plugins = await mm.listAvailablePlugins(m.name);
        return plugins.map((p: AvailablePlugin): PluginSource => ({
          name: p.name,
          description: p.description || `Plugin from ${m.name}`,
          marketplace: m.name,
          url: p.homepage,
          category: p.category ?? 'development',
        }));
      } catch {
        return [];
      }
    }),
  );
  for (const r of perMarketplace) {
    if (r.status === 'fulfilled') {
      allPlugins.push(...r.value);
    }
  }
  return dedupeByName(allPlugins);
}

function buildPluginRecs(
  results: PluginSource[],
  popularity: 'Top' | 'Trending',
  installed: Set<string>,
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const p of results) {
    if (recs.length >= 10) break;
    if (installed.has(p.name)) continue;
    const reason =
      popularity === 'Top'
        ? `Top plugin from the ${p.marketplace} marketplace`
        : `Trending plugin from the ${p.marketplace} marketplace`;
    recs.push({
      name: p.name,
      type: 'plugin',
      description: p.description,
      reason,
      popularity,
      installCommand: `/plugin install ${p.name}@${p.marketplace}`,
      url: p.url,
      category: p.category ?? 'development',
    });
  }
  return recs;
}

// ---------------------------------------------------------------------------
// Static fallback recommendations
// ---------------------------------------------------------------------------

function getStaticRecommendations(): Recommendation[] {
  return [
    // Skills (5)
    { name: 'vercel-labs/agent-skills@vercel-react-best-practices', type: 'skill', description: 'React best practices from Vercel — components, hooks, performance', reason: 'Most popular skill with 320K+ installs', popularity: 'Trending', installCommand: 'npx skills add vercel-labs/agent-skills@vercel-react-best-practices', url: 'https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices', category: 'development' },
    { name: 'anthropic-labs/agent-skills@frontend-design', type: 'skill', description: 'Create distinctive, production-grade frontend interfaces', reason: 'Official Anthropic skill for UI development', popularity: 'Popular', installCommand: 'npx skills add anthropic-labs/agent-skills@frontend-design', url: 'https://skills.sh/anthropic-labs/agent-skills/frontend-design', category: 'design' },
    { name: 'google-labs-code/stitch-skills@react:components', type: 'skill', description: 'Google Stitch design system — React component generation', reason: 'Generate consistent UI with Google design patterns', popularity: 'Trending', installCommand: 'npx skills add google-labs-code/stitch-skills@react:components', url: 'https://skills.sh/google-labs-code/stitch-skills/react:components', category: 'design' },
    { name: 'microsoft/agent-skills@azure-best-practices', type: 'skill', description: 'Azure cloud development best practices and patterns', reason: 'Complements your Azure DevOps workflow', popularity: 'Popular', installCommand: 'npx skills add microsoft/agent-skills@azure-best-practices', url: 'https://skills.sh/microsoft/agent-skills/azure-best-practices', category: 'devops' },
    { name: 'anthropic-labs/agent-skills@test-web-app', type: 'skill', description: 'Automated web app testing with Playwright', reason: 'Enhance your Playwright testing workflow', popularity: 'Rising', installCommand: 'npx skills add anthropic-labs/agent-skills@test-web-app', url: 'https://skills.sh/anthropic-labs/agent-skills/test-web-app', category: 'testing' },
    // MCP Servers (5)
    { name: '@modelcontextprotocol/server-filesystem', type: 'mcp', description: 'File system access for AI agents — read, write, search files', reason: 'Essential for any development workflow', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-filesystem', url: 'https://github.com/modelcontextprotocol/servers', category: 'development' },
    { name: '@modelcontextprotocol/server-github', type: 'mcp', description: 'GitHub integration — PRs, issues, repos, code search', reason: 'Integrate GitHub directly into your Claude workflow', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-github', url: 'https://github.com/modelcontextprotocol/servers', category: 'development' },
    { name: 'mcp-server-sqlite', type: 'mcp', description: 'SQLite database access — query, create, modify databases', reason: 'Useful for local data management and prototyping', popularity: 'Trending', installCommand: 'npx -y mcp-server-sqlite', url: 'https://github.com/modelcontextprotocol/servers', category: 'database' },
    { name: 'sequential-thinking', type: 'mcp', description: 'Dynamic thought chain for complex problem solving', reason: 'Improve reasoning on complex tasks', popularity: 'Rising', installCommand: 'npx -y @modelcontextprotocol/server-sequential-thinking', url: 'https://github.com/modelcontextprotocol/servers', category: 'ai' },
    { name: '@linear/mcp-server', type: 'mcp', description: 'Linear issue tracker integration', reason: 'Track issues and projects without leaving Claude', popularity: 'Trending', installCommand: 'npx -y @linear/mcp-server', url: 'https://github.com/linear/linear-mcp-server', category: 'productivity' },
    // Plugins (5)
    { name: 'stagehand', type: 'plugin', description: 'Browser automation — web interactions, data extraction', reason: 'Automate web tasks using natural language', popularity: 'Trending', installCommand: '/plugin install stagehand@claude-plugins-official', url: 'https://github.com/anthropics/claude-plugins-official', category: 'development' },
    { name: 'docker-mcp', type: 'mcp', description: 'Docker container management from Claude', reason: 'Manage containers directly from coding sessions', popularity: 'New', installCommand: 'npx -y docker-mcp', url: 'https://github.com/ckreiling/mcp-server-docker', category: 'devops' },
    { name: 'notion', type: 'mcp', description: 'Notion workspace integration — pages, databases, search', reason: 'Access your Notion knowledge base from Claude', popularity: 'Popular', installCommand: 'npx -y @notionhq/notion-mcp-server', url: 'https://github.com/makenotion/notion-mcp-server', category: 'productivity' },
    { name: 'sentry', type: 'mcp', description: 'Sentry error tracking integration', reason: 'Debug production issues faster with Sentry data', popularity: 'Rising', installCommand: 'npx -y @sentry/mcp-server-sentry', url: 'https://github.com/getsentry/sentry-mcp-server', category: 'devops' },
    { name: 'postgres', type: 'mcp', description: 'PostgreSQL database access and management', reason: 'Query and manage your databases from Claude', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-postgres', url: 'https://github.com/modelcontextprotocol/servers', category: 'database' },
  ];
}

export { router as recommendationsRouter };
