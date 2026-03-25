import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ProfileManager } from '../../managers/profile-manager';
import { ConfigManager } from '../../managers/config-manager';
import { PluginManager } from '../../managers/plugin-manager';

const FIXTURE_SETTINGS = {
  model: 'claude-opus-4',
  env: {
    API_KEY: 'test-key',
    DEBUG: 'true',
  },
  mcpServers: {
    'azure-devops': { command: 'npx', args: ['-y', 'azure-devops-mcp'] },
  },
  enabledPlugins: {
    'superpowers@official': true,
  },
};

const FIXTURE_PLUGINS_JSON = {
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

describe('Integration: Profile export → import roundtrip', () => {
  let sourceDir: string;
  let destDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), 'ccm-integration-src-'));
    destDir = await mkdtemp(join(tmpdir(), 'ccm-integration-dst-'));

    // Set up source directory structure
    await mkdir(join(sourceDir, 'plugins', 'profiles'), { recursive: true });
    await mkdir(join(destDir, 'plugins', 'profiles'), { recursive: true });

    // Write fixture files in source dir
    await writeFile(join(sourceDir, 'settings.json'), JSON.stringify(FIXTURE_SETTINGS));
    await writeFile(
      join(sourceDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(FIXTURE_PLUGINS_JSON),
    );
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(destDir, { recursive: true, force: true });
  });

  it('exports and imports a profile with matching data', async () => {
    const sourceManager = new ProfileManager(sourceDir);
    const destManager = new ProfileManager(destDir);

    // Create a profile in the source dir
    const originalProfile = await sourceManager.create('work');
    expect(originalProfile.name).toBe('work');
    expect(originalProfile.settings['model']).toBe('claude-opus-4');
    expect(originalProfile.plugins).toHaveLength(1);

    // Export the profile
    const exported = await sourceManager.exportProfile('work');
    const exportedData = JSON.parse(exported);
    expect(exportedData.version).toBe('1.0');
    expect(exportedData.name).toBe('work');

    // Import into the destination (fresh) claude home
    const importedProfile = await destManager.importProfile(exported);
    expect(importedProfile.name).toBe('work');
    expect(importedProfile.settings['model']).toBe('claude-opus-4');

    // Verify the imported profile appears in the destination's list
    const profiles = await destManager.list();
    expect(profiles.some((p) => p.name === 'work')).toBe(true);
  });

  it('roundtrip preserves mcpServers', async () => {
    const sourceManager = new ProfileManager(sourceDir);
    const destManager = new ProfileManager(destDir);

    await sourceManager.create('work');
    const exported = await sourceManager.exportProfile('work');
    const importedProfile = await destManager.importProfile(exported);

    expect(importedProfile.mcpServers['azure-devops']).toBeDefined();
    expect(importedProfile.mcpServers['azure-devops']?.command).toBe('npx');
  });

  it('roundtrip preserves plugin list', async () => {
    const sourceManager = new ProfileManager(sourceDir);
    const destManager = new ProfileManager(destDir);

    await sourceManager.create('work');
    const exported = await sourceManager.exportProfile('work');
    const importedProfile = await destManager.importProfile(exported);

    expect(importedProfile.plugins).toHaveLength(1);
    expect(importedProfile.plugins[0]?.name).toBe('superpowers@official');
  });

  it('roundtrip preserves env vars in settings', async () => {
    const sourceManager = new ProfileManager(sourceDir);
    const destManager = new ProfileManager(destDir);

    await sourceManager.create('work');
    const exported = await sourceManager.exportProfile('work');
    const importedProfile = await destManager.importProfile(exported);

    const env = importedProfile.settings['env'] as Record<string, string>;
    expect(env['API_KEY']).toBe('test-key');
    expect(env['DEBUG']).toBe('true');
  });
});

describe('Integration: ConfigManager + PluginManager', () => {
  let tempDir: string;
  let configManager: ConfigManager;
  let pluginManager: PluginManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccm-integration-mgr-'));
    await mkdir(join(tempDir, 'plugins'), { recursive: true });
    configManager = new ConfigManager(tempDir);
    pluginManager = new PluginManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('ConfigManager sets model and env vars which persist', async () => {
    await configManager.setModel('claude-opus-4');
    await configManager.setEnvVar('MY_KEY', 'my-value');

    const model = await configManager.getModel();
    const env = await configManager.getEnvVars();

    expect(model).toBe('claude-opus-4');
    expect(env['MY_KEY']).toBe('my-value');
  });

  it('PluginManager reflects enabledPlugins after ConfigManager writes settings', async () => {
    // Write initial settings with plugins via ConfigManager
    await configManager.updateSettings({
      enabledPlugins: {
        'superpowers@official': true,
        'devtools@official': false,
      },
    });

    // Write installed_plugins.json
    const pluginsJson = {
      version: 2,
      plugins: {
        'superpowers@official': [
          {
            installPath: '/path/superpowers',
            version: '1.0.0',
            installedAt: '2026-01-01T00:00:00Z',
            lastUpdated: '2026-03-01T00:00:00Z',
          },
        ],
        'devtools@official': [
          {
            installPath: '/path/devtools',
            version: '2.0.0',
            installedAt: '2026-01-01T00:00:00Z',
            lastUpdated: '2026-03-01T00:00:00Z',
          },
        ],
      },
    };
    await writeFile(
      join(tempDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify(pluginsJson),
    );

    const entries = await pluginManager.list();
    const superpowers = entries.find((e) => e.name === 'superpowers@official');
    const devtools = entries.find((e) => e.name === 'devtools@official');

    expect(superpowers?.enabled).toBe(true);
    expect(devtools?.enabled).toBe(false);
  });

  it('toggling a plugin via PluginManager updates settings.json', async () => {
    await configManager.updateSettings({
      enabledPlugins: { 'superpowers@official': false },
    });

    await writeFile(
      join(tempDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify({
        version: 2,
        plugins: {
          'superpowers@official': [
            {
              installPath: '/path/superpowers',
              version: '1.0.0',
              installedAt: '2026-01-01T00:00:00Z',
              lastUpdated: '2026-03-01T00:00:00Z',
            },
          ],
        },
      }),
    );

    // Toggle on
    await pluginManager.toggle('superpowers@official', true);

    // ConfigManager should now see enabledPlugins updated
    const settings = await configManager.getSettings();
    const enabledPlugins = settings['enabledPlugins'] as Record<string, boolean>;
    expect(enabledPlugins['superpowers@official']).toBe(true);
  });

  it('model setting persists after plugin toggle', async () => {
    await configManager.setModel('claude-opus-4');

    await writeFile(
      join(tempDir, 'plugins', 'installed_plugins.json'),
      JSON.stringify({
        version: 2,
        plugins: {
          'superpowers@official': [
            {
              installPath: '/path/superpowers',
              version: '1.0.0',
              installedAt: '2026-01-01T00:00:00Z',
              lastUpdated: '2026-03-01T00:00:00Z',
            },
          ],
        },
      }),
    );

    await pluginManager.toggle('superpowers@official', true);

    // Model should still be set
    const model = await configManager.getModel();
    expect(model).toBe('claude-opus-4');
  });
});
