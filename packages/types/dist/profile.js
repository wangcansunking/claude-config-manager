import { z } from 'zod';
import { McpServerConfigSchema } from './mcp-server.js';
import { InstalledPluginSchema } from './plugin.js';
export const ProfileSchema = z.object({
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    plugins: z.array(InstalledPluginSchema),
    mcpServers: z.record(McpServerConfigSchema),
    settings: z.record(z.unknown()),
    commands: z.array(z.unknown()),
    hooks: z.record(z.unknown()),
    description: z.string().optional(),
});
export function isProfile(value) {
    return ProfileSchema.safeParse(value).success;
}
export const ProfileExportSchema = z.object({
    version: z.string(),
    name: z.string(),
    createdAt: z.string(),
    plugins: z.object({
        installed: z.array(InstalledPluginSchema),
        enabled: z.record(z.boolean()),
    }),
    mcpServers: z.record(McpServerConfigSchema),
    settings: z.record(z.unknown()),
    hooks: z.record(z.unknown()),
    commands: z.array(z.unknown()),
    description: z.string().optional(),
    exportedAt: z.string().optional(),
});
export function isProfileExport(value) {
    return ProfileExportSchema.safeParse(value).success;
}
//# sourceMappingURL=profile.js.map