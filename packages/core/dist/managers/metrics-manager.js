import { join } from 'path';
import { readJsonFile } from '../utils/file-ops.js';
export class MetricsManager {
    claudeHome;
    constructor(claudeHome) {
        this.claudeHome = claudeHome;
    }
    async getMetrics() {
        // .claude.json is sibling to the .claude/ directory
        const claudeJsonPath = join(this.claudeHome, '..', '.claude.json');
        let data;
        try {
            data = (await readJsonFile(claudeJsonPath));
        }
        catch {
            data = {};
        }
        const skillUsage = (data.skillUsage ?? {});
        const toolUsage = (data.toolUsage ?? {});
        const skills = Object.entries(skillUsage).map(([name, val]) => ({
            name,
            usageCount: val.usageCount ?? 0,
            lastUsedAt: val.lastUsedAt ?? 0,
            category: 'skill',
        }));
        const builtinTools = [];
        const mcpTools = [];
        for (const [name, val] of Object.entries(toolUsage)) {
            const entry = {
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
            }
            else {
                builtinTools.push(entry);
            }
        }
        const sortByUsage = (a, b) => b.usageCount - a.usageCount;
        skills.sort(sortByUsage);
        builtinTools.sort(sortByUsage);
        mcpTools.sort(sortByUsage);
        const allTools = [...builtinTools, ...mcpTools].sort(sortByUsage);
        const serverMap = new Map();
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
//# sourceMappingURL=metrics-manager.js.map