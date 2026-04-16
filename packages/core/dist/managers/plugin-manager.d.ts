import type { InstalledPlugin, PluginListEntry } from '@ccm/types';
export declare class PluginManager {
    private readonly pluginsJsonPath;
    private readonly settingsPath;
    constructor(claudeHome: string);
    private readInstalledPlugins;
    private writeInstalledPlugins;
    private readSettings;
    private readEnabledPlugins;
    private resolveFullName;
    list(): Promise<PluginListEntry[]>;
    getDetail(name: string): Promise<InstalledPlugin | null>;
    toggle(name: string, enabled: boolean): Promise<void>;
    remove(name: string): Promise<void>;
    isInstalled(name: string): Promise<boolean>;
}
//# sourceMappingURL=plugin-manager.d.ts.map