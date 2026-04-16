import { z } from 'zod/v3';
export async function handleInstallPlugin(_managers, args) {
    return {
        content: [
            {
                type: 'text',
                text: `Plugin installation for "${args.name}"${args.marketplace ? ` from marketplace "${args.marketplace}"` : ''} is not fully implemented yet. Use the CLI: ccm install ${args.name}`,
            },
        ],
    };
}
export async function handleUpdatePlugin(_managers, args) {
    return {
        content: [
            {
                type: 'text',
                text: `Plugin update for "${args.name}" is not fully implemented yet. Use the CLI: ccm update ${args.name}`,
            },
        ],
    };
}
export async function handleRemovePlugin(managers, args) {
    await managers.pluginManager.remove(args.name);
    return {
        content: [{ type: 'text', text: `Plugin "${args.name}" removed successfully.` }],
    };
}
export async function handleTogglePlugin(managers, args) {
    await managers.pluginManager.toggle(args.name, args.enabled);
    return {
        content: [
            {
                type: 'text',
                text: `Plugin "${args.name}" ${args.enabled ? 'enabled' : 'disabled'} successfully.`,
            },
        ],
    };
}
export async function handleAddMcpServer(managers, args) {
    await managers.mcpManager.add(args.name, {
        command: args.command,
        args: args.args,
        env: args.env,
    });
    return {
        content: [
            { type: 'text', text: `MCP server "${args.name}" added successfully.` },
        ],
    };
}
export async function handleRemoveMcpServer(managers, args) {
    await managers.mcpManager.remove(args.name);
    return {
        content: [
            { type: 'text', text: `MCP server "${args.name}" removed successfully.` },
        ],
    };
}
export async function handleUpdateConfig(managers, args) {
    const patch = {};
    if (args.model !== undefined)
        patch['model'] = args.model;
    if (args.env !== undefined)
        patch['env'] = args.env;
    if (args.hooks !== undefined)
        patch['hooks'] = args.hooks;
    await managers.configManager.updateSettings(patch);
    return {
        content: [{ type: 'text', text: 'Configuration updated successfully.' }],
    };
}
export function registerMutationTools(server, managers) {
    server.tool('ccm_install_plugin', 'Install a Claude plugin (stub — not fully implemented)', {
        name: z.string().describe('Plugin name to install'),
        marketplace: z.string().optional().describe('Marketplace to install from'),
    }, async (args) => handleInstallPlugin(managers, args));
    server.tool('ccm_update_plugin', 'Update an installed Claude plugin (stub — not fully implemented)', { name: z.string().describe('Plugin name to update') }, async (args) => handleUpdatePlugin(managers, args));
    server.tool('ccm_remove_plugin', 'Remove an installed Claude plugin', { name: z.string().describe('Plugin name to remove') }, async (args) => handleRemovePlugin(managers, args));
    server.tool('ccm_toggle_plugin', 'Enable or disable an installed Claude plugin', {
        name: z.string().describe('Plugin name to toggle'),
        enabled: z.boolean().describe('Whether to enable (true) or disable (false) the plugin'),
    }, async (args) => handleTogglePlugin(managers, args));
    server.tool('ccm_add_mcp_server', 'Add a new MCP server configuration', {
        name: z.string().describe('Name for the MCP server'),
        command: z.string().describe('Command to run the MCP server'),
        args: z.array(z.string()).optional().describe('Arguments to pass to the command'),
        env: z.record(z.string()).optional().describe('Environment variables for the server'),
    }, async (args) => handleAddMcpServer(managers, args));
    server.tool('ccm_remove_mcp_server', 'Remove a configured MCP server', { name: z.string().describe('Name of the MCP server to remove') }, async (args) => handleRemoveMcpServer(managers, args));
    server.tool('ccm_update_config', 'Update Claude configuration settings', {
        model: z.string().optional().describe('Model to use'),
        env: z.record(z.string()).optional().describe('Environment variables to set'),
        hooks: z.record(z.unknown()).optional().describe('Hooks configuration'),
    }, async (args) => handleUpdateConfig(managers, args));
}
//# sourceMappingURL=mutation-tools.js.map