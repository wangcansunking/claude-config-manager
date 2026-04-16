import { z } from 'zod';
export const McpServerConfigSchema = z.object({
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
});
export function isMcpServerConfig(value) {
    return McpServerConfigSchema.safeParse(value).success;
}
//# sourceMappingURL=mcp-server.js.map