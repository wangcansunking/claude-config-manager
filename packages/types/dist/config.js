import { z } from 'zod';
import { McpServerConfigSchema } from './mcp-server.js';
export const HookEntrySchema = z.object({
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    timeout: z.number().optional(),
});
export const HookConfigSchema = z.record(z.array(HookEntrySchema));
export const ClaudeSettingsSchema = z.object({
    mcpServers: z.record(McpServerConfigSchema).optional(),
    hooks: HookConfigSchema.optional(),
    settings: z.record(z.unknown()).optional(),
    permissions: z
        .object({
        allow: z.array(z.string()).optional(),
        deny: z.array(z.string()).optional(),
    })
        .optional(),
});
export function isClaudeSettings(value) {
    return ClaudeSettingsSchema.safeParse(value).success;
}
//# sourceMappingURL=config.js.map