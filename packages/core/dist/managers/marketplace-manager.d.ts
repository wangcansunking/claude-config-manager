export interface MarketplaceInfo {
    name: string;
    source: {
        source: string;
        repo: string;
    };
    installLocation: string;
    lastUpdated: string;
}
export interface AvailablePlugin {
    name: string;
    description: string;
    version: string;
    installed: boolean;
    enabled: boolean;
    marketplace: string;
    category?: string;
    homepage?: string;
}
export declare class MarketplaceManager {
    private claudeHome;
    private readonly knownMarketplacesPath;
    private readonly installedPluginsPath;
    private readonly settingsPath;
    constructor(claudeHome: string);
    private readKnownMarketplaces;
    private writeKnownMarketplaces;
    private readInstalledPlugins;
    private readEnabledPlugins;
    listMarketplaces(): Promise<MarketplaceInfo[]>;
    addMarketplace(name: string, repo: string): Promise<void>;
    removeMarketplace(name: string): Promise<void>;
    listAvailablePlugins(marketplaceName: string): Promise<AvailablePlugin[]>;
    private listFromManifest;
    private listFromDirectories;
}
//# sourceMappingURL=marketplace-manager.d.ts.map