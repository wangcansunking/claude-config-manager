import { z } from 'zod';

export const InstalledPluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  marketplace: z.string(),
  enabled: z.boolean(),
  installPath: z.string(),
  installedAt: z.string(),
  lastUpdated: z.string(),
});

export type InstalledPlugin = z.infer<typeof InstalledPluginSchema>;

export function isInstalledPlugin(value: unknown): value is InstalledPlugin {
  return InstalledPluginSchema.safeParse(value).success;
}

export interface PluginListEntry {
  name: string;
  version: string;
  marketplace: string;
  enabled: boolean;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

export interface MarketplacePlugin {
  name: string;
  version: string;
  marketplace: string;
  description?: string;
  author?: string;
  tags?: string[];
  downloadUrl?: string;
  homepage?: string;
}
