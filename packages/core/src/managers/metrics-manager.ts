import { join } from 'path';
import { readJsonFile } from '../utils/file-ops.js';

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
  mcpServerBreakdown: { server: string; toolCount: number; totalCalls: number }[];
}

export class MetricsManager {
  private readonly claudeHome: string;

  constructor(claudeHome: string) {
    this.claudeHome = claudeHome;
  }

  async getMetrics(): Promise<MetricsSummary> {
    // .claude.json is sibling to the .claude/ directory
    const claudeJsonPath = join(this.claudeHome, '..', '.claude.json');
    let data: Record<string, unknown>;
    try {
      data = (await readJsonFile(claudeJsonPath)) as Record<string, unknown>;
    } catch {
      data = {};
    }

    const skillUsage = (data.skillUsage ?? {}) as Record<string, { usageCount?: number; lastUsedAt?: number }>;
    const toolUsage = (data.toolUsage ?? {}) as Record<string, { usageCount?: number; lastUsedAt?: number }>;

    const skills: UsageEntry[] = Object.entries(skillUsage).map(([name, val]) => ({
      name,
      usageCount: val.usageCount ?? 0,
      lastUsedAt: val.lastUsedAt ?? 0,
      category: 'skill' as const,
    }));

    const builtinTools: UsageEntry[] = [];
    const mcpTools: UsageEntry[] = [];

    for (const [name, val] of Object.entries(toolUsage)) {
      const entry: UsageEntry = {
        name,
        usageCount: val.usageCount ?? 0,
        lastUsedAt: val.lastUsedAt ?? 0,
        category: name.startsWith('mcp__') ? 'mcp-tool' : 'builtin-tool',
      };

      if (name.startsWith('mcp__')) {
        const parts = name.split('__');
        entry.mcpServer = parts.slice(1, -1).join('__');
        entry.name = parts[parts.length - 1];
        mcpTools.push(entry);
      } else {
        builtinTools.push(entry);
      }
    }

    const sortByUsage = (a: UsageEntry, b: UsageEntry) => b.usageCount - a.usageCount;
    skills.sort(sortByUsage);
    builtinTools.sort(sortByUsage);
    mcpTools.sort(sortByUsage);

    const allTools = [...builtinTools, ...mcpTools].sort(sortByUsage);

    const serverMap = new Map<string, { toolCount: number; totalCalls: number }>();
    for (const tool of mcpTools) {
      const server = tool.mcpServer ?? 'unknown';
      const existing = serverMap.get(server) ?? { toolCount: 0, totalCalls: 0 };
      existing.toolCount++;
      existing.totalCalls += tool.usageCount;
      serverMap.set(server, existing);
    }

    return {
      skills,
      builtinTools,
      mcpTools,
      totalToolCalls: allTools.reduce((sum, t) => sum + t.usageCount, 0),
      totalSkillCalls: skills.reduce((sum, s) => sum + s.usageCount, 0),
      topTools: allTools.slice(0, 10),
      topSkills: skills.slice(0, 5),
      mcpServerBreakdown: Array.from(serverMap.entries())
        .map(([server, d]) => ({ server, ...d }))
        .sort((a, b) => b.totalCalls - a.totalCalls),
    };
  }
}
