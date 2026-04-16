import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginManager } from '@ccm/core';
import type { McpManager } from '@ccm/core';
import type { ConfigManager } from '@ccm/core';
export interface MutationToolManagers {
    pluginManager: PluginManager;
    mcpManager: McpManager;
    configManager: ConfigManager;
}
export declare function handleInstallPlugin(_managers: MutationToolManagers, args: {
    name: string;
    marketplace?: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleUpdatePlugin(_managers: MutationToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleRemovePlugin(managers: MutationToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleTogglePlugin(managers: MutationToolManagers, args: {
    name: string;
    enabled: boolean;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleAddMcpServer(managers: MutationToolManagers, args: {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleRemoveMcpServer(managers: MutationToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleUpdateConfig(managers: MutationToolManagers, args: {
    model?: string;
    env?: Record<string, string>;
    hooks?: Record<string, unknown>;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function registerMutationTools(server: McpServer, managers: MutationToolManagers): void;
//# sourceMappingURL=mutation-tools.d.ts.map