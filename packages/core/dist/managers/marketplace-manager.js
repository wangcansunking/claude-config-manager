import { join } from 'path';
import { readdir } from 'fs/promises';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';
export class MarketplaceManager {
    claudeHome;
    knownMarketplacesPath;
    installedPluginsPath;
    settingsPath;
    constructor(claudeHome) {
        this.claudeHome = claudeHome;
        this.knownMarketplacesPath = join(claudeHome, 'plugins', 'known_marketplaces.json');
        this.installedPluginsPath = join(claudeHome, 'plugins', 'installed_plugins.json');
        this.settingsPath = join(claudeHome, 'settings.json');
    }
    async readKnownMarketplaces() {
        try {
            const data = await readJsonFile(this.knownMarketplacesPath);
            return data ?? {};
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return {};
            }
            throw err;
        }
    }
    async writeKnownMarketplaces(data) {
        await writeJsonFile(this.knownMarketplacesPath, data);
    }
    async readInstalledPlugins() {
        try {
            const data = await readJsonFile(this.installedPluginsPath);
            return data;
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return { version: 2, plugins: {} };
            }
            throw err;
        }
    }
    async readEnabledPlugins() {
        try {
            const settings = await readJsonFile(this.settingsPath);
            const s = settings;
            const ep = s['enabledPlugins'];
            if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
                return ep;
            }
            return {};
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return {};
            }
            throw err;
        }
    }
    async listMarketplaces() {
        const data = await this.readKnownMarketplaces();
        return Object.entries(data).map(([name, entry]) => ({
            name,
            source: entry.source,
            installLocation: entry.installLocation,
            lastUpdated: entry.lastUpdated,
        }));
    }
    async addMarketplace(name, repo) {
        const data = await this.readKnownMarketplaces();
        if (data[name]) {
            throw new Error(`Marketplace "${name}" already exists`);
        }
        data[name] = {
            source: { source: 'github', repo },
            installLocation: join(this.claudeHome, 'plugins', 'marketplaces', name),
            lastUpdated: new Date().toISOString(),
        };
        await this.writeKnownMarketplaces(data);
    }
    async removeMarketplace(name) {
        const data = await this.readKnownMarketplaces();
        if (!data[name]) {
            throw new Error(`Marketplace "${name}" not found`);
        }
        delete data[name];
        await this.writeKnownMarketplaces(data);
    }
    async listAvailablePlugins(marketplaceName) {
        const marketplaces = await this.readKnownMarketplaces();
        const marketplace = marketplaces[marketplaceName];
        if (!marketplace) {
            throw new Error(`Marketplace "${marketplaceName}" not found`);
        }
        const installLocation = marketplace.installLocation;
        const installedPlugins = await this.readInstalledPlugins();
        const enabledPlugins = await this.readEnabledPlugins();
        // Build a set of installed plugin names for this marketplace
        const installedSet = new Set();
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
            return this.listFromManifest(manifestPath, marketplaceName, installedSet, enabledPlugins);
        }
        // Fallback: scan directories
        return this.listFromDirectories(installLocation, marketplaceName, installedSet, enabledPlugins);
    }
    async listFromManifest(manifestPath, marketplaceName, installedSet, enabledPlugins) {
        const manifest = (await readJsonFile(manifestPath));
        const plugins = [];
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
    async listFromDirectories(installLocation, marketplaceName, installedSet, enabledPlugins) {
        const plugins = [];
        // Scan both /plugins/ and /external_plugins/ subdirectories
        for (const subdir of ['plugins', 'external_plugins']) {
            const dirPath = join(installLocation, subdir);
            const dirOk = await fileExists(dirPath);
            if (!dirOk)
                continue;
            let entries;
            try {
                entries = await readdir(dirPath);
            }
            catch {
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
                        const pkg = (await readJsonFile(pkgPath));
                        description = pkg.description ?? '';
                        version = pkg.version ?? 'latest';
                    }
                    catch {
                        // ignore parse errors
                    }
                }
                else if (await fileExists(manifestPluginPath)) {
                    try {
                        const m = (await readJsonFile(manifestPluginPath));
                        description = m.description ?? '';
                        version = m.version ?? 'latest';
                    }
                    catch {
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
//# sourceMappingURL=marketplace-manager.js.map