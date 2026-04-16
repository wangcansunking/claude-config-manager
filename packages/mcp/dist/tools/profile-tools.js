import { z } from 'zod/v3';
export async function handleListProfiles(managers) {
    const profiles = await managers.profileManager.list();
    return {
        content: [{ type: 'text', text: JSON.stringify(profiles, null, 2) }],
    };
}
export async function handleCreateProfile(managers, args) {
    const profile = await managers.profileManager.create(args.name);
    return {
        content: [
            {
                type: 'text',
                text: `Profile "${args.name}" created successfully.\n${JSON.stringify(profile, null, 2)}`,
            },
        ],
    };
}
export async function handleActivateProfile(managers, args) {
    await managers.profileManager.activate(args.name);
    return {
        content: [
            { type: 'text', text: `Profile "${args.name}" activated successfully.` },
        ],
    };
}
export async function handleExportProfile(managers, args) {
    const exported = await managers.profileManager.exportProfile(args.name);
    return {
        content: [{ type: 'text', text: exported }],
    };
}
export async function handleImportProfile(managers, args) {
    const profile = await managers.profileManager.importProfile(args.data, args.strategy ?? 'replace');
    return {
        content: [
            {
                type: 'text',
                text: `Profile "${profile.name}" imported successfully.\n${JSON.stringify(profile, null, 2)}`,
            },
        ],
    };
}
export async function handleUpdateProfile(managers, args) {
    const patch = {};
    if (args.description !== undefined)
        patch.description = args.description;
    if (args.plugins)
        patch.plugins = JSON.parse(args.plugins);
    if (args.mcpServers)
        patch.mcpServers = JSON.parse(args.mcpServers);
    if (args.settings)
        patch.settings = JSON.parse(args.settings);
    await managers.profileManager.update(args.name, patch);
    return {
        content: [
            { type: 'text', text: `Profile "${args.name}" updated successfully.` },
        ],
    };
}
export async function handleDeleteProfile(managers, args) {
    await managers.profileManager.delete(args.name);
    return {
        content: [
            { type: 'text', text: `Profile "${args.name}" deleted successfully.` },
        ],
    };
}
export function registerProfileTools(server, managers) {
    server.tool('ccm_list_profiles', 'List all saved configuration profiles', async () => handleListProfiles(managers));
    server.tool('ccm_create_profile', 'Create a new configuration profile from current settings', { name: z.string().describe('Name for the new profile') }, async (args) => handleCreateProfile(managers, args));
    server.tool('ccm_activate_profile', 'Activate a saved configuration profile', { name: z.string().describe('Name of the profile to activate') }, async (args) => handleActivateProfile(managers, args));
    server.tool('ccm_export_profile', 'Export a configuration profile to JSON', {
        name: z.string().describe('Name of the profile to export'),
        format: z
            .string()
            .optional()
            .describe('Export format (currently only json is supported)'),
    }, async (args) => handleExportProfile(managers, args));
    server.tool('ccm_import_profile', 'Import a configuration profile from JSON data', {
        data: z.string().describe('JSON string containing the profile data to import'),
        strategy: z
            .enum(['merge', 'replace'])
            .optional()
            .describe('Import strategy: merge with existing or replace (default: replace)'),
    }, async (args) => handleImportProfile(managers, args));
    server.tool('ccm_update_profile', 'Update an existing configuration profile — modify description, plugins, MCP servers, or settings', {
        name: z.string().describe('Name of the profile to update'),
        description: z.string().optional().describe('New description'),
        plugins: z.string().optional().describe('JSON string of plugins array to set'),
        mcpServers: z.string().optional().describe('JSON string of mcpServers object to set'),
        settings: z.string().optional().describe('JSON string of settings object to set'),
    }, async (args) => handleUpdateProfile(managers, args));
    server.tool('ccm_delete_profile', 'Delete a saved configuration profile', { name: z.string().describe('Name of the profile to delete') }, async (args) => handleDeleteProfile(managers, args));
}
//# sourceMappingURL=profile-tools.js.map