import { Command } from 'commander';
import { PluginManager, McpManager, SkillScanner } from '@ccm/core';
import { homedir } from 'os';
import { join } from 'path';
export async function runList(options, claudeHome) {
    const home = claudeHome ?? join(homedir(), '.claude');
    const pluginManager = new PluginManager(home);
    const mcpManager = new McpManager(home);
    const skillScanner = new SkillScanner(home);
    const showAll = !options.plugins && !options.mcps && !options.skills && !options.commands;
    const result = {};
    if (showAll || options.plugins) {
        result.plugins = await pluginManager.list();
    }
    if (showAll || options.mcps) {
        result.mcps = await mcpManager.list();
    }
    if (showAll || options.skills) {
        result.skills = await skillScanner.scan();
    }
    if (showAll || options.commands) {
        result.commands = await skillScanner.scanCommands();
    }
    return result;
}
function formatList(result) {
    if (result.plugins !== undefined) {
        console.log(`\nPlugins (${result.plugins.length}):`);
        if (result.plugins.length === 0) {
            console.log('  (none)');
        }
        else {
            for (const p of result.plugins) {
                const status = p.enabled ? 'enabled' : 'disabled';
                console.log(`  - ${p.name} v${p.version} [${status}]`);
            }
        }
    }
    if (result.mcps !== undefined) {
        console.log(`\nMCP Servers (${result.mcps.length}):`);
        if (result.mcps.length === 0) {
            console.log('  (none)');
        }
        else {
            for (const m of result.mcps) {
                console.log(`  - ${m.name}: ${m.config.command}`);
            }
        }
    }
    if (result.skills !== undefined) {
        console.log(`\nSkills (${result.skills.length}):`);
        if (result.skills.length === 0) {
            console.log('  (none)');
        }
        else {
            for (const s of result.skills) {
                const desc = s.description ? ` — ${s.description}` : '';
                console.log(`  - ${s.name}${desc}`);
            }
        }
    }
    if (result.commands !== undefined) {
        console.log(`\nCommands (${result.commands.length}):`);
        if (result.commands.length === 0) {
            console.log('  (none)');
        }
        else {
            for (const c of result.commands) {
                const desc = c.description ? ` — ${c.description}` : '';
                console.log(`  - ${c.name}${desc}`);
            }
        }
    }
}
export function makeListCommand() {
    const cmd = new Command('list');
    cmd
        .description('List plugins, MCP servers, skills, and commands')
        .option('--plugins', 'Show only plugins')
        .option('--mcps', 'Show only MCP servers')
        .option('--skills', 'Show only skills')
        .option('--commands', 'Show only commands')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const result = await runList(options);
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            formatList(result);
        }
    });
    return cmd;
}
//# sourceMappingURL=list.js.map