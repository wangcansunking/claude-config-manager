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
export function isInstalledPlugin(value) {
    return InstalledPluginSchema.safeParse(value).success;
}
//# sourceMappingURL=plugin.js.map