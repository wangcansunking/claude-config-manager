import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ProfileManager } from '../../managers/profile-manager';
import { NotFoundError, ValidationError } from '@ccm/types';

const SAMPLE_SETTINGS = {
  model: 'claude-opus-4',
  mcpServers: {
    'azure-devops': { command: 'npx', args: ['-y', 'azure-devops-mcp'] },
  },
  enabledPlugins: {
    'superpowers@official': true,
  },
  hooks: {
    PreToolUse: [{ command: 'echo', args: ['pre'] }],
  },
};

const SAMPLE_PLUGINS_JSON = {
  version: 2,
  plugins: {
    'superpowers@official': [
      {
        installPath: '/home/user/.claude/plugins/superpowers',
        version: '5.0.5',
        installedAt: '2026-01-01T00:00:00Z',
        lastUpdated: '2026-03-01T00:00:00Z',
      },
    ],
  },
};

describe('ProfileManager', () => {
  let tempDir: string;
  let manager: ProfileManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'profile-manager-test-'));
    await mkdir(join(tempDir, 'plugins', 'profiles'), { recursive: true });
    manager = new ProfileManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function writeSettingsJson(data: unknown = SAMPLE_SETTINGS): Promise<void> {
    await writeFile(join(tempDir, 'settings.json'), JSON.stringify(data));
  }

  async function writePluginsJson(data: unknown = SAMPLE_PLUGINS_JSON): Promise<void> {
    await writeFile(join(tempDir, 'plugins', 'installed_plugins.json'), JSON.stringify(data));
  }

  async function createProfileFile(name: string, data: unknown): Promise<void> {
    await writeFile(join(tempDir, 'plugins', 'profiles', `${name}.json`), JSON.stringify(data));
  }

  const sampleProfileData = {
    name: 'work',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    plugins: [],
    mcpServers: {},
    settings: { model: 'claude-opus-4' },
    hooks: {},
    commands: [],
  };

  describe('list', () => {
    it('returns an empty array when profiles directory is empty', async () => {
      const profiles = await manager.list();
      expect(profiles).toEqual([]);
    });

    it('lists all profile files excluding active.json', async () => {
      await createProfileFile('work', sampleProfileData);
      await createProfileFile('personal', { ...sampleProfileData, name: 'personal' });
      await writeFile(
        join(tempDir, 'plugins', 'profiles', 'active.json'),
        JSON.stringify({ name: 'work' }),
      );
      const profiles = await manager.list();
      expect(profiles).toHaveLength(2);
      const names = profiles.map((p) => p.name);
      expect(names).toContain('work');
      expect(names).toContain('personal');
      expect(names).not.toContain('active');
    });

    it('includes createdAt and updatedAt in summaries', async () => {
      await createProfileFile('work', sampleProfileData);
      const profiles = await manager.list();
      expect(profiles[0]?.createdAt).toBe('2026-01-01T00:00:00Z');
      expect(profiles[0]?.updatedAt).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('create', () => {
    it('creates a profile snapshot from current settings', async () => {
      await writeSettingsJson();
      await writePluginsJson();
      const profile = await manager.create('work');
      expect(profile.name).toBe('work');
      expect(profile.settings).toMatchObject(SAMPLE_SETTINGS);
    });

    it('includes installed plugins in the profile', async () => {
      await writeSettingsJson();
      await writePluginsJson();
      const profile = await manager.create('work');
      expect(profile.plugins).toHaveLength(1);
      expect(profile.plugins[0]?.name).toBe('superpowers@official');
    });

    it('includes mcpServers from settings', async () => {
      await writeSettingsJson();
      const profile = await manager.create('work');
      expect(profile.mcpServers['azure-devops']).toBeDefined();
    });

    it('saves the profile to a file', async () => {
      await writeSettingsJson();
      await manager.create('work');
      const profiles = await manager.list();
      expect(profiles.some((p) => p.name === 'work')).toBe(true);
    });

    it('creates a profile even when no settings or plugins exist', async () => {
      const profile = await manager.create('empty');
      expect(profile.name).toBe('empty');
      expect(profile.plugins).toEqual([]);
    });
  });

  describe('activate', () => {
    it('applies profile settings to settings.json', async () => {
      await createProfileFile('work', sampleProfileData);
      await manager.activate('work');
      const { readJsonFile } = await import('../../utils/file-ops');
      const settings = (await readJsonFile(join(tempDir, 'settings.json'))) as Record<
        string,
        unknown
      >;
      expect(settings['model']).toBe('claude-opus-4');
    });

    it('updates active.json with the activated profile name', async () => {
      await createProfileFile('work', sampleProfileData);
      await manager.activate('work');
      const active = await manager.getActive();
      expect(active).toBe('work');
    });

    it('throws NotFoundError when profile does not exist', async () => {
      await expect(manager.activate('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deletes a profile file', async () => {
      await createProfileFile('work', sampleProfileData);
      await manager.delete('work');
      const profiles = await manager.list();
      expect(profiles.some((p) => p.name === 'work')).toBe(false);
    });

    it('clears active.json when deleting the active profile', async () => {
      await createProfileFile('work', sampleProfileData);
      await manager.activate('work');
      await manager.delete('work');
      const active = await manager.getActive();
      expect(active).toBeNull();
    });

    it('throws NotFoundError when profile does not exist', async () => {
      await expect(manager.delete('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('does not clear active.json when deleting a non-active profile', async () => {
      await createProfileFile('work', sampleProfileData);
      await createProfileFile('personal', { ...sampleProfileData, name: 'personal' });
      await manager.activate('work');
      await manager.delete('personal');
      const active = await manager.getActive();
      expect(active).toBe('work');
    });
  });

  describe('getActive', () => {
    it('returns null when no active profile is set', async () => {
      const active = await manager.getActive();
      expect(active).toBeNull();
    });

    it('returns the active profile name', async () => {
      await createProfileFile('work', sampleProfileData);
      await manager.activate('work');
      const active = await manager.getActive();
      expect(active).toBe('work');
    });
  });

  describe('exportProfile', () => {
    it('throws NotFoundError when profile does not exist', async () => {
      await expect(manager.exportProfile('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('exports a profile as a JSON string', async () => {
      await createProfileFile('work', sampleProfileData);
      const exported = await manager.exportProfile('work');
      const data = JSON.parse(exported);
      expect(data.version).toBe('1.0');
      expect(data.name).toBe('work');
    });

    it('includes plugins, mcpServers, settings in export', async () => {
      await createProfileFile('work', {
        ...sampleProfileData,
        plugins: [
          {
            name: 'superpowers@official',
            version: '1.0.0',
            marketplace: 'official',
            enabled: true,
            installPath: '/path',
            installedAt: '2026-01-01T00:00:00Z',
            lastUpdated: '2026-01-01T00:00:00Z',
          },
        ],
        mcpServers: { 'azure-devops': { command: 'npx', args: [] } },
      });
      const exported = await manager.exportProfile('work');
      const data = JSON.parse(exported);
      expect(data.plugins.installed).toHaveLength(1);
      expect(data.plugins.enabled['superpowers@official']).toBe(true);
      expect(data.mcpServers['azure-devops']).toBeDefined();
    });
  });

  describe('importProfile', () => {
    it('throws ValidationError on invalid JSON', async () => {
      await expect(manager.importProfile('not-json')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when name field is missing', async () => {
      await expect(manager.importProfile(JSON.stringify({ version: '1.0' }))).rejects.toThrow(
        ValidationError,
      );
    });

    it('imports a profile in ProfileExport format', async () => {
      const exportData = {
        version: '1.0',
        name: 'imported',
        createdAt: '2026-01-01T00:00:00Z',
        plugins: { installed: [], enabled: {} },
        mcpServers: {},
        settings: { model: 'claude-3-sonnet' },
        hooks: {},
        commands: [],
      };
      const profile = await manager.importProfile(JSON.stringify(exportData));
      expect(profile.name).toBe('imported');
      expect(profile.settings['model']).toBe('claude-3-sonnet');
    });

    it('imports and saves the profile so it appears in list()', async () => {
      const exportData = {
        version: '1.0',
        name: 'from-export',
        createdAt: '2026-01-01T00:00:00Z',
        plugins: { installed: [], enabled: {} },
        mcpServers: {},
        settings: {},
        hooks: {},
        commands: [],
      };
      await manager.importProfile(JSON.stringify(exportData));
      const profiles = await manager.list();
      expect(profiles.some((p) => p.name === 'from-export')).toBe(true);
    });

    it('merges settings when strategy is merge', async () => {
      await createProfileFile('existing', {
        ...sampleProfileData,
        name: 'existing',
        settings: { model: 'old-model', theme: 'dark' },
      });
      const importData = {
        name: 'existing',
        createdAt: '2026-01-01T00:00:00Z',
        plugins: [],
        mcpServers: {},
        settings: { model: 'new-model' },
        hooks: {},
        commands: [],
      };
      const profile = await manager.importProfile(JSON.stringify(importData), 'merge');
      expect(profile.settings['model']).toBe('new-model');
      expect(profile.settings['theme']).toBe('dark');
    });
  });
});
