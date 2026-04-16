import { NextRequest, NextResponse } from 'next/server';
import { RecommendationManager, getClaudeHome } from '@ccm/core';
import type { Recommendation } from '@ccm/core';

export async function GET() {
  try {
    const mgr = new RecommendationManager(getClaudeHome());

    // Return cached if available
    const cached = await mgr.getCached();
    if (cached) {
      return NextResponse.json(cached);
    }

    // Return empty — client should call POST to generate
    return NextResponse.json({ recommendations: [], generatedAt: null, model: null });
  } catch (err) {
    console.error('[GET /api/recommendations]', err);
    return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const mgr = new RecommendationManager(getClaudeHome());

    // Get user context
    const userContext = await mgr.getUserContext();

    // Fetch trending data from npm
    let trendingData = 'No trending data available';
    try {
      const npmRes = await fetch(
        'https://registry.npmjs.org/-/v1/search?text=mcp+server&size=20&popularity=1.0',
      );
      if (npmRes.ok) {
        const npmData = await npmRes.json();
        trendingData = npmData.objects
          .map((o: { package: { name: string; description?: string } }) =>
            `- ${o.package.name}: ${o.package.description ?? 'No description'}`,
          )
          .join('\n');
      }
    } catch {
      /* ignore */
    }

    // Try to fetch from MCP registry too
    try {
      const mcpRes = await fetch(
        'https://registry.modelcontextprotocol.io/v0.1/servers?limit=20',
      );
      if (mcpRes.ok) {
        const mcpData = await mcpRes.json();
        if (mcpData.servers) {
          trendingData +=
            '\n\nFrom Official MCP Registry:\n' +
            mcpData.servers
              .map((s: { name: string; description?: string }) =>
                `- ${s.name}: ${s.description ?? 'MCP server'}`,
              )
              .join('\n');
        }
      }
    } catch {
      /* ignore */
    }

    // Build prompt
    const prompt = mgr.buildPrompt(userContext, trendingData);

    // Call Claude API using the user's credentials
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const os = await import('os');
        const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
        const cred = JSON.parse(await fs.readFile(credPath, 'utf-8'));
        apiKey = cred.claudeAiOauth?.accessToken || cred.apiKey;
      } catch {
        /* no credentials */
      }
    }

    if (!apiKey) {
      // Return a static set of recommendations if no API key
      const staticRecs = getStaticRecommendations();
      const result = {
        recommendations: staticRecs,
        generatedAt: new Date().toISOString(),
        model: 'static',
      };
      await mgr.saveCache(result);
      return NextResponse.json(result);
    }

    // Call Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      // Fallback to static
      const staticRecs = getStaticRecommendations();
      const result = {
        recommendations: staticRecs,
        generatedAt: new Date().toISOString(),
        model: 'static-fallback',
      };
      await mgr.saveCache(result);
      return NextResponse.json(result);
    }

    const claudeData = await claudeRes.json();
    const responseText = claudeData.content?.[0]?.text ?? '[]';

    // Parse JSON from response
    let recommendations;
    try {
      // Try to extract JSON from the response (in case there's markdown wrapping)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      recommendations = getStaticRecommendations();
    }

    const result = {
      recommendations,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
    };

    await mgr.saveCache(result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/recommendations]', err);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 },
    );
  }
}

function getStaticRecommendations(): Recommendation[] {
  return [
    {
      name: '@modelcontextprotocol/server-filesystem',
      type: 'mcp',
      description: 'File system access for AI agents — read, write, search files',
      reason: 'Essential for any development workflow',
      popularity: 'Popular',
      installCommand: 'npx -y @modelcontextprotocol/server-filesystem',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'development',
    },
    {
      name: '@modelcontextprotocol/server-github',
      type: 'mcp',
      description: 'GitHub integration — PRs, issues, repos, code search',
      reason: 'Integrate GitHub directly into your Claude workflow',
      popularity: 'Popular',
      installCommand: 'npx -y @modelcontextprotocol/server-github',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'development',
    },
    {
      name: 'mcp-server-sqlite',
      type: 'mcp',
      description: 'SQLite database access — query, create, modify databases',
      reason: 'Useful for local data management and prototyping',
      popularity: 'Trending',
      installCommand: 'npx -y mcp-server-sqlite',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'database',
    },
    {
      name: '@21st-dev/magic-mcp',
      type: 'mcp',
      description: 'UI component generation with 21st.dev design system',
      reason: 'Accelerate frontend development with AI-generated components',
      popularity: 'Trending',
      installCommand: 'npx -y @21st-dev/magic-mcp',
      url: 'https://github.com/21st-dev/magic-mcp',
      category: 'development',
    },
    {
      name: 'context7',
      type: 'plugin',
      description: 'Retrieves up-to-date documentation for any library',
      reason: 'Keep docs always fresh in your Claude sessions',
      popularity: 'Popular',
      installCommand: '/plugin install context7@claude-plugins-official',
      url: 'https://github.com/anthropics/claude-plugins-official',
      category: 'documentation',
    },
    {
      name: 'sequential-thinking',
      type: 'mcp',
      description: 'Dynamic thought chain for complex problem solving',
      reason: 'Improve reasoning on complex tasks',
      popularity: 'Rising',
      installCommand: 'npx -y @modelcontextprotocol/server-sequential-thinking',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'ai',
    },
    {
      name: 'brave-search',
      type: 'mcp',
      description: 'Web search via Brave Search API',
      reason: 'Add web search capability to your Claude sessions',
      popularity: 'Popular',
      installCommand: 'npx -y @modelcontextprotocol/server-brave-search',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'productivity',
    },
    {
      name: 'docker-mcp',
      type: 'mcp',
      description: 'Docker container management from Claude',
      reason: 'Manage containers directly from your coding sessions',
      popularity: 'New',
      installCommand: 'npx -y docker-mcp',
      url: 'https://github.com/ckreiling/mcp-server-docker',
      category: 'devops',
    },
    {
      name: 'linear',
      type: 'mcp',
      description: 'Linear issue tracker integration',
      reason: 'Track issues and projects without leaving Claude',
      popularity: 'Trending',
      installCommand: 'npx -y @linear/mcp-server',
      url: 'https://github.com/linear/linear-mcp-server',
      category: 'productivity',
    },
    {
      name: 'notion',
      type: 'mcp',
      description: 'Notion workspace integration — pages, databases, search',
      reason: 'Access your Notion knowledge base from Claude',
      popularity: 'Popular',
      installCommand: 'npx -y @notionhq/notion-mcp-server',
      url: 'https://github.com/makenotion/notion-mcp-server',
      category: 'productivity',
    },
    {
      name: 'sentry',
      type: 'mcp',
      description: 'Sentry error tracking integration',
      reason: 'Debug production issues faster with Sentry data in Claude',
      popularity: 'Rising',
      installCommand: 'npx -y @sentry/mcp-server-sentry',
      url: 'https://github.com/getsentry/sentry-mcp-server',
      category: 'devops',
    },
    {
      name: 'postgres',
      type: 'mcp',
      description: 'PostgreSQL database access and management',
      reason: 'Query and manage your databases from Claude',
      popularity: 'Popular',
      installCommand: 'npx -y @modelcontextprotocol/server-postgres',
      url: 'https://github.com/modelcontextprotocol/servers',
      category: 'database',
    },
  ];
}
