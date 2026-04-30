import type { McpServerConfig, McpServerEntry } from '@ccm/types';
export declare class McpManager {
    private readonly claudeHome;
    private readonly mcpJsonPath;
    private readonly settingsPath;
    constructor(claudeHome: string);
    /**
     * Parse a .mcp.json file — supports both formats:
     *   { "mcpServers": { "name": { command, args } } }
     *   { "name": { "command": "...", "args": [...] } }
     */
    private parseMcpJson;
    /**
     * Try reading and parsing a .mcp.json at a given path
     */
    private readMcpJsonAt;
    /**
     * Collect all .mcp.json search paths with their source:
     * 1. ~/.claude.json — user (Claude Code's main config)
     * 2. ~/.claude/.mcp.json — user (user-level MCP config)
     * 3. Plugin .mcp.json files — system
     */
    private collectAllMcpPaths;
    private getPluginMcpPaths;
    private readAllMcpServers;
    private readEnabledMap;
    toggle(name: string, enabled: boolean): Promise<void>;
    list(): Promise<McpServerEntry[]>;
    add(name: string, config: McpServerConfig): Promise<void>;
    remove(name: string): Promise<void>;
    getDetail(name: string): Promise<McpServerEntry | null>;
}
//# sourceMappingURL=mcp-manager.d.ts.map