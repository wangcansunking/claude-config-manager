import { join } from 'path';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { FileNotFoundError, NotFoundError, ValidationError } from '@ccm/types';
export class ProfileManager {
    profilesDir;
    settingsPath;
    pluginsJsonPath;
    activeProfilePath;
    userSkillsDir;
    userCommandsDir;
    constructor(claudeHome) {
        this.profilesDir = join(claudeHome, 'plugins', 'profiles');
        this.settingsPath = join(claudeHome, 'settings.json');
        this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
        this.activeProfilePath = join(claudeHome, 'plugins', 'profiles', 'active.json');
        this.userSkillsDir = join(claudeHome, 'skills');
        this.userCommandsDir = join(claudeHome, 'commands');
    }
    profilePath(name) {
        return join(this.profilesDir, `${name}.json`);
    }
    /**
     * Scan ~/.claude/skills/<name>/Skill.md or ~/.claude/commands/<name>/Skill.md
     * and return full content for each user-created asset.
     */
    async collectUserAssets(dir) {
        const assets = [];
        if (!(await fileExists(dir)))
            return assets;
        let subdirs;
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        }
        catch {
            return assets;
        }
        for (const name of subdirs) {
            const skillPath = join(dir, name, 'Skill.md');
            if (!(await fileExists(skillPath)))
                continue;
            try {
                const content = await readFile(skillPath, 'utf-8');
                assets.push({ name, content });
            }
            catch {
                // skip unreadable
            }
        }
        return assets;
    }
    /**
     * Merge two UserAsset arrays by name. Incoming assets override existing ones.
     */
    mergeAssetsByName(existing, incoming) {
        const byName = new Map();
        for (const a of existing)
            byName.set(a.name, a);
        for (const a of incoming)
            byName.set(a.name, a);
        return Array.from(byName.values());
    }
    /**
     * Write user skills/commands back to ~/.claude/skills/<name>/Skill.md or commands
     */
    async restoreUserAssets(dir, assets) {
        if (!assets || assets.length === 0)
            return;
        await mkdir(dir, { recursive: true });
        for (const asset of assets) {
            if (!asset.name || !asset.content)
                continue;
            // Sanitize name to prevent path traversal
            const safeName = asset.name.replace(/[\\\/\.]/g, '_');
            if (!safeName)
                continue;
            const targetDir = join(dir, safeName);
            await mkdir(targetDir, { recursive: true });
            await writeFile(join(targetDir, 'Skill.md'), asset.content, 'utf-8');
        }
    }
    async readSettings() {
        try {
            const data = await readJsonFile(this.settingsPath);
            return data ?? {};
        }
        catch (err) {
            if (err instanceof FileNotFoundError)
                return {};
            throw err;
        }
    }
    async readInstalledPlugins() {
        try {
            const data = await readJsonFile(this.pluginsJsonPath);
            return data;
        }
        catch (err) {
            if (err instanceof FileNotFoundError)
                return { version: 2, plugins: {} };
            throw err;
        }
    }
    async list() {
        try {
            const entries = await readdir(this.profilesDir, { withFileTypes: true });
            const summaries = [];
            for (const entry of entries) {
                if (!entry.isFile())
                    continue;
                if (!entry.name.endsWith('.json'))
                    continue;
                if (entry.name === 'active.json')
                    continue;
                const name = entry.name.replace(/\.json$/, '');
                try {
                    const data = (await readJsonFile(join(this.profilesDir, entry.name)));
                    summaries.push({
                        name,
                        createdAt: data.createdAt ?? new Date().toISOString(),
                        updatedAt: data.updatedAt ?? new Date().toISOString(),
                        description: data.description,
                    });
                }
                catch {
                    // Skip unreadable profiles
                }
            }
            return summaries;
        }
        catch {
            return [];
        }
    }
    async create(name) {
        const settings = await this.readSettings();
        const { plugins } = await this.readInstalledPlugins();
        // Build InstalledPlugin[] from plugins record
        const installedPluginsList = [];
        const enabledPlugins = (() => {
            const ep = settings['enabledPlugins'];
            if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
                return ep;
            }
            return {};
        })();
        for (const [fullName, installs] of Object.entries(plugins)) {
            const install = installs[0];
            if (!install)
                continue;
            const parts = fullName.split('@');
            installedPluginsList.push({
                name: fullName,
                version: install['version'] ?? '',
                marketplace: parts[1] ?? '',
                enabled: enabledPlugins[fullName] ?? false,
                installPath: install['installPath'] ?? '',
                installedAt: install['installedAt'] ?? '',
                lastUpdated: install['lastUpdated'] ?? '',
            });
        }
        const mcpServers = (() => {
            const ms = settings['mcpServers'];
            if (ms !== null && typeof ms === 'object' && !Array.isArray(ms)) {
                return ms;
            }
            return {};
        })();
        const hooks = (() => {
            const h = settings['hooks'];
            if (h !== null && typeof h === 'object' && !Array.isArray(h)) {
                return h;
            }
            return {};
        })();
        // Collect user-created skills and commands (with full file content)
        const userSkills = await this.collectUserAssets(this.userSkillsDir);
        const userCommands = await this.collectUserAssets(this.userCommandsDir);
        const now = new Date().toISOString();
        const profile = {
            name,
            createdAt: now,
            updatedAt: now,
            plugins: installedPluginsList,
            mcpServers,
            settings,
            hooks,
            commands: userCommands,
            skills: userSkills,
        };
        await writeJsonFile(this.profilePath(name), profile);
        return profile;
    }
    async update(name, patch) {
        const filePath = this.profilePath(name);
        if (!(await fileExists(filePath))) {
            throw new NotFoundError('Profile', name);
        }
        const existing = (await readJsonFile(filePath));
        const updated = {
            ...existing,
            ...patch,
            name: existing.name,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
        };
        await writeJsonFile(filePath, updated);
        return updated;
    }
    async activate(name) {
        const filePath = this.profilePath(name);
        if (!(await fileExists(filePath))) {
            throw new NotFoundError('Profile', name);
        }
        const data = await readJsonFile(filePath);
        const profile = data;
        // Merge dedicated mcpServers/hooks fields into settings so that imports with
        // only top-level fields (no nested settings.mcpServers) still apply correctly.
        const mergedSettings = { ...(profile.settings ?? {}) };
        if (profile.mcpServers && Object.keys(profile.mcpServers).length > 0) {
            mergedSettings['mcpServers'] = profile.mcpServers;
        }
        if (profile.hooks && Object.keys(profile.hooks).length > 0) {
            mergedSettings['hooks'] = profile.hooks;
        }
        // Ensure enabledPlugins reflects the profile's plugin list
        const enabledPlugins = {};
        for (const plugin of profile.plugins ?? []) {
            enabledPlugins[plugin.name] = plugin.enabled;
        }
        if (Object.keys(enabledPlugins).length > 0) {
            mergedSettings['enabledPlugins'] = enabledPlugins;
        }
        await writeJsonFile(this.settingsPath, mergedSettings);
        // Restore user skills and commands (write Skill.md files)
        if (profile.skills && Array.isArray(profile.skills)) {
            await this.restoreUserAssets(this.userSkillsDir, profile.skills);
        }
        if (profile.commands && Array.isArray(profile.commands)) {
            await this.restoreUserAssets(this.userCommandsDir, profile.commands);
        }
        // Update active.json
        await writeJsonFile(this.activeProfilePath, { name });
    }
    async delete(name) {
        const filePath = this.profilePath(name);
        if (!(await fileExists(filePath))) {
            throw new NotFoundError('Profile', name);
        }
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
        // Clear active.json if this was the active profile
        const activeName = await this.getActive();
        if (activeName === name) {
            const { unlink: ul } = await import('fs/promises');
            try {
                await ul(this.activeProfilePath);
            }
            catch {
                // Ignore if active.json doesn't exist
            }
        }
    }
    async getActive() {
        try {
            const data = await readJsonFile(this.activeProfilePath);
            const obj = data;
            return typeof obj['name'] === 'string' ? obj['name'] : null;
        }
        catch (err) {
            if (err instanceof FileNotFoundError)
                return null;
            throw err;
        }
    }
    async exportProfile(name) {
        const filePath = this.profilePath(name);
        if (!(await fileExists(filePath))) {
            throw new NotFoundError('Profile', name);
        }
        const data = (await readJsonFile(filePath));
        const enabledPlugins = {};
        for (const plugin of data.plugins) {
            enabledPlugins[plugin.name] = plugin.enabled;
        }
        const exported = {
            version: '1.0',
            name: data.name,
            createdAt: data.createdAt,
            plugins: {
                installed: data.plugins,
                enabled: enabledPlugins,
            },
            mcpServers: data.mcpServers,
            settings: data.settings,
            hooks: data.hooks,
            commands: data.commands ?? [],
            skills: data.skills ?? [],
            description: data.description,
            exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exported, null, 2);
    }
    async importProfile(data, strategy = 'replace') {
        let parsed;
        try {
            parsed = JSON.parse(data);
        }
        catch {
            throw new ValidationError('Invalid JSON in profile import data');
        }
        const obj = parsed;
        if (!obj['name'] || typeof obj['name'] !== 'string') {
            throw new ValidationError('Profile import data must have a name field');
        }
        const name = obj['name'];
        const now = new Date().toISOString();
        // Extract from ProfileExport format or Profile format
        const commands = obj['commands'] ?? [];
        const skills = obj['skills'] ?? [];
        let profile;
        if (obj['version'] && obj['plugins'] && typeof obj['plugins'] === 'object' && !Array.isArray(obj['plugins'])) {
            // ProfileExport format
            const pluginsData = obj['plugins'];
            const installed = (pluginsData.installed ?? []);
            profile = {
                name,
                createdAt: obj['createdAt'] ?? now,
                updatedAt: now,
                plugins: installed,
                mcpServers: obj['mcpServers'] ?? {},
                settings: obj['settings'] ?? {},
                hooks: obj['hooks'] ?? {},
                commands,
                skills,
                description: obj['description'],
            };
        }
        else {
            // Profile format directly
            profile = {
                name,
                createdAt: obj['createdAt'] ?? now,
                updatedAt: now,
                plugins: obj['plugins'] ?? [],
                mcpServers: obj['mcpServers'] ?? {},
                settings: obj['settings'] ?? {},
                hooks: obj['hooks'] ?? {},
                commands,
                skills,
                description: obj['description'],
            };
        }
        if (strategy === 'merge') {
            const existing = await this.getProfileData(name);
            if (existing) {
                // Merge user assets by name — imported entries override existing ones
                const mergedCommands = this.mergeAssetsByName(existing.commands ?? [], profile.commands ?? []);
                const mergedSkills = this.mergeAssetsByName(existing.skills ?? [], profile.skills ?? []);
                profile = {
                    ...existing,
                    ...profile,
                    settings: { ...existing.settings, ...profile.settings },
                    mcpServers: { ...existing.mcpServers, ...profile.mcpServers },
                    hooks: { ...existing.hooks, ...profile.hooks },
                    commands: mergedCommands,
                    skills: mergedSkills,
                    updatedAt: now,
                };
            }
        }
        await writeJsonFile(this.profilePath(name), profile);
        return profile;
    }
    async getProfileData(name) {
        const filePath = this.profilePath(name);
        if (!(await fileExists(filePath)))
            return null;
        try {
            return (await readJsonFile(filePath));
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=profile-manager.js.map