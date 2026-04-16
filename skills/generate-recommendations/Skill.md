---
name: generate-recommendations
description: Generate personalized plugin, MCP server, and skill recommendations based on your Claude Code setup. Run this to refresh the Recommended page in the dashboard.
---

# Generate Recommendations

Analyze the user's current Claude Code environment and generate personalized recommendations for plugins, MCP servers, and skills they should install.

## Steps

1. **Read the current environment** by running these commands:

```bash
# Get installed plugins
cat ~/.claude/plugins/installed_plugins.json 2>/dev/null | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const j=JSON.parse(d.join(''));const names=Object.keys(j.plugins||{}).map(k=>k.split('@')[0]);console.log('Installed plugins:',names.join(', '))}catch{console.log('No plugins')}})"

# Get MCP servers
node -e "const fs=require('fs');const os=require('os');const p=require('path');try{const d=JSON.parse(fs.readFileSync(p.join(os.homedir(),'.claude.json'),'utf8'));console.log('MCP servers:',Object.keys(d.mcpServers||{}).join(', '))}catch{console.log('No MCP servers')}"

# Get installed skills
ls ~/.claude/skills/ 2>/dev/null && echo "---" && find ~/.claude/plugins/cache -name "Skill.md" -path "*/skills/*" 2>/dev/null | head -20

# Get current model and settings
node -e "const fs=require('fs');const os=require('os');const p=require('path');try{const d=JSON.parse(fs.readFileSync(p.join(os.homedir(),'.claude','settings.json'),'utf8'));console.log('Model:',d.model);console.log('Env vars:',Object.keys(d.env||{}).join(', '))}catch{}"

# Get trending skills from skills.sh
npx skills find trending 2>/dev/null | head -30

# Get trending MCP servers from npm
curl -s "https://registry.npmjs.org/-/v1/search?text=mcp+server&size=15&popularity=1.0" 2>/dev/null | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const j=JSON.parse(d.join(''));j.objects.forEach(o=>console.log('-',o.package.name,':',o.package.description?.slice(0,80)))}catch{}})"
```

2. **Analyze the user's setup** and identify gaps — what tools, skills, and MCP servers would complement their existing workflow.

3. **Generate exactly 15 recommendations** (5 MCP servers, 5 skills, 5 plugins) in this JSON format:

```json
[
  {
    "name": "package-name",
    "type": "mcp",
    "description": "What it does (1 sentence)",
    "reason": "Why this user should install it (personalized, 1 sentence)",
    "popularity": "Trending",
    "installCommand": "npx skills add owner/repo@skill OR npx -y @package/name",
    "url": "https://github.com/...",
    "category": "development"
  }
]
```

Rules for recommendations:
- **type** must be one of: `"plugin"`, `"mcp"`, `"skill"`
- **popularity** must be one of: `"Trending"`, `"Popular"`, `"New"`, `"Rising"`
- **category** must be one of: `"development"`, `"productivity"`, `"database"`, `"ai"`, `"devops"`, `"documentation"`, `"testing"`, `"design"`
- **installCommand**: for skills use `npx skills add owner/repo@skill`, for MCP use `npx -y @package/name`, for plugins use `/plugin install name@marketplace`
- Do NOT recommend things the user already has installed
- Prioritize trending and popular tools
- Include a mix of categories

4. **Write the results** to the cache file so the dashboard can display them:

```bash
mkdir -p ~/.claude/plugins/ccm-cache
cat > ~/.claude/plugins/ccm-cache/recommendations.json << 'RECOMMENDATIONS_EOF'
{
  "recommendations": <YOUR_JSON_ARRAY_HERE>,
  "generatedAt": "<CURRENT_ISO_TIMESTAMP>",
  "model": "claude-via-skill"
}
RECOMMENDATIONS_EOF
```

5. **Confirm** by saying: "Generated 15 recommendations. Open http://localhost:3399/recommended to view them."
