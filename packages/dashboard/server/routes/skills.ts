import { Router } from 'express';
import { SkillScanner, getClaudeHome } from '@ccm/core';
import { writeFile } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const exec = promisify(execFile);

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

// GET /api/skills/search?q=
interface SkillResult {
  name: string;
  installs: string;
  url: string;
  installCommand: string;
}

// Cache search results for 5 minutes
const searchCache = new Map<string, { data: SkillResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

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

router.get('/search', async (req, res) => {
  const query = (req.query.q as string) ?? '';
  if (!query.trim()) {
    return res.json([]);
  }

  // Check cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    // Use locally installed skills package (faster than npx)
    const skillsBin = resolve(process.cwd(), '..', '..', 'node_modules', 'skills', 'bin', 'cli.mjs');
    const { stdout } = await exec('node', [skillsBin, 'find', query], {
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });

    const results = parseSkillsOutput(stdout);
    searchCache.set(query, { data: results, timestamp: Date.now() });
    res.json(results);
  } catch (err) {
    console.error('[GET /api/skills/search]', err);
    res.json([]);
  }
});

// GET /api/skills/top — returns top 20 skills from skills.sh
const topCache: { data: SkillResult[] | null; timestamp: number } = { data: null, timestamp: 0 };
const TOP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get('/top', async (_req, res) => {
  // Return cached if fresh
  if (topCache.data && Date.now() - topCache.timestamp < TOP_CACHE_TTL) {
    return res.json(topCache.data);
  }

  try {
    const skillsBin = resolve(process.cwd(), '..', '..', 'node_modules', 'skills', 'bin', 'cli.mjs');
    const { stdout } = await exec('node', [skillsBin, 'find', 'popular'], {
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });

    const results = parseSkillsOutput(stdout).slice(0, 20);
    topCache.data = results;
    topCache.timestamp = Date.now();
    res.json(results);
  } catch (err) {
    console.error('[GET /api/skills/top]', err);
    // Try returning stale cache if available
    if (topCache.data) {
      return res.json(topCache.data);
    }
    res.json([]);
  }
});

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
