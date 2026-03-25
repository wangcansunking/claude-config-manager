import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { PluginManager } from '../../managers/plugin-manager';

const SAMPLE_PLUGINS_JSON = {
  version: 2,
  plugins: {
    'superpowers@claude-plugins-official': [
      {
        scope: 'user',
        installPath: '/home/user/.claude/plugins/cache/superpowers',
        version: '5.0.5',
        installedAt: '2026-02-05T07:25:01Z',
        lastUpdated: '2026-03-24T02:26:39Z',
        gitCommitSha: '06b92f36',
      },
    ],
    'devtools@claude-plugins-official': [
      {
        scope: 'user',
        installPath: '/home/user/.claude/plugins/cache/devtools',
        version: '2.1.0',
        installedAt: '2026-01-10T10:00:00Z',
        lastUpdated: '2026-02-20T08:00:00Z',
        gitCommitSha: 'abc12345',
      },
    ],
  },
};

const SAMPLE_SETTINGS_JSON = {
  model: 'claude-opus-4',
  enabledPlugins: {
    'superpowers@claude-plugins-official': true,
    'devtools@claude-plugins-official': false,
  },
};

describe('PluginManager', () => {
  let tempDir: string;
  let manager: PluginManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'plugin-manager-test-'));
    await mkdir(join(tempDir, 'plugins'), { recursive: true });
    manager = new PluginManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function writePluginsJson(data: unknown = SAMPLE_PLUGINS_JSON): Promise<void> {
    await writeFile(join(tempDir, 'plugins', 'installed_plugins.json'), JSON.stringify(data));
  }

  async function writeSettingsJson(data: unknown = SAMPLE_SETTINGS_JSON): Promise<void> {
    await writeFile(join(tempDir, 'settings.json'), JSON.stringify(data));
  }

  describe('list', () => {
    it('returns an empty array when no plugins are installed', async () => {
      const entries = await manager.list();
      expect(entries).toEqual([]);
    });

    it('returns all installed plugins with enabled status', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      const entries = await manager.list();
      expect(entries).toHaveLength(2);
      const superpowers = entries.find((e) => e.name === 'superpowers@claude-plugins-official');
      expect(superpowers).toBeDefined();
      expect(superpowers?.enabled).toBe(true);
      expect(superpowers?.version).toBe('5.0.5');
      const devtools = entries.find((e) => e.name === 'devtools@claude-plugins-official');
      expect(devtools?.enabled).toBe(false);
    });

    it('defaults enabled to false when not in enabledPlugins', async () => {
      await writePluginsJson();
      // No settings.json
      const entries = await manager.list();
      expect(entries.every((e) => e.enabled === false)).toBe(true);
    });

    it('includes installPath and timestamps', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      const entries = await manager.list();
      const sp = entries.find((e) => e.name === 'superpowers@claude-plugins-official');
      expect(sp?.installPath).toBe('/home/user/.claude/plugins/cache/superpowers');
      expect(sp?.installedAt).toBe('2026-02-05T07:25:01Z');
      expect(sp?.lastUpdated).toBe('2026-03-24T02:26:39Z');
    });
  });

  describe('getDetail', () => {
    it('returns null when plugin is not found', async () => {
      await writePluginsJson();
      const detail = await manager.getDetail('nonexistent');
      expect(detail).toBeNull();
    });

    it('finds a plugin by exact full name', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      const detail = await manager.getDetail('superpowers@claude-plugins-official');
      expect(detail).not.toBeNull();
      expect(detail?.name).toBe('superpowers@claude-plugins-official');
      expect(detail?.enabled).toBe(true);
    });

    it('finds a plugin by partial name (prefix before @)', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      const detail = await manager.getDetail('superpowers');
      expect(detail).not.toBeNull();
      expect(detail?.name).toBe('superpowers@claude-plugins-official');
    });

    it('returns null when no plugins file exists', async () => {
      const detail = await manager.getDetail('superpowers');
      expect(detail).toBeNull();
    });
  });

  describe('toggle', () => {
    it('enables a disabled plugin', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.toggle('devtools@claude-plugins-official', true);
      const detail = await manager.getDetail('devtools@claude-plugins-official');
      expect(detail?.enabled).toBe(true);
    });

    it('disables an enabled plugin', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.toggle('superpowers@claude-plugins-official', false);
      const detail = await manager.getDetail('superpowers@claude-plugins-official');
      expect(detail?.enabled).toBe(false);
    });

    it('preserves other settings when toggling', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.toggle('superpowers', true);
      // Check settings.json still has model
      const { readJsonFile } = await import('../../utils/file-ops');
      const settings = (await readJsonFile(join(tempDir, 'settings.json'))) as Record<
        string,
        unknown
      >;
      expect(settings['model']).toBe('claude-opus-4');
    });
  });

  describe('remove', () => {
    it('removes a plugin from installed_plugins.json', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.remove('superpowers@claude-plugins-official');
      const installed = await manager.isInstalled('superpowers@claude-plugins-official');
      expect(installed).toBe(false);
    });

    it('removes a plugin by partial name', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.remove('superpowers');
      const installed = await manager.isInstalled('superpowers@claude-plugins-official');
      expect(installed).toBe(false);
    });

    it('removes plugin from enabledPlugins in settings.json', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.remove('superpowers@claude-plugins-official');
      const entries = await manager.list();
      const sp = entries.find((e) => e.name === 'superpowers@claude-plugins-official');
      expect(sp).toBeUndefined();
    });

    it('leaves other plugins intact after removal', async () => {
      await writePluginsJson();
      await writeSettingsJson();
      await manager.remove('superpowers@claude-plugins-official');
      const entries = await manager.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.name).toBe('devtools@claude-plugins-official');
    });
  });

  describe('isInstalled', () => {
    it('returns true for an installed plugin', async () => {
      await writePluginsJson();
      const installed = await manager.isInstalled('superpowers@claude-plugins-official');
      expect(installed).toBe(true);
    });

    it('returns true for an installed plugin by partial name', async () => {
      await writePluginsJson();
      const installed = await manager.isInstalled('superpowers');
      expect(installed).toBe(true);
    });

    it('returns false for a non-installed plugin', async () => {
      await writePluginsJson();
      const installed = await manager.isInstalled('nonexistent');
      expect(installed).toBe(false);
    });

    it('returns false when no plugins file exists', async () => {
      const installed = await manager.isInstalled('superpowers');
      expect(installed).toBe(false);
    });
  });
});
