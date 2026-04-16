import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { PluginManager } from './plugin-manager.js';
import { McpManager } from './mcp-manager.js';
import { SkillScanner } from './skill-scanner.js';
import { fileExists } from '../utils/file-ops.js';

export interface Recommendation {
  name: string;
  type: 'plugin' | 'mcp' | 'skill';
  description: string;
  reason: string;
  popularity: string;
  installCommand?: string;
  url?: string;
  category?: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  generatedAt: string;
  model: string;
}

export class RecommendationManager {
  private cacheDir: string;
  private cacheFile: string;

  constructor(private claudeHome: string) {
    this.cacheDir = join(claudeHome, 'plugins', 'ccm-cache');
    this.cacheFile = join(this.cacheDir, 'recommendations.json');
  }

  /** Get cached recommendations (if fresh enough, < 24 hours) */
  async getCached(): Promise<RecommendationResult | null> {
    try {
      if (!(await fileExists(this.cacheFile))) return null;
      const content = await readFile(this.cacheFile, 'utf-8');
      const data = JSON.parse(content) as RecommendationResult;
      // Check if older than 24 hours
      const age = Date.now() - new Date(data.generatedAt).getTime();
      if (age > 24 * 60 * 60 * 1000) return null;
      return data;
    } catch {
      return null;
    }
  }

  /** Save recommendations to cache */
  async saveCache(result: RecommendationResult): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(this.cacheFile, JSON.stringify(result, null, 2));
  }

  /** Get current user context for personalized recommendations */
  async getUserContext(): Promise<string> {
    const pluginMgr = new PluginManager(this.claudeHome);
    const mcpMgr = new McpManager(this.claudeHome);
    const skillScanner = new SkillScanner(this.claudeHome);

    const plugins = await pluginMgr.list();
    const mcps = await mcpMgr.list();
    const skills = await skillScanner.scan();

    return `Current user environment:
- Installed plugins (${plugins.length}): ${plugins.map((p: { name: string }) => p.name.split('@')[0]).join(', ')}
- MCP servers (${mcps.length}): ${mcps.map((m: { name: string }) => m.name).join(', ')}
- Skills (${skills.length}): ${skills.slice(0, 10).map((s: { name: string }) => s.name).join(', ')}${skills.length > 10 ? '...' : ''}`;
  }

  /** Build the prompt for Claude to generate recommendations */
  buildPrompt(userContext: string, trendingData: string): string {
    return `You are a Claude Code plugin recommendation engine. Based on the user's current setup and trending tools, suggest 12 recommendations (4 plugins, 4 MCP servers, 4 skills/tools).

${userContext}

Trending MCP servers and tools from registries:
${trendingData}

For each recommendation, provide:
- name: package/tool name
- type: "plugin" | "mcp" | "skill"
- description: what it does (1 sentence)
- reason: why this user should install it (personalized, 1 sentence)
- popularity: "Trending" | "Popular" | "New" | "Rising"
- installCommand: how to install (e.g., "npx -y @package/name" for MCP, "/plugin install name" for plugins)
- url: GitHub or npm URL
- category: e.g., "development", "productivity", "testing", "database", "ai", "devops"

Focus on tools the user does NOT already have. Prioritize:
1. Tools that complement their existing setup
2. Currently trending/popular tools
3. Tools for common workflows

Respond with ONLY a JSON array of recommendation objects. No markdown, no explanation.`;
  }
}
