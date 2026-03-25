import { join } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/file-ops';
import { FileNotFoundError, ConflictError, NotFoundError } from '@ccm/types';
import type { McpServerConfig, McpServerEntry } from '@ccm/types';

export class McpManager {
  private readonly settingsPath: string;

  constructor(claudeHome: string) {
    this.settingsPath = join(claudeHome, 'settings.json');
  }

  private async readSettings(): Promise<Record<string, unknown>> {
    try {
      const data = await readJsonFile(this.settingsPath);
      return (data as Record<string, unknown>) ?? {};
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return {};
      }
      throw err;
    }
  }

  private async readMcpServers(): Promise<Record<string, McpServerConfig>> {
    const settings = await this.readSettings();
    const servers = settings['mcpServers'];
    if (servers !== null && typeof servers === 'object' && !Array.isArray(servers)) {
      return servers as Record<string, McpServerConfig>;
    }
    return {};
  }

  async list(): Promise<McpServerEntry[]> {
    const servers = await this.readMcpServers();
    return Object.entries(servers).map(([name, config]) => ({ name, config }));
  }

  async add(name: string, config: McpServerConfig): Promise<void> {
    const settings = await this.readSettings();
    const servers = await this.readMcpServers();
    if (servers[name] !== undefined) {
      throw new ConflictError(`MCP server already exists: ${name}`);
    }
    await writeJsonFile(this.settingsPath, {
      ...settings,
      mcpServers: { ...servers, [name]: config },
    });
  }

  async remove(name: string): Promise<void> {
    const settings = await this.readSettings();
    const servers = await this.readMcpServers();
    if (servers[name] === undefined) {
      throw new NotFoundError('MCP server', name);
    }
    const { [name]: _removed, ...remaining } = servers;
    await writeJsonFile(this.settingsPath, { ...settings, mcpServers: remaining });
  }

  async getDetail(name: string): Promise<McpServerEntry | null> {
    const servers = await this.readMcpServers();
    const config = servers[name];
    if (config === undefined) return null;
    return { name, config };
  }
}
