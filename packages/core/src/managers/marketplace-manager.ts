import { join } from 'path';
import { readdir, mkdir } from 'fs/promises';
import { simpleGit } from 'simple-git';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';

export interface MarketplaceInfo {
  name: string;
  source: { source: string; repo: string };
  installLocation: string;
  lastUpdated: string;
}

export interface AvailablePlugin {
  name: string;
  description: string;
  version: string;
  installed: boolean;
  enabled: boolean;
  marketplace: string;
  category?: string;
  homepage?: string;
}

interface KnownMarketplaceEntry {
  source: { source: string; repo: string };
  installLocation: string;
  lastUpdated: string;
}

type KnownMarketplacesJson = Record<string, KnownMarketplaceEntry>;

interface MarketplaceManifestPlugin {
  name: string;
  description?: string;
  version?: string;
  category?: string;
  homepage?: string;
  source?: string | { source: string; [key: string]: unknown };
  author?: { name?: string; email?: string };
}

interface MarketplaceManifest {
  name: string;
  description?: string;
  plugins?: MarketplaceManifestPlugin[];
}

interface InstalledPluginsJson {
  version: number;
  plugins: Record<string, unknown[]>;
}

export class MarketplaceManager {
  private readonly knownMarketplacesPath: string;
  private readonly installedPluginsPath: string;
  private readonly settingsPath: string;

  constructor(private claudeHome: string) {
    this.knownMarketplacesPath = join(claudeHome, 'plugins', 'known_marketplaces.json');
    this.installedPluginsPath = join(claudeHome, 'plugins', 'installed_plugins.json');
    this.settingsPath = join(claudeHome, 'settings.json');
  }

  private async readKnownMarketplaces(): Promise<KnownMarketplacesJson> {
    try {
      const data = await readJsonFile(this.knownMarketplacesPath);
      return (data as KnownMarketplacesJson) ?? {};
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return {};
      }
      throw err;
    }
  }

  private async writeKnownMarketplaces(data: KnownMarketplacesJson): Promise<void> {
    await writeJsonFile(this.knownMarketplacesPath, data);
  }

  private async readInstalledPlugins(): Promise<InstalledPluginsJson> {
    try {
      const data = await readJsonFile(this.installedPluginsPath);
      return data as InstalledPluginsJson;
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return { version: 2, plugins: {} };
      }
      throw err;
    }
  }

  private async readEnabledPlugins(): Promise<Record<string, boolean>> {
    try {
      const settings = await readJsonFile(this.settingsPath);
      const s = settings as Record<string, unknown>;
      const ep = s['enabledPlugins'];
      if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
        return ep as Record<string, boolean>;
      }
      return {};
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return {};
      }
      throw err;
    }
  }

  async listMarketplaces(): Promise<MarketplaceInfo[]> {
    const data = await this.readKnownMarketplaces();
    return Object.entries(data).map(([name, entry]) => ({
      name,
      source: entry.source,
      installLocation: entry.installLocation,
      lastUpdated: entry.lastUpdated,
    }));
  }

  async addMarketplace(name: string, repo: string): Promise<void> {
    const data = await this.readKnownMarketplaces();
    if (data[name]) {
      throw new Error(`Marketplace "${name}" already exists`);
    }

    const installLocation = join(this.claudeHome, 'plugins', 'marketplaces', name);

    // Actually clone the repo so plugins are discoverable
    // repo can be "owner/repo" or a full URL
    const cloneUrl = repo.includes('://') || repo.startsWith('git@')
      ? repo
      : `https://github.com/${repo}.git`;

    try {
      await mkdir(join(this.claudeHome, 'plugins', 'marketplaces'), { recursive: true });
      const git = simpleGit();
      await git.clone(cloneUrl, installLocation, ['--depth', '1']);
    } catch (err) {
      throw new Error(
        `Failed to clone marketplace repo ${cloneUrl}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    data[name] = {
      source: { source: 'github', repo },
      installLocation,
      lastUpdated: new Date().toISOString(),
    };
    await this.writeKnownMarketplaces(data);
  }

  async refreshMarketplace(name: string): Promise<void> {
    const data = await this.readKnownMarketplaces();
    const entry = data[name];
    if (!entry) {
      throw new Error(`Marketplace "${name}" not found`);
    }
    try {
      const git = simpleGit(entry.installLocation);
      await git.pull();
      entry.lastUpdated = new Date().toISOString();
      await this.writeKnownMarketplaces(data);
    } catch (err) {
      throw new Error(
        `Failed to refresh marketplace ${name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async removeMarketplace(name: string): Promise<void> {
    const data = await this.readKnownMarketplaces();
    if (!data[name]) {
      throw new Error(`Marketplace "${name}" not found`);
    }
    // Remove the cloned directory (best effort)
    try {
      const { rm } = await import('fs/promises');
      await rm(data[name].installLocation, { recursive: true, force: true });
    } catch {
      // ignore — file may be locked or already gone
    }
    delete data[name];
    await this.writeKnownMarketplaces(data);
  }

  async listAvailablePlugins(marketplaceName: string): Promise<AvailablePlugin[]> {
    const marketplaces = await this.readKnownMarketplaces();
    const marketplace = marketplaces[marketplaceName];
    if (!marketplace) {
      throw new Error(`Marketplace "${marketplaceName}" not found`);
    }

    const installLocation = marketplace.installLocation;
    const installedPlugins = await this.readInstalledPlugins();
    const enabledPlugins = await this.readEnabledPlugins();

    // Build a set of installed plugin names for this marketplace
    const installedSet = new Set<string>();
    for (const key of Object.keys(installedPlugins.plugins)) {
      // Keys are like "pluginName@marketplaceName"
      const atIdx = key.indexOf('@');
      if (atIdx !== -1) {
        const mp = key.substring(atIdx + 1);
        const pName = key.substring(0, atIdx);
        if (mp === marketplaceName) {
          installedSet.add(pName);
        }
      }
    }

    // Try reading marketplace.json manifest first (primary source of truth)
    const manifestPath = join(installLocation, '.claude-plugin', 'marketplace.json');
    const hasManifest = await fileExists(manifestPath);

    if (hasManifest) {
      return this.listFromManifest(
        manifestPath,
        marketplaceName,
        installedSet,
        enabledPlugins,
      );
    }

    // Fallback: scan directories
    return this.listFromDirectories(
      installLocation,
      marketplaceName,
      installedSet,
      enabledPlugins,
    );
  }

  private async listFromManifest(
    manifestPath: string,
    marketplaceName: string,
    installedSet: Set<string>,
    enabledPlugins: Record<string, boolean>,
  ): Promise<AvailablePlugin[]> {
    const manifest = (await readJsonFile(manifestPath)) as MarketplaceManifest;
    const plugins: AvailablePlugin[] = [];

    for (const entry of manifest.plugins ?? []) {
      const fullName = `${entry.name}@${marketplaceName}`;
      const isInstalled = installedSet.has(entry.name);
      plugins.push({
        name: entry.name,
        description: entry.description ?? '',
        version: entry.version ?? 'latest',
        installed: isInstalled,
        enabled: isInstalled ? (enabledPlugins[fullName] ?? false) : false,
        marketplace: marketplaceName,
        category: entry.category,
        homepage: entry.homepage,
      });
    }

    return plugins;
  }

  private async listFromDirectories(
    installLocation: string,
    marketplaceName: string,
    installedSet: Set<string>,
    enabledPlugins: Record<string, boolean>,
  ): Promise<AvailablePlugin[]> {
    const plugins: AvailablePlugin[] = [];

    // Scan both /plugins/ and /external_plugins/ subdirectories
    for (const subdir of ['plugins', 'external_plugins']) {
      const dirPath = join(installLocation, subdir);
      const dirOk = await fileExists(dirPath);
      if (!dirOk) continue;

      let entries: string[];
      try {
        entries = await readdir(dirPath);
      } catch {
        continue;
      }

      for (const name of entries) {
        // Try reading package.json from the plugin dir
        const pkgPath = join(dirPath, name, 'package.json');
        const manifestPluginPath = join(dirPath, name, '.claude-plugin', 'plugin.json');

        let description = '';
        let version = 'latest';

        if (await fileExists(pkgPath)) {
          try {
            const pkg = (await readJsonFile(pkgPath)) as Record<string, unknown>;
            description = (pkg.description as string) ?? '';
            version = (pkg.version as string) ?? 'latest';
          } catch {
            // ignore parse errors
          }
        } else if (await fileExists(manifestPluginPath)) {
          try {
            const m = (await readJsonFile(manifestPluginPath)) as Record<string, unknown>;
            description = (m.description as string) ?? '';
            version = (m.version as string) ?? 'latest';
          } catch {
            // ignore parse errors
          }
        }

        const fullName = `${name}@${marketplaceName}`;
        const isInstalled = installedSet.has(name);
        plugins.push({
          name,
          description,
          version,
          installed: isInstalled,
          enabled: isInstalled ? (enabledPlugins[fullName] ?? false) : false,
          marketplace: marketplaceName,
        });
      }
    }

    return plugins;
  }
}
