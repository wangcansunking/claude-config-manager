import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginManager } from '@ccm/core';
import type { McpManager } from '@ccm/core';
import type { SkillScanner } from '@ccm/core';
import type { ConfigManager } from '@ccm/core';
export interface QueryToolManagers {
    pluginManager: PluginManager;
    mcpManager: McpManager;
    skillScanner: SkillScanner;
    configManager: ConfigManager;
}
export declare function handleListPlugins(managers: QueryToolManagers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleListMcpServers(managers: QueryToolManagers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleListSkills(managers: QueryToolManagers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleListCommands(managers: QueryToolManagers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleGetConfig(managers: QueryToolManagers, args: {
    section?: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleGetComponentDetail(managers: QueryToolManagers, args: {
    type: 'plugin' | 'mcp' | 'skill';
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function registerQueryTools(server: McpServer, managers: QueryToolManagers): void;
//# sourceMappingURL=query-tools.d.ts.map