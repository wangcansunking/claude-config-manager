import { z } from 'zod';
export declare const ProfileSchema: z.ZodObject<{
    name: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    plugins: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    mcpServers: z.ZodRecord<z.ZodString, z.ZodObject<{
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    settings: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    commands: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        content: string;
    }, {
        name: string;
        content: string;
    }>, "many">;
    skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        content: string;
    }, {
        name: string;
        content: string;
    }>, "many">>;
    hooks: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mcpServers: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>;
    hooks: Record<string, unknown>;
    settings: Record<string, unknown>;
    name: string;
    createdAt: string;
    updatedAt: string;
    plugins: {
        name: string;
        version: string;
        marketplace: string;
        enabled: boolean;
        installPath: string;
        installedAt: string;
        lastUpdated: string;
    }[];
    commands: {
        name: string;
        content: string;
    }[];
    skills?: {
        name: string;
        content: string;
    }[] | undefined;
    description?: string | undefined;
}, {
    mcpServers: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>;
    hooks: Record<string, unknown>;
    settings: Record<string, unknown>;
    name: string;
    createdAt: string;
    updatedAt: string;
    plugins: {
        name: string;
        version: string;
        marketplace: string;
        enabled: boolean;
        installPath: string;
        installedAt: string;
        lastUpdated: string;
    }[];
    commands: {
        name: string;
        content: string;
    }[];
    skills?: {
        name: string;
        content: string;
    }[] | undefined;
    description?: string | undefined;
}>;
export type Profile = z.infer<typeof ProfileSchema>;
export declare function isProfile(value: unknown): value is Profile;
export declare const ProfileExportSchema: z.ZodObject<{
    version: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodString;
    plugins: z.ZodObject<{
        installed: z.ZodArray<z.ZodObject<{
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
        }>, "many">;
        enabled: z.ZodRecord<z.ZodString, z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: Record<string, boolean>;
        installed: {
            name: string;
            version: string;
            marketplace: string;
            enabled: boolean;
            installPath: string;
            installedAt: string;
            lastUpdated: string;
        }[];
    }, {
        enabled: Record<string, boolean>;
        installed: {
            name: string;
            version: string;
            marketplace: string;
            enabled: boolean;
            installPath: string;
            installedAt: string;
            lastUpdated: string;
        }[];
    }>;
    mcpServers: z.ZodRecord<z.ZodString, z.ZodObject<{
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    settings: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    hooks: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    commands: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        content: string;
    }, {
        name: string;
        content: string;
    }>, "many">;
    skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        content: string;
    }, {
        name: string;
        content: string;
    }>, "many">>;
    description: z.ZodOptional<z.ZodString>;
    exportedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mcpServers: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>;
    hooks: Record<string, unknown>;
    settings: Record<string, unknown>;
    name: string;
    version: string;
    createdAt: string;
    plugins: {
        enabled: Record<string, boolean>;
        installed: {
            name: string;
            version: string;
            marketplace: string;
            enabled: boolean;
            installPath: string;
            installedAt: string;
            lastUpdated: string;
        }[];
    };
    commands: {
        name: string;
        content: string;
    }[];
    skills?: {
        name: string;
        content: string;
    }[] | undefined;
    description?: string | undefined;
    exportedAt?: string | undefined;
}, {
    mcpServers: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }>;
    hooks: Record<string, unknown>;
    settings: Record<string, unknown>;
    name: string;
    version: string;
    createdAt: string;
    plugins: {
        enabled: Record<string, boolean>;
        installed: {
            name: string;
            version: string;
            marketplace: string;
            enabled: boolean;
            installPath: string;
            installedAt: string;
            lastUpdated: string;
        }[];
    };
    commands: {
        name: string;
        content: string;
    }[];
    skills?: {
        name: string;
        content: string;
    }[] | undefined;
    description?: string | undefined;
    exportedAt?: string | undefined;
}>;
export type ProfileExport = z.infer<typeof ProfileExportSchema>;
export declare function isProfileExport(value: unknown): value is ProfileExport;
export interface ProfileManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    profiles: string[];
}
//# sourceMappingURL=profile.d.ts.map