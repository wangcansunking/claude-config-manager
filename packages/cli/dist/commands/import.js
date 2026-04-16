import { Command } from 'commander';
import { ProfileManager } from '@ccm/core';
import { homedir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';
export function makeImportCommand() {
    const cmd = new Command('import');
    cmd
        .description('Import a profile from a file')
        .argument('<file>', 'Path to profile file to import')
        .option('--dry-run', 'Preview import without making changes')
        .option('--replace', 'Replace existing profile instead of merging')
        .option('--activate', 'Activate the profile after importing')
        .action(async (filePath, options) => {
        const data = await readFile(filePath, 'utf-8');
        const strategy = options.replace ? 'replace' : 'merge';
        if (options.dryRun) {
            const parsed = JSON.parse(data);
            console.log(`Dry run: would import profile '${parsed['name'] ?? '(unknown)'}' with strategy '${strategy}'`);
            return;
        }
        const home = join(homedir(), '.claude');
        const manager = new ProfileManager(home);
        const profile = await manager.importProfile(data, strategy);
        console.log(`Profile '${profile.name}' imported with strategy '${strategy}'.`);
        if (options.activate) {
            await manager.activate(profile.name);
            console.log(`Profile '${profile.name}' activated.`);
        }
    });
    return cmd;
}
//# sourceMappingURL=import.js.map