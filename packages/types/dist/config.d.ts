import { z } from 'zod';
export declare const HookEntrySchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    command: string;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
    timeout?: number | undefined;
}, {
    command: string;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
    timeout?: number | undefined;
}>;
export type HookEntry = z.infer<typeof HookEntrySchema>;
export declare const HookConfigSchema: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    command: string;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
    timeout?: number | undefined;
}, {
    command: string;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
    timeout?: number | undefined;
}>, "many">>;
export type HookConfig = z.infer<typeof HookConfigSchema>;
export declare const ClaudeSettingsSchema: z.ZodObject<{
    mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
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
    }>>>;
    hooks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
        timeout?: number | undefined;
    }, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
        timeout?: number | undefined;
    }>, "many">>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    permissions: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
    }, {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    mcpServers?: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }> | undefined;
    hooks?: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
        timeout?: number | undefined;
    }[]> | undefined;
    settings?: Record<string, unknown> | undefined;
    permissions?: {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
    } | undefined;
}, {
    mcpServers?: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
    }> | undefined;
    hooks?: Record<string, {
        command: string;
        args?: string[] | undefined;
        env?: Record<string, string> | undefined;
        timeout?: number | undefined;
    }[]> | undefined;
    settings?: Record<string, unknown> | undefined;
    permissions?: {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
    } | undefined;
}>;
export type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;
export declare function isClaudeSettings(value: unknown): value is ClaudeSettings;
//# sourceMappingURL=config.d.ts.map