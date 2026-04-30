import { join, dirname } from 'path';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { getCached, setCache, invalidateCache } from '../utils/cache.js';
import { ConflictError, NotFoundError } from '@ccm/types';
export class McpManager {
    claudeHome;
    mcpJsonPath;
    settingsPath;
    constructor(claudeHome) {
        this.claudeHome = claudeHome;
        this.mcpJsonPath = join(claudeHome, '.mcp.json');
        this.settingsPath = join(claudeHome, 'settings.json');
    }
    /**
     * Parse a .mcp.json file — supports both formats:
     *   { "mcpServers": { "name": { command, args } } }
     *   { "name": { "command": "...", "args": [...] } }
     */
    parseMcpJson(raw) {
        const result = {};
        if (raw?.mcpServers && typeof raw.mcpServers === 'object') {
            const servers = raw.mcpServers;
            for (const [name, val] of Object.entries(servers)) {
                if (val && typeof val === 'object') {
                    result[name] = val;
                }
            }
        }
        else {
            for (const [name, val] of Object.entries(raw)) {
                if (val && typeof val === 'object' && ('command' in val || 'url' in val || 'type' in val)) {
                    result[name] = val;
                }
            }
        }
        return result;
    }
    /**
     * Try reading and parsing a .mcp.json at a given path
     */
    async readMcpJsonAt(path) {
        try {
            if (!(await fileExists(path)))
                return {};
            const raw = (await readJsonFile(path));
            return this.parseMcpJson(raw);
        }
        catch {
            return {};
        }
    }
    /**
     * Collect all .mcp.json search paths with their source:
     * 1. ~/.claude.json — user (Claude Code's main config)
     * 2. ~/.claude/.mcp.json — user (user-level MCP config)
     * 3. Plugin .mcp.json files — system
     */
    async collectAllMcpPaths() {
        const paths = [];
        const homedir = dirname(this.claudeHome); // parent of .claude = home dir
        // 1. ~/.claude.json — Claude Code's main config (mcpServers field)
        //    PS-installed MCPs (metagraph, azure, workiq, etc.) go here
        paths.push({ path: join(homedir, '.claude.json'), source: 'user' });
        // 2. ~/.claude/.mcp.json — user-level MCP config
        paths.push({ path: this.mcpJsonPath, source: 'user' });
        // 3. Plugin .mcp.json files
        const pluginPaths = await this.getPluginMcpPaths();
        paths.push(...pluginPaths.map((p) => ({ path: p, source: 'system' })));
        return paths;
    }
    async getPluginMcpPaths() {
        const paths = [];
        const installedPath = join(this.claudeHome, 'plugins', 'installed_plugins.json');
        try {
            const raw = await readJsonFile(installedPath);
            const installed = raw;
            if (!installed?.plugins)
                return paths;
            for (const [_key, entries] of Object.entries(installed.plugins)) {
                if (!Array.isArray(entries) || entries.length === 0)
                    continue;
                const entry = entries[0];
                if (!entry.installPath)
                    continue;
                paths.push(join(entry.installPath, '.mcp.json'));
            }
        }
        catch {
            // ignore
        }
        return paths;
    }
    async readAllMcpServers() {
        const allPaths = await this.collectAllMcpPaths();
        const merged = {};
        for (const { path, source } of allPaths) {
            const servers = await this.readMcpJsonAt(path);
            for (const [name, config] of Object.entries(servers)) {
                merged[name] = { config, source };
            }
        }
        return merged;
    }
    async readEnabledMap() {
        try {
            if (!(await fileExists(this.settingsPath)))
                return {};
            const settings = (await readJsonFile(this.settingsPath));
            const map = settings.enabledMcpServers;
            return map ?? {};
        }
        catch {
            return {};
        }
    }
    async toggle(name, enabled) {
        let settings = {};
        try {
            if (await fileExists(this.settingsPath)) {
                settings = (await readJsonFile(this.settingsPath));
            }
        }
        catch { /* fresh start */ }
        const map = settings.enabledMcpServers ?? {};
        map[name] = enabled;
        await writeJsonFile(this.settingsPath, { ...settings, enabledMcpServers: map });
        invalidateCache('mcp');
    }
    async list() {
        const cached = getCached('mcp-list');
        if (cached)
            return cached;
        const servers = await this.readAllMcpServers();
        const enabledMap = await this.readEnabledMap();
        const entries = Object.entries(servers).map(([name, { config, source }]) => ({
            name,
            config,
            source,
            enabled: enabledMap[name] ?? true,
        }));
        setCache('mcp-list', entries);
        return entries;
    }
    async add(name, config) {
        const userServers = await this.readMcpJsonAt(this.mcpJsonPath);
        if (userServers[name] !== undefined) {
            throw new ConflictError(`MCP server already exists: ${name}`);
        }
        // Also check if it exists in any other source
        const allServers = await this.readAllMcpServers();
        if (allServers[name] !== undefined) {
            throw new ConflictError(`MCP server already exists (from plugin or sync): ${name}`);
        }
        const mcpJson = await this.readMcpJsonAt(this.mcpJsonPath);
        await writeJsonFile(this.mcpJsonPath, {
            mcpServers: { ...mcpJson, [name]: config },
        });
        invalidateCache('mcp');
    }
    async remove(name) {
        const userServers = await this.readMcpJsonAt(this.mcpJsonPath);
        if (userServers[name] === undefined) {
            throw new NotFoundError('MCP server', name);
        }
        const { [name]: _removed, ...remaining } = userServers;
        await writeJsonFile(this.mcpJsonPath, { mcpServers: remaining });
        invalidateCache('mcp');
    }
    async getDetail(name) {
        const servers = await this.readAllMcpServers();
        const entry = servers[name];
        if (entry === undefined)
            return null;
        const enabledMap = await this.readEnabledMap();
        return { name, config: entry.config, source: entry.source, enabled: enabledMap[name] ?? true };
    }
}
//# sourceMappingURL=mcp-manager.js.map