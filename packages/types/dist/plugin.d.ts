import { z } from 'zod';
export declare const InstalledPluginSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    marketplace: z.ZodString;
    enabled: z.ZodBoolean;
    installPath: z.ZodString;
    installedAt: z.ZodString;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    marketplace: string;
    enabled: boolean;
    installPath: string;
    installedAt: string;
    lastUpdated: string;
}, {
    name: string;
    version: string;
    marketplace: string;
    enabled: boolean;
    installPath: string;
    installedAt: string;
    lastUpdated: string;
}>;
export type InstalledPlugin = z.infer<typeof InstalledPluginSchema>;
export declare function isInstalledPlugin(value: unknown): value is InstalledPlugin;
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
//# sourceMappingURL=plugin.d.ts.map