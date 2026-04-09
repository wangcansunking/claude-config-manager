import { join } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';
import type { InstalledPlugin, PluginListEntry } from '@ccm/types';

interface RawPluginEntry {
  scope?: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

interface InstalledPluginsJson {
  version: number;
  plugins: Record<string, RawPluginEntry[]>;
}

export class PluginManager {
  private readonly pluginsJsonPath: string;
  private readonly settingsPath: string;

  constructor(claudeHome: string) {
    this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
    this.settingsPath = join(claudeHome, 'settings.json');
  }

  private async readInstalledPlugins(): Promise<InstalledPluginsJson> {
    try {
      const data = await readJsonFile(this.pluginsJsonPath);
      return data as InstalledPluginsJson;
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return { version: 2, plugins: {} };
      }
      throw err;
    }
  }

  private async writeInstalledPlugins(data: InstalledPluginsJson): Promise<void> {
    await writeJsonFile(this.pluginsJsonPath, data);
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

  private async readEnabledPlugins(): Promise<Record<string, boolean>> {
    const settings = await this.readSettings();
    const ep = settings['enabledPlugins'];
    if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
      return ep as Record<string, boolean>;
    }
    return {};
  }

  private resolveFullName(
    plugins: Record<string, RawPluginEntry[]>,
    name: string,
  ): string | undefined {
    // Exact match first
    if (plugins[name]) return name;
    // Partial match: "superpowers" matches "superpowers@claude-plugins-official"
    const match = Object.keys(plugins).find(
      (key) => key === name || key.startsWith(`${name}@`) || key.endsWith(`@${name}`),
    );
    return match;
  }

  async list(): Promise<PluginListEntry[]> {
    const { plugins } = await this.readInstalledPlugins();
    const enabledPlugins = await this.readEnabledPlugins();

    const entries: PluginListEntry[] = [];
    for (const [fullName, installs] of Object.entries(plugins)) {
      const parts = fullName.split('@');
      const marketplace = parts[1] ?? '';
      // Use the first (most recent) install entry
      const install = installs[0];
      if (!install) continue;

      entries.push({
        name: fullName,
        version: install.version,
        marketplace,
        enabled: enabledPlugins[fullName] ?? false,
        installPath: install.installPath,
        installedAt: install.installedAt,
        lastUpdated: install.lastUpdated,
      });
    }
    return entries;
  }

  async getDetail(name: string): Promise<InstalledPlugin | null> {
    const { plugins } = await this.readInstalledPlugins();
    const enabledPlugins = await this.readEnabledPlugins();

    const fullName = this.resolveFullName(plugins, name);
    if (!fullName) return null;

    const installs = plugins[fullName];
    const install = installs?.[0];
    if (!install) return null;

    const parts = fullName.split('@');
    const marketplace = parts[1] ?? '';

    return {
      name: fullName,
      version: install.version,
      marketplace,
      enabled: enabledPlugins[fullName] ?? false,
      installPath: install.installPath,
      installedAt: install.installedAt,
      lastUpdated: install.lastUpdated,
    };
  }

  async toggle(name: string, enabled: boolean): Promise<void> {
    const { plugins } = await this.readInstalledPlugins();
    const fullName = this.resolveFullName(plugins, name) ?? name;
    const settings = await this.readSettings();
    const current = await this.readEnabledPlugins();
    await writeJsonFile(this.settingsPath, {
      ...settings,
      enabledPlugins: { ...current, [fullName]: enabled },
    });
  }

  async remove(name: string): Promise<void> {
    const data = await this.readInstalledPlugins();
    const fullName = this.resolveFullName(data.plugins, name) ?? name;

    // Remove from installed_plugins.json
    const { [fullName]: _removed, ...remaining } = data.plugins;
    await this.writeInstalledPlugins({ ...data, plugins: remaining });

    // Remove from settings.json enabledPlugins
    const settings = await this.readSettings();
    const enabledPlugins = await this.readEnabledPlugins();
    const { [fullName]: _ep, ...remainingEp } = enabledPlugins;
    await writeJsonFile(this.settingsPath, { ...settings, enabledPlugins: remainingEp });
  }

  async isInstalled(name: string): Promise<boolean> {
    const { plugins } = await this.readInstalledPlugins();
    return this.resolveFullName(plugins, name) !== undefined;
  }
}
