import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { McpManager } from '../../managers/mcp-manager';
import { ConflictError, NotFoundError } from '@ccm/types';
import { readJsonFile } from '../../utils/file-ops';

const SAMPLE_MCP_JSON = {
  mcpServers: {
    'azure-devops': { command: 'npx', args: ['-y', 'azure-devops-mcp'] },
    'github': { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
  },
};

describe('McpManager', () => {
  let tempDir: string;
  let manager: McpManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mcp-manager-test-'));
    manager = new McpManager(tempDir);
    // Isolate from real OneDrive configs
    vi.stubEnv('OneDrive', '');
    vi.stubEnv('OneDriveCommercial', '');
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(tempDir, { recursive: true, force: true });
  });

  async function writeMcpJson(data: unknown = SAMPLE_MCP_JSON): Promise<void> {
    await writeFile(join(tempDir, '.mcp.json'), JSON.stringify(data));
  }

  describe('list', () => {
    it('returns an empty array when no .mcp.json exists', async () => {
      const entries = await manager.list();
      expect(entries).toEqual([]);
    });

    it('returns an empty array when mcpServers is not set', async () => {
      await writeMcpJson({});
      const entries = await manager.list();
      expect(entries).toEqual([]);
    });

    it('returns all configured MCP servers', async () => {
      await writeMcpJson();
      const entries = await manager.list();
      expect(entries).toHaveLength(2);
      const names = entries.map((e) => e.name);
      expect(names).toContain('azure-devops');
      expect(names).toContain('github');
    });

    it('includes command and args in the config', async () => {
      await writeMcpJson();
      const entries = await manager.list();
      const azureEntry = entries.find((e) => e.name === 'azure-devops');
      expect(azureEntry?.config.command).toBe('npx');
      expect(azureEntry?.config.args).toEqual(['-y', 'azure-devops-mcp']);
    });

    it('also reads plugin .mcp.json files', async () => {
      // Set up an installed plugin with .mcp.json
      const pluginsDir = join(tempDir, 'plugins');
      await mkdir(pluginsDir, { recursive: true });

      const pluginPath = join(tempDir, 'plugins', 'cache', 'official', 'context7', '1.0.0');
      await mkdir(pluginPath, { recursive: true });
      await writeFile(join(pluginPath, '.mcp.json'), JSON.stringify({
        mcpServers: {
          'context7': { command: 'npx', args: ['-y', 'context7-mcp'] },
        },
      }));

      await writeFile(join(pluginsDir, 'installed_plugins.json'), JSON.stringify({
        version: 2,
        plugins: {
          'context7@official': [{
            installPath: pluginPath,
            version: '1.0.0',
          }],
        },
      }));

      const entries = await manager.list();
      expect(entries.some(e => e.name === 'context7')).toBe(true);
    });
  });

  describe('add', () => {
    it('adds a new MCP server to .mcp.json', async () => {
      await writeMcpJson();
      await manager.add('my-server', { command: 'node', args: ['server.js'] });
      const detail = await manager.getDetail('my-server');
      expect(detail).not.toBeNull();
      expect(detail?.config.command).toBe('node');
    });

    it('throws ConflictError when server already exists', async () => {
      await writeMcpJson();
      await expect(
        manager.add('azure-devops', { command: 'npx', args: ['-y', 'other'] }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates .mcp.json if it does not exist', async () => {
      await manager.add('new-server', { command: 'npx', args: ['-y', 'some-mcp'] });
      const entries = await manager.list();
      const userEntries = entries.filter(e => e.name === 'new-server');
      expect(userEntries).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('removes an existing MCP server', async () => {
      await writeMcpJson();
      await manager.remove('azure-devops');
      const entries = await manager.list();
      expect(entries.find(e => e.name === 'azure-devops')).toBeUndefined();
    });

    it('throws NotFoundError when server does not exist', async () => {
      await writeMcpJson();
      await expect(manager.remove('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('leaves other servers intact after removal', async () => {
      await writeMcpJson();
      await manager.remove('azure-devops');
      const entries = await manager.list();
      expect(entries.some(e => e.name === 'github')).toBe(true);
    });
  });

  describe('getDetail', () => {
    it('returns null for a non-existent server', async () => {
      await writeMcpJson();
      const detail = await manager.getDetail('nonexistent');
      expect(detail).toBeNull();
    });

    it('returns the server entry for an existing server', async () => {
      await writeMcpJson();
      const detail = await manager.getDetail('github');
      expect(detail).not.toBeNull();
      expect(detail?.name).toBe('github');
      expect(detail?.config.command).toBe('npx');
    });

    it('returns null when no .mcp.json exists', async () => {
      const detail = await manager.getDetail('azure-devops');
      expect(detail).toBeNull();
    });
  });

  describe('toggle', () => {
    it('writes enabledMcpServers[name] = false in settings.json', async () => {
      await writeMcpJson();
      await manager.toggle('azure-devops', false);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledMcpServers: { 'azure-devops': false } });
    });

    it('writes enabledMcpServers[name] = true in settings.json', async () => {
      await writeMcpJson();
      await manager.toggle('github', true);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledMcpServers: { github: true } });
    });

    it('list() reflects the disabled state', async () => {
      await writeMcpJson();
      await manager.toggle('azure-devops', false);
      const list = await manager.list();
      const entry = list.find((e) => e.name === 'azure-devops');
      expect(entry?.enabled).toBe(false);
    });

    it('re-enabling a server writes enabled=true to settings.json', async () => {
      await writeMcpJson();
      // Disable then re-enable — settings should reflect the latest state
      await manager.toggle('github', false);
      await manager.toggle('github', true);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({ enabledMcpServers: { github: true } });
    });

    it('preserves existing settings when toggling', async () => {
      await writeMcpJson();
      await writeFile(
        join(tempDir, 'settings.json'),
        JSON.stringify({ model: 'claude-3-5-sonnet' }),
      );
      await manager.toggle('github', false);
      const settings = await readJsonFile(join(tempDir, 'settings.json'));
      expect(settings).toMatchObject({
        model: 'claude-3-5-sonnet',
        enabledMcpServers: { github: false },
      });
    });
  });
});
