import { z } from 'zod';

export const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export function isMcpServerConfig(value: unknown): value is McpServerConfig {
  return McpServerConfigSchema.safeParse(value).success;
}

export interface McpServerEntry {
  name: string;
  config: McpServerConfig;
  enabled?: boolean;
  source: 'user' | 'system';
}
