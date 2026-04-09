import { join, dirname } from 'path';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { ConflictError, NotFoundError } from '@ccm/types';
import type { McpServerConfig, McpServerEntry } from '@ccm/types';

export class McpManager {
  private readonly claudeHome: string;
  private readonly mcpJsonPath: string;

  constructor(claudeHome: string) {
    this.claudeHome = claudeHome;
    this.mcpJsonPath = join(claudeHome, '.mcp.json');
  }

  /**
   * Parse a .mcp.json file — supports both formats:
   *   { "mcpServers": { "name": { command, args } } }
   *   { "name": { "command": "...", "args": [...] } }
   */
  private parseMcpJson(raw: Record<string, unknown>): Record<string, McpServerConfig> {
    const result: Record<string, McpServerConfig> = {};
    if (raw?.mcpServers && typeof raw.mcpServers === 'object') {
      const servers = raw.mcpServers as Record<string, unknown>;
      for (const [name, val] of Object.entries(servers)) {
        if (val && typeof val === 'object') {
          result[name] = val as McpServerConfig;
        }
      }
    } else {
      for (const [name, val] of Object.entries(raw)) {
        if (val && typeof val === 'object' && ('command' in val || 'url' in val || 'type' in val)) {
          result[name] = val as McpServerConfig;
        }
      }
    }
    return result;
  }

  /**
   * Try reading and parsing a .mcp.json at a given path
   */
  private async readMcpJsonAt(path: string): Promise<Record<string, McpServerConfig>> {
    try {
      if (!(await fileExists(path))) return {};
      const raw = (await readJsonFile(path)) as Record<string, unknown>;
      return this.parseMcpJson(raw);
    } catch {
      return {};
    }
  }

  /**
   * Collect all .mcp.json search paths with their source:
   * 1. ~/.claude.json — user (Claude Code's main config)
   * 2. ~/.claude/.mcp.json — user (user-level MCP config)
   * 3. Plugin .mcp.json files — system
   */
  private async collectAllMcpPaths(): Promise<{ path: string; source: 'user' | 'system' }[]> {
    const paths: { path: string; source: 'user' | 'system' }[] = [];
    const homedir = dirname(this.claudeHome); // parent of .claude = home dir

    // 1. ~/.claude.json — Claude Code's main config (mcpServers field)
    //    PS-installed MCPs (metagraph, azure, workiq, etc.) go here
    paths.push({ path: join(homedir, '.claude.json'), source: 'user' });

    // 2. ~/.claude/.mcp.json — user-level MCP config
    paths.push({ path: this.mcpJsonPath, source: 'user' });

    // 3. Plugin .mcp.json files
    const pluginPaths = await this.getPluginMcpPaths();
    paths.push(...pluginPaths.map((p) => ({ path: p, source: 'system' as const })));

    return paths;
  }

  private async getPluginMcpPaths(): Promise<string[]> {
    const paths: string[] = [];
    const installedPath = join(this.claudeHome, 'plugins', 'installed_plugins.json');

    try {
      const raw = await readJsonFile(installedPath);
      const installed = raw as { plugins?: Record<string, unknown[]> };
      if (!installed?.plugins) return paths;

      for (const [_key, entries] of Object.entries(installed.plugins)) {
        if (!Array.isArray(entries) || entries.length === 0) continue;
        const entry = entries[0] as { installPath?: string };
        if (!entry.installPath) continue;
        paths.push(join(entry.installPath, '.mcp.json'));
      }
    } catch {
      // ignore
    }

    return paths;
  }

  private async readAllMcpServers(): Promise<Record<string, { config: McpServerConfig; source: 'user' | 'system' }>> {
    const allPaths = await this.collectAllMcpPaths();
    const merged: Record<string, { config: McpServerConfig; source: 'user' | 'system' }> = {};

    for (const { path, source } of allPaths) {
      const servers = await this.readMcpJsonAt(path);
      for (const [name, config] of Object.entries(servers)) {
        merged[name] = { config, source };
      }
    }

    return merged;
  }

  async list(): Promise<McpServerEntry[]> {
    const servers = await this.readAllMcpServers();
    return Object.entries(servers).map(([name, { config, source }]) => ({ name, config, source }));
  }

  async add(name: string, config: McpServerConfig): Promise<void> {
    const userServers = await this.readMcpJsonAt(this.mcpJsonPath);
    if (userServers[name] !== undefined) {
      throw new ConflictError(`MCP server already exists: ${name}`);
    }
    // Also check if it exists in any other source
    const allServers = await this.readAllMcpServers();
    if (allServers[name] !== undefined) {
      throw new ConflictError(`MCP server already exists (from plugin or sync): ${name}`);
    }
    const mcpJson = await this.readMcpJsonAt(this.mcpJsonPath);
    await writeJsonFile(this.mcpJsonPath, {
      mcpServers: { ...mcpJson, [name]: config },
    });
  }

  async remove(name: string): Promise<void> {
    const userServers = await this.readMcpJsonAt(this.mcpJsonPath);
    if (userServers[name] === undefined) {
      throw new NotFoundError('MCP server', name);
    }
    const { [name]: _removed, ...remaining } = userServers;
    await writeJsonFile(this.mcpJsonPath, { mcpServers: remaining });
  }

  async getDetail(name: string): Promise<McpServerEntry | null> {
    const servers = await this.readAllMcpServers();
    const entry = servers[name];
    if (entry === undefined) return null;
    return { name, config: entry.config, source: entry.source };
  }
}
