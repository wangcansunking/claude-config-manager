import { z } from 'zod';
export declare const McpServerConfigSchema: z.ZodObject<{
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
}>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export declare function isMcpServerConfig(value: unknown): value is McpServerConfig;
export interface McpServerEntry {
    name: string;
    config: McpServerConfig;
    enabled?: boolean;
    source: 'user' | 'system';
}
//# sourceMappingURL=mcp-server.d.ts.map