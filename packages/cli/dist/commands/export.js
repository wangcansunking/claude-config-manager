import { Command } from 'commander';
import { ProfileManager } from '@ccm/core';
import { homedir } from 'os';
import { join } from 'path';
import { writeFile } from 'fs/promises';
export function makeExportCommand() {
    const cmd = new Command('export');
    cmd
        .description('Export a profile to a file or stdout')
        .argument('<profile>', 'Profile name to export')
        .option('-o, --output <file>', 'Output file path (defaults to stdout)')
        .option('--format <format>', 'Output format: json or yaml', 'json')
        .action(async (profileName, options) => {
        const home = join(homedir(), '.claude');
        const manager = new ProfileManager(home);
        const exported = await manager.exportProfile(profileName);
        if (options.output) {
            await writeFile(options.output, exported, 'utf-8');
            console.log(`Profile '${profileName}' exported to ${options.output}`);
        }
        else {
            console.log(exported);
        }
    });
    return cmd;
}
//# sourceMappingURL=export.js.map