import { z } from 'zod/v3';
export async function handleListPlugins(managers) {
    const plugins = await managers.pluginManager.list();
    return {
        content: [{ type: 'text', text: JSON.stringify(plugins, null, 2) }],
    };
}
export async function handleListMcpServers(managers) {
    const servers = await managers.mcpManager.list();
    return {
        content: [{ type: 'text', text: JSON.stringify(servers, null, 2) }],
    };
}
export async function handleListSkills(managers) {
    const skills = await managers.skillScanner.scan();
    return {
        content: [{ type: 'text', text: JSON.stringify(skills, null, 2) }],
    };
}
export async function handleListCommands(managers) {
    const commands = await managers.skillScanner.scanCommands();
    return {
        content: [{ type: 'text', text: JSON.stringify(commands, null, 2) }],
    };
}
export async function handleGetConfig(managers, args) {
    const settings = await managers.configManager.getSettings();
    const result = args.section !== undefined && args.section !== ''
        ? { [args.section]: settings[args.section] }
        : settings;
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
}
export async function handleGetComponentDetail(managers, args) {
    let detail = null;
    if (args.type === 'plugin') {
        detail = await managers.pluginManager.getDetail(args.name);
    }
    else if (args.type === 'mcp') {
        detail = await managers.mcpManager.getDetail(args.name);
    }
    else if (args.type === 'skill') {
        const skills = await managers.skillScanner.scan();
        detail = skills.find((s) => s.name === args.name) ?? null;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
    };
}
export function registerQueryTools(server, managers) {
    server.tool('ccm_list_plugins', 'List all installed Claude plugins', async () => handleListPlugins(managers));
    server.tool('ccm_list_mcp_servers', 'List all configured MCP servers', async () => handleListMcpServers(managers));
    server.tool('ccm_list_skills', 'List all skills from installed plugins', async () => handleListSkills(managers));
    server.tool('ccm_list_commands', 'List all user-defined commands', async () => handleListCommands(managers));
    server.tool('ccm_get_config', 'Get the current Claude configuration settings', { section: z.string().optional().describe('Optional config section to retrieve') }, async (args) => handleGetConfig(managers, args));
    server.tool('ccm_get_component_detail', 'Get detailed information about a specific plugin, MCP server, or skill', {
        type: z
            .enum(['plugin', 'mcp', 'skill'])
            .describe('The type of component to get details for'),
        name: z.string().describe('The name of the component'),
    }, async (args) => handleGetComponentDetail(managers, args));
}
//# sourceMappingURL=query-tools.js.map