import { Router } from 'express';
import { RecommendationManager, getClaudeHome } from '@ccm/core';
import type { Recommendation } from '@ccm/core';

const router = Router();

// GET /api/recommendations
router.get('/', async (_req, res) => {
  try {
    const mgr = new RecommendationManager(getClaudeHome());
    const cached = await mgr.getCached();
    if (cached) {
      return res.json(cached);
    }
    res.json({ recommendations: [], generatedAt: null, model: null });
  } catch (err) {
    console.error('[GET /api/recommendations]', err);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

// POST /api/recommendations
router.post('/', async (_req, res) => {
  try {
    const mgr = new RecommendationManager(getClaudeHome());
    const staticRecs = getStaticRecommendations();
    const result = {
      recommendations: staticRecs,
      generatedAt: new Date().toISOString(),
      model: 'static',
    };
    await mgr.saveCache(result);
    res.json(result);
  } catch (err) {
    console.error('[POST /api/recommendations]', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

function getStaticRecommendations(): Recommendation[] {
  return [
    // Skills (5)
    { name: 'vercel-labs/agent-skills@vercel-react-best-practices', type: 'skill', description: 'React best practices from Vercel — components, hooks, performance', reason: 'Most popular skill with 320K+ installs', popularity: 'Trending', installCommand: 'npx skills add vercel-labs/agent-skills@vercel-react-best-practices', url: 'https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices', category: 'development' },
    { name: 'anthropic-labs/agent-skills@frontend-design', type: 'skill', description: 'Create distinctive, production-grade frontend interfaces', reason: 'Official Anthropic skill for UI development', popularity: 'Popular', installCommand: 'npx skills add anthropic-labs/agent-skills@frontend-design', url: 'https://skills.sh/anthropic-labs/agent-skills/frontend-design', category: 'design' },
    { name: 'google-labs-code/stitch-skills@react:components', type: 'skill', description: 'Google Stitch design system — React component generation', reason: 'Generate consistent UI with Google design patterns', popularity: 'Trending', installCommand: 'npx skills add google-labs-code/stitch-skills@react:components', url: 'https://skills.sh/google-labs-code/stitch-skills/react:components', category: 'design' },
    { name: 'microsoft/agent-skills@azure-best-practices', type: 'skill', description: 'Azure cloud development best practices and patterns', reason: 'Complements your Azure DevOps workflow', popularity: 'Popular', installCommand: 'npx skills add microsoft/agent-skills@azure-best-practices', url: 'https://skills.sh/microsoft/agent-skills/azure-best-practices', category: 'devops' },
    { name: 'anthropic-labs/agent-skills@test-web-app', type: 'skill', description: 'Automated web app testing with Playwright', reason: 'Enhance your Playwright testing workflow', popularity: 'Rising', installCommand: 'npx skills add anthropic-labs/agent-skills@test-web-app', url: 'https://skills.sh/anthropic-labs/agent-skills/test-web-app', category: 'testing' },
    // MCP Servers (5)
    { name: '@modelcontextprotocol/server-filesystem', type: 'mcp', description: 'File system access for AI agents — read, write, search files', reason: 'Essential for any development workflow', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-filesystem', url: 'https://github.com/modelcontextprotocol/servers', category: 'development' },
    { name: '@modelcontextprotocol/server-github', type: 'mcp', description: 'GitHub integration — PRs, issues, repos, code search', reason: 'Integrate GitHub directly into your Claude workflow', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-github', url: 'https://github.com/modelcontextprotocol/servers', category: 'development' },
    { name: 'mcp-server-sqlite', type: 'mcp', description: 'SQLite database access — query, create, modify databases', reason: 'Useful for local data management and prototyping', popularity: 'Trending', installCommand: 'npx -y mcp-server-sqlite', url: 'https://github.com/modelcontextprotocol/servers', category: 'database' },
    { name: 'sequential-thinking', type: 'mcp', description: 'Dynamic thought chain for complex problem solving', reason: 'Improve reasoning on complex tasks', popularity: 'Rising', installCommand: 'npx -y @modelcontextprotocol/server-sequential-thinking', url: 'https://github.com/modelcontextprotocol/servers', category: 'ai' },
    { name: '@linear/mcp-server', type: 'mcp', description: 'Linear issue tracker integration', reason: 'Track issues and projects without leaving Claude', popularity: 'Trending', installCommand: 'npx -y @linear/mcp-server', url: 'https://github.com/linear/linear-mcp-server', category: 'productivity' },
    // Plugins (5)
    { name: 'stagehand', type: 'plugin', description: 'Browser automation — web interactions, data extraction', reason: 'Automate web tasks using natural language', popularity: 'Trending', installCommand: '/plugin install stagehand@claude-plugins-official', url: 'https://github.com/anthropics/claude-plugins-official', category: 'development' },
    { name: 'docker-mcp', type: 'mcp', description: 'Docker container management from Claude', reason: 'Manage containers directly from coding sessions', popularity: 'New', installCommand: 'npx -y docker-mcp', url: 'https://github.com/ckreiling/mcp-server-docker', category: 'devops' },
    { name: 'notion', type: 'mcp', description: 'Notion workspace integration — pages, databases, search', reason: 'Access your Notion knowledge base from Claude', popularity: 'Popular', installCommand: 'npx -y @notionhq/notion-mcp-server', url: 'https://github.com/makenotion/notion-mcp-server', category: 'productivity' },
    { name: 'sentry', type: 'mcp', description: 'Sentry error tracking integration', reason: 'Debug production issues faster with Sentry data', popularity: 'Rising', installCommand: 'npx -y @sentry/mcp-server-sentry', url: 'https://github.com/getsentry/sentry-mcp-server', category: 'devops' },
    { name: 'postgres', type: 'mcp', description: 'PostgreSQL database access and management', reason: 'Query and manage your databases from Claude', popularity: 'Popular', installCommand: 'npx -y @modelcontextprotocol/server-postgres', url: 'https://github.com/modelcontextprotocol/servers', category: 'database' },
  ];
}

export { router as recommendationsRouter };
