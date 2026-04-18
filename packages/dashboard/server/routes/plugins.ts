import { Router } from 'express';
import { PluginManager, SkillScanner, getClaudeHome } from '@ccm/core';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileExists } from '@ccm/core';

const router = Router();

interface McpServerSummary {
  name: string;
  type: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

interface RawMcpServerConfig {
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

async function readPluginMcpServers(installPath: string): Promise<McpServerSummary[]> {
  const mcpPath = join(installPath, '.mcp.json');
  if (!(await fileExists(mcpPath))) return [];
  try {
    const raw = await readFile(mcpPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Support both formats:
    //   { "mcpServers": { "name": {...} } }   — current Claude Code schema
    //   { "name": {...} }                     — legacy flat format (still in the wild)
    const wrapped = parsed['mcpServers'];
    const servers: Record<string, RawMcpServerConfig> =
      wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)
        ? (wrapped as Record<string, RawMcpServerConfig>)
        : (parsed as Record<string, RawMcpServerConfig>);

    return Object.entries(servers).map(([name, cfg]) => {
      const type: 'stdio' | 'http' = cfg.type === 'http' || cfg.url ? 'http' : 'stdio';
      return {
        name,
        type,
        command: cfg.command,
        args: cfg.args,
        env: cfg.env,
        url: cfg.url,
      };
    });
  } catch (err) {
    console.warn(`[plugin-contents] failed to parse ${mcpPath}:`, err);
    return [];
  }
}

// GET /api/plugins
router.get('/', async (_req, res) => {
  try {
    const home = getClaudeHome();
    const plugins = await new PluginManager(home).list();
    res.json(plugins);
  } catch (err) {
    console.error('[GET /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plugins
router.post('/', async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    // Install is a stub — actual installation requires CLI tooling
    res.status(501).json({
      message: `Plugin installation for "${name}" is not yet supported via the dashboard.`,
    });
  } catch (err) {
    console.error('[POST /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/plugins/:name
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const home = getClaudeHome();
    await new PluginManager(home).remove(decodeURIComponent(name));
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/plugins/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plugins/:name/contents — scan what this plugin provides
router.get('/:name/contents', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const home = getClaudeHome();
    const plugin = await new PluginManager(home).getDetail(name);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const scanner = new SkillScanner(home);
    const [rawSkills, mcpServers] = await Promise.all([
      scanner.scanPlugin(plugin.installPath).catch((err) => {
        console.warn(`[plugin-contents] scanPlugin failed for ${name}:`, err);
        return [];
      }),
      readPluginMcpServers(plugin.installPath),
    ]);

    // Commands: scan <installPath>/commands — supports both patterns:
    //   commands/<name>/Skill.md  (structured)
    //   commands/<name>.md        (flat — e.g. superpowers)
    const { readdir } = await import('fs/promises');
    const commands: Array<{ name: string; description?: string; filePath: string }> = [];
    const commandsDir = join(plugin.installPath, 'commands');
    if (await fileExists(commandsDir)) {
      try {
        const entries = await readdir(commandsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillFile = join(commandsDir, entry.name, 'Skill.md');
            if (!(await fileExists(skillFile))) continue;
            const content = await readFile(skillFile, 'utf-8');
            const fm = parseFrontmatterNameDesc(content);
            commands.push({ name: fm.name ?? entry.name, description: fm.description, filePath: skillFile });
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const mdFile = join(commandsDir, entry.name);
            const content = await readFile(mdFile, 'utf-8');
            const fm = parseFrontmatterNameDesc(content);
            const baseName = entry.name.replace(/\.md$/, '');
            commands.push({ name: fm.name ?? baseName, description: fm.description, filePath: mdFile });
          }
        }
      } catch (err) {
        console.warn(`[plugin-contents] failed to scan commands for ${name}:`, err);
      }
    }

    const skills = rawSkills.map((s) => ({
      name: s.name,
      description: s.description,
      filePath: s.filePath,
    }));

    res.json({
      plugin: name,
      version: plugin.version,
      commands,
      skills,
      mcpServers,
    });
  } catch (err) {
    console.error('[GET /api/plugins/:name/contents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Minimal frontmatter parser (name + description) for inline command scan.
function parseFrontmatterNameDesc(content: string): { name?: string; description?: string } {
  const match = /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return {};
  const block = match[1] ?? '';
  const result: Record<string, string> = {};
  let currentKey: string | null = null;
  for (const line of block.split(/\r?\n/)) {
    const keyMatch = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (keyMatch) {
      currentKey = keyMatch[1];
      result[currentKey] = (keyMatch[2] ?? '').trim();
    } else if (currentKey && line.trim()) {
      result[currentKey] = `${result[currentKey]} ${line.trim()}`.trim();
    }
  }
  return { name: result['name'], description: result['description'] };
}

// PATCH /api/plugins/:name
router.patch('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Missing required field: enabled (boolean)' });
    }
    const home = getClaudeHome();
    await new PluginManager(home).toggle(decodeURIComponent(name), enabled);
    res.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/plugins/:name]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as pluginsRouter };
