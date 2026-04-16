import type { Profile } from '@ccm/types';
export interface ProfileSummary {
    name: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
}
export declare class ProfileManager {
    private readonly profilesDir;
    private readonly settingsPath;
    private readonly pluginsJsonPath;
    private readonly activeProfilePath;
    constructor(claudeHome: string);
    private profilePath;
    private readSettings;
    private readInstalledPlugins;
    list(): Promise<ProfileSummary[]>;
    create(name: string): Promise<Profile>;
    update(name: string, patch: Partial<Omit<Profile, 'name' | 'createdAt'>>): Promise<Profile>;
    activate(name: string): Promise<void>;
    delete(name: string): Promise<void>;
    getActive(): Promise<string | null>;
    exportProfile(name: string): Promise<string>;
    importProfile(data: string, strategy?: 'merge' | 'replace'): Promise<Profile>;
    private getProfileData;
}
//# sourceMappingURL=profile-manager.d.ts.map