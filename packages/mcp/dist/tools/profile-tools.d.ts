import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProfileManager } from '@ccm/core';
export interface ProfileToolManagers {
    profileManager: ProfileManager;
}
export declare function handleListProfiles(managers: ProfileToolManagers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleCreateProfile(managers: ProfileToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleActivateProfile(managers: ProfileToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleExportProfile(managers: ProfileToolManagers, args: {
    name: string;
    format?: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleImportProfile(managers: ProfileToolManagers, args: {
    data: string;
    strategy?: 'merge' | 'replace';
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleUpdateProfile(managers: ProfileToolManagers, args: {
    name: string;
    description?: string;
    plugins?: string;
    mcpServers?: string;
    settings?: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleDeleteProfile(managers: ProfileToolManagers, args: {
    name: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function registerProfileTools(server: McpServer, managers: ProfileToolManagers): void;
//# sourceMappingURL=profile-tools.d.ts.map