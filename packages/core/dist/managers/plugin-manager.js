import { join } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/file-ops.js';
import { getCached, setCache, invalidateCache } from '../utils/cache.js';
import { FileNotFoundError } from '@ccm/types';
export class PluginManager {
    pluginsJsonPath;
    settingsPath;
    constructor(claudeHome) {
        this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
        this.settingsPath = join(claudeHome, 'settings.json');
    }
    async readInstalledPlugins() {
        try {
            const data = await readJsonFile(this.pluginsJsonPath);
            return data;
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return { version: 2, plugins: {} };
            }
            throw err;
        }
    }
    async writeInstalledPlugins(data) {
        await writeJsonFile(this.pluginsJsonPath, data);
    }
    async readSettings() {
        try {
            const data = await readJsonFile(this.settingsPath);
            return data ?? {};
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return {};
            }
            throw err;
        }
    }
    async readEnabledPlugins() {
        const settings = await this.readSettings();
        const ep = settings['enabledPlugins'];
        if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
            return ep;
        }
        return {};
    }
    resolveFullName(plugins, name) {
        // Exact match first
        if (plugins[name])
            return name;
        // Partial match: "superpowers" matches "superpowers@claude-plugins-official"
        const match = Object.keys(plugins).find((key) => key === name || key.startsWith(`${name}@`) || key.endsWith(`@${name}`));
        return match;
    }
    async list() {
        const cached = getCached('plugin-list');
        if (cached)
            return cached;
        const { plugins } = await this.readInstalledPlugins();
        const enabledPlugins = await this.readEnabledPlugins();
        const entries = [];
        for (const [fullName, installs] of Object.entries(plugins)) {
            const parts = fullName.split('@');
            const marketplace = parts[1] ?? '';
            // Use the first (most recent) install entry
            const install = installs[0];
            if (!install)
                continue;
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
        setCache('plugin-list', entries);
        return entries;
    }
    async getDetail(name) {
        const { plugins } = await this.readInstalledPlugins();
        const enabledPlugins = await this.readEnabledPlugins();
        const fullName = this.resolveFullName(plugins, name);
        if (!fullName)
            return null;
        const installs = plugins[fullName];
        const install = installs?.[0];
        if (!install)
            return null;
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
    async toggle(name, enabled) {
        const { plugins } = await this.readInstalledPlugins();
        const fullName = this.resolveFullName(plugins, name) ?? name;
        const settings = await this.readSettings();
        const current = await this.readEnabledPlugins();
        await writeJsonFile(this.settingsPath, {
            ...settings,
            enabledPlugins: { ...current, [fullName]: enabled },
        });
        invalidateCache('plugin');
    }
    async remove(name) {
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
        invalidateCache('plugin');
    }
    async isInstalled(name) {
        const { plugins } = await this.readInstalledPlugins();
        return this.resolveFullName(plugins, name) !== undefined;
    }
}
//# sourceMappingURL=plugin-manager.js.map