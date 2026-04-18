import { Router } from 'express';
import { SkillScanner, getClaudeHome } from '@ccm/core';
import { writeFile } from 'fs/promises';

const router = Router();

// GET /api/skills
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const skills = await new SkillScanner(home).scan();
    // Strip content from response to reduce payload size
    const lightweight = skills.map(({ content: _content, ...rest }) => rest);
    res.json(lightweight);
  } catch (err) {
    console.error('[GET /api/skills]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/skills/content?path=
router.get('/content', async (req, res) => {
  const filePath = req.query.path as string | undefined;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  try {
    const scanner = new SkillScanner(getClaudeHome());
    const content = await scanner.getSkillContent(filePath);
    res.json({ content });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// ---------------------------------------------------------------------------
// skills.sh integration — uses public HTTP API at https://skills.sh/api/search
// ---------------------------------------------------------------------------

interface SkillResult {
  name: string;
  installs: string;
  url: string;
  installCommand: string;
}

interface SkillsShApiEntry {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface SkillsShApiResponse {
  query: string;
  searchType: string;
  skills: SkillsShApiEntry[];
}

function formatInstalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M installs`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K installs`;
  return `${n} install${n !== 1 ? 's' : ''}`;
}

function toSkillResult(entry: SkillsShApiEntry): SkillResult {
  const handle = `${entry.source}@${entry.skillId}`;
  return {
    name: handle,
    installs: formatInstalls(entry.installs),
    url: `https://skills.sh/${entry.source}/${entry.skillId}`,
    installCommand: `npx skills add ${handle}`,
  };
}

async function fetchFromSkillsSh(query: string, signal?: AbortSignal): Promise<SkillResult[]> {
  const url = `https://skills.sh/api/search?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) {
    throw new Error(`skills.sh returned ${resp.status}`);
  }
  const data = (await resp.json()) as SkillsShApiResponse;
  return (data.skills ?? []).map(toSkillResult);
}

// Cache search results for 5 minutes
const searchCache = new Map<string, { data: SkillResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

router.get('/search', async (req, res) => {
  const query = (req.query.q as string) ?? '';
  if (query.trim().length < 2) {
    return res.json([]);
  }

  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const results = await fetchFromSkillsSh(query);
    searchCache.set(query, { data: results, timestamp: Date.now() });
    res.json(results);
  } catch (err) {
    console.error('[GET /api/skills/search]', err);
    res.status(502).json({ error: 'Failed to fetch from skills.sh', skills: [] });
  }
});

// GET /api/skills/top — merges several broad queries to produce a diverse Top list
const topCache: { data: SkillResult[] | null; timestamp: number } = { data: null, timestamp: 0 };
const TOP_CACHE_TTL = 10 * 60 * 1000;
const TOP_QUERIES = ['agent', 'code', 'react', 'python', 'typescript', 'git', 'test'];

router.get('/top', async (_req, res) => {
  if (topCache.data && Date.now() - topCache.timestamp < TOP_CACHE_TTL) {
    return res.json(topCache.data);
  }

  try {
    const batches = await Promise.all(
      TOP_QUERIES.map((q) =>
        fetchFromSkillsSh(q).catch((err) => {
          console.warn(`[skills/top] query "${q}" failed:`, err);
          return [] as SkillResult[];
        }),
      ),
    );

    // Merge by name (unique), sort by installs count (reparsed from the formatted string)
    const byName = new Map<string, SkillResult>();
    for (const batch of batches) {
      for (const r of batch) {
        if (!byName.has(r.name)) byName.set(r.name, r);
      }
    }

    const merged = Array.from(byName.values());
    merged.sort((a, b) => parseInstallsForSort(b.installs) - parseInstallsForSort(a.installs));
    const top = merged.slice(0, 20);

    if (top.length > 0) {
      topCache.data = top;
      topCache.timestamp = Date.now();
    }
    res.json(top);
  } catch (err) {
    console.error('[GET /api/skills/top]', err);
    if (topCache.data) return res.json(topCache.data);
    res.status(502).json({ error: 'Failed to fetch top skills', skills: [] });
  }
});

function parseInstallsForSort(s: string): number {
  const match = s.match(/^([\d.]+)\s*([KM]?)/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (match[2] === 'M') return n * 1_000_000;
  if (match[2] === 'K') return n * 1_000;
  return n;
}

// POST /api/skills/update
router.post('/update', async (req, res) => {
  try {
    const { filePath, content } = req.body as { filePath?: string; content?: string };

    if (!filePath || !content) {
      return res.status(400).json({ error: 'Missing required fields: filePath, content' });
    }

    // Security: only allow writing to ~/.claude/skills/ and ~/.claude/commands/
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.includes('/.claude/skills/') && !normalizedPath.includes('/.claude/commands/')) {
      return res.status(403).json({ error: 'Cannot edit system files' });
    }

    await writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/skills/update]', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

export { router as skillsRouter };
