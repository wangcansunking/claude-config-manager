import { z } from 'zod';
import { McpServerConfigSchema } from './mcp-server.js';

export const HookEntrySchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().optional(),
});

export type HookEntry = z.infer<typeof HookEntrySchema>;

export const HookConfigSchema = z.record(z.array(HookEntrySchema));

export type HookConfig = z.infer<typeof HookConfigSchema>;

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

export type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;

export function isClaudeSettings(value: unknown): value is ClaudeSettings {
  return ClaudeSettingsSchema.safeParse(value).success;
}
