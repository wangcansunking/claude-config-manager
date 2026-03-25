import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { McpManager } from '../../managers/mcp-manager';
import { ConflictError, NotFoundError } from '@ccm/types';

const SAMPLE_SETTINGS = {
  model: 'claude-opus-4',
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
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function writeSettingsJson(data: unknown = SAMPLE_SETTINGS): Promise<void> {
    await writeFile(join(tempDir, 'settings.json'), JSON.stringify(data));
  }

  describe('list', () => {
    it('returns an empty array when no settings.json exists', async () => {
      const entries = await manager.list();
      expect(entries).toEqual([]);
    });

    it('returns an empty array when mcpServers is not set', async () => {
      await writeSettingsJson({ model: 'claude-opus-4' });
      const entries = await manager.list();
      expect(entries).toEqual([]);
    });

    it('returns all configured MCP servers', async () => {
      await writeSettingsJson();
      const entries = await manager.list();
      expect(entries).toHaveLength(2);
      const names = entries.map((e) => e.name);
      expect(names).toContain('azure-devops');
      expect(names).toContain('github');
    });

    it('includes command and args in the config', async () => {
      await writeSettingsJson();
      const entries = await manager.list();
      const azureEntry = entries.find((e) => e.name === 'azure-devops');
      expect(azureEntry?.config.command).toBe('npx');
      expect(azureEntry?.config.args).toEqual(['-y', 'azure-devops-mcp']);
    });
  });

  describe('add', () => {
    it('adds a new MCP server', async () => {
      await writeSettingsJson();
      await manager.add('my-server', { command: 'node', args: ['server.js'] });
      const detail = await manager.getDetail('my-server');
      expect(detail).not.toBeNull();
      expect(detail?.config.command).toBe('node');
    });

    it('throws ConflictError when server already exists', async () => {
      await writeSettingsJson();
      await expect(
        manager.add('azure-devops', { command: 'npx', args: ['-y', 'other'] }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates settings.json if it does not exist', async () => {
      await manager.add('new-server', { command: 'npx', args: ['-y', 'some-mcp'] });
      const entries = await manager.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.name).toBe('new-server');
    });

    it('preserves other settings when adding a server', async () => {
      await writeSettingsJson();
      await manager.add('new-server', { command: 'npx', args: [] });
      const { readJsonFile } = await import('../../utils/file-ops');
      const settings = (await readJsonFile(join(tempDir, 'settings.json'))) as Record<
        string,
        unknown
      >;
      expect(settings['model']).toBe('claude-opus-4');
    });
  });

  describe('remove', () => {
    it('removes an existing MCP server', async () => {
      await writeSettingsJson();
      await manager.remove('azure-devops');
      const detail = await manager.getDetail('azure-devops');
      expect(detail).toBeNull();
    });

    it('throws NotFoundError when server does not exist', async () => {
      await writeSettingsJson();
      await expect(manager.remove('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('leaves other servers intact after removal', async () => {
      await writeSettingsJson();
      await manager.remove('azure-devops');
      const entries = await manager.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.name).toBe('github');
    });
  });

  describe('getDetail', () => {
    it('returns null for a non-existent server', async () => {
      await writeSettingsJson();
      const detail = await manager.getDetail('nonexistent');
      expect(detail).toBeNull();
    });

    it('returns the server entry for an existing server', async () => {
      await writeSettingsJson();
      const detail = await manager.getDetail('github');
      expect(detail).not.toBeNull();
      expect(detail?.name).toBe('github');
      expect(detail?.config.command).toBe('npx');
    });

    it('returns null when no settings.json exists', async () => {
      const detail = await manager.getDetail('azure-devops');
      expect(detail).toBeNull();
    });
  });
});
