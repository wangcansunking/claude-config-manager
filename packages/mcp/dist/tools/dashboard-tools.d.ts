import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export declare function handleOpenDashboard(): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleDashboardStatus(): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function registerDashboardTools(server: McpServer): void;
//# sourceMappingURL=dashboard-tools.d.ts.map