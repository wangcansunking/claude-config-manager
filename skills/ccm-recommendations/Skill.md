---
name: ccm-recommendations
description: Generate personalized plugin, MCP server, and skill recommendations based on your Claude Code setup. Run this to refresh the Recommended page in the dashboard.
---

# Generate Recommendations

Analyze the user's current Claude Code environment and generate 60 personalized recommendations (10 Top + 10 Trending for each of 3 categories: mcp, plugin, skill).

## Steps

1. **Read the current environment** by running these commands:

```bash
# Get installed plugins
cat ~/.claude/plugins/installed_plugins.json 2>/dev/null | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const j=JSON.parse(d.join(''));const names=Object.keys(j.plugins||{}).map(k=>k.split('@')[0]);console.log('Installed plugins:',names.join(', '))}catch{console.log('No plugins installed')}})"

# Get installed MCP servers
node -e "const fs=require('fs');const os=require('os');const p=require('path');try{const d=JSON.parse(fs.readFileSync(p.join(os.homedir(),'.claude.json'),'utf8'));console.log('MCP servers:',Object.keys(d.mcpServers||{}).join(', '))}catch{try{const d=JSON.parse(fs.readFileSync(p.join(os.homedir(),'.claude','.mcp.json'),'utf8'));console.log('MCP servers:',Object.keys(d.mcpServers||{}).join(', '))}catch{console.log('No MCP servers')}}"

# Get installed skills
ls ~/.claude/skills/ 2>/dev/null && echo "---" && find ~/.claude/plugins/cache -name "Skill.md" -path "*/skills/*" 2>/dev/null | head -30

# Get current model and settings
node -e "const fs=require('fs');const os=require('os');const p=require('path');try{const d=JSON.parse(fs.readFileSync(p.join(os.homedir(),'.claude','settings.json'),'utf8'));console.log('Model:',d.model);console.log('Env vars:',Object.keys(d.env||{}).join(', '))}catch{}"
```

2. **Fetch trending skills** from skills.sh:

```bash
npx skills find trending 2>/dev/null | head -40
```

3. **Fetch top/popular skills** from skills.sh:

```bash
npx skills find popular 2>/dev/null | head -40
```

4. **Fetch trending MCP servers from npm** (sorted by popularity):

```bash
curl -s "https://registry.npmjs.org/-/v1/search?text=mcp+server&size=20&popularity=1.0" 2>/dev/null | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const j=JSON.parse(d.join(''));j.objects.forEach(o=>console.log('-',o.package.name,':',o.package.description?.slice(0,100),'| version:',o.package.version))}catch{}})"
```

5. **Fetch from the official MCP registry**:

```bash
curl -s "https://registry.modelcontextprotocol.io/v0.1/servers?limit=20" 2>/dev/null | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const j=JSON.parse(d.join(''));(j.servers||[]).forEach(s=>console.log('-',s.name,':',s.description?.slice(0,100),'| repo:',s.repositoryUrl))}catch(e){console.log('Parse error:',e.message)}})"
```

6. **Compile exactly 60 recommendations** — exclude anything the user already has installed. Structure:

   - **MCP** category: 10 Top (most popular/installed MCP servers the user doesn't have) + 10 Trending (new/rising/hot MCP servers)
   - **Plugin** category: 10 Top + 10 Trending plugins
   - **Skill** category: 10 Top + 10 Trending skills

   Each recommendation must have this exact shape:

```json
{
  "name": "package-name",
  "type": "mcp",
  "description": "What it does (1 sentence)",
  "reason": "Why this user should install it based on their current setup (personalized, 1 sentence)",
  "popularity": "Top",
  "installCommand": "npx -y @package/name",
  "url": "https://github.com/...",
  "category": "development"
}
```

Rules for each field:
- **type** must be one of: `"plugin"`, `"mcp"`, `"skill"`
- **popularity** must be one of: `"Top"` or `"Trending"`
- **category** must be one of: `"development"`, `"productivity"`, `"database"`, `"ai"`, `"devops"`, `"documentation"`, `"testing"`, `"design"`
- **installCommand**: for skills use `npx skills add owner/repo@skill`, for MCP servers use `npx -y @package/name`, for plugins use `/plugin install name@marketplace`
- **reason** must be personalized based on the user's installed tools and workflow
- Do NOT recommend anything the user already has installed
- Prioritize real, well-known packages from the fetched results
- Ensure a mix of categories across all recommendations

The final array must contain exactly 60 items: 20 with `type: "mcp"` (10 Top + 10 Trending), 20 with `type: "plugin"` (10 Top + 10 Trending), 20 with `type: "skill"` (10 Top + 10 Trending).

7. **Write the results** to the cache file so the dashboard can display them:

```bash
mkdir -p ~/.claude/plugins/ccm-cache
cat > ~/.claude/plugins/ccm-cache/recommendations.json << 'RECOMMENDATIONS_EOF'
{
  "recommendations": <YOUR_JSON_ARRAY_OF_60_ITEMS>,
  "generatedAt": "<CURRENT_ISO_TIMESTAMP>",
  "model": "claude-via-skill"
}
RECOMMENDATIONS_EOF
```

8. **Confirm** by saying: "Generated 60 recommendations (10 Top + 10 Trending for each of MCP, Plugin, Skill). Open http://localhost:3399/recommended to view them."
