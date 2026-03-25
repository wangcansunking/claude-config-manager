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

export type Profile = z.infer<typeof ProfileSchema>;

export function isProfile(value: unknown): value is Profile {
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

export type ProfileExport = z.infer<typeof ProfileExportSchema>;

export function isProfileExport(value: unknown): value is ProfileExport {
  return ProfileExportSchema.safeParse(value).success;
}

export interface ProfileManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  profiles: string[];
}
