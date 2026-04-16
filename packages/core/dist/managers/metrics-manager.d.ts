export interface UsageEntry {
    name: string;
    usageCount: number;
    lastUsedAt: number;
    category: 'skill' | 'builtin-tool' | 'mcp-tool';
    mcpServer?: string;
}
export interface MetricsSummary {
    skills: UsageEntry[];
    builtinTools: UsageEntry[];
    mcpTools: UsageEntry[];
    totalToolCalls: number;
    totalSkillCalls: number;
    topTools: UsageEntry[];
    topSkills: UsageEntry[];
    mcpServerBreakdown: {
        server: string;
        toolCount: number;
        totalCalls: number;
    }[];
}
export declare class MetricsManager {
    private readonly claudeHome;
    constructor(claudeHome: string);
    getMetrics(): Promise<MetricsSummary>;
}
//# sourceMappingURL=metrics-manager.d.ts.map