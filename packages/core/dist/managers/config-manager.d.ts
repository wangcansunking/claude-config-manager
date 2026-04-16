type SettingsRecord = Record<string, unknown>;
export declare class ConfigManager {
    private readonly settingsPath;
    constructor(claudeHome: string);
    getSettings(): Promise<SettingsRecord>;
    updateSettings(patch: SettingsRecord): Promise<void>;
    getModel(): Promise<string | undefined>;
    setModel(model: string): Promise<void>;
    getEnvVars(): Promise<Record<string, string>>;
    setEnvVar(key: string, value: string): Promise<void>;
    removeEnvVar(key: string): Promise<void>;
    getHooks(): Promise<Record<string, unknown>>;
}
export {};
//# sourceMappingURL=config-manager.d.ts.map