import { Command } from 'commander';
import { ProfileManager } from '@ccm/core';
import { homedir } from 'os';
import { join } from 'path';

function getProfileManager(claudeHome?: string): ProfileManager {
  const home = claudeHome ?? join(homedir(), '.claude');
  return new ProfileManager(home);
}

export function makeProfileCommand(): Command {
  const cmd = new Command('profile');
  cmd.description('Manage configuration profiles');

  // profile list [--json]
  cmd
    .command('list')
    .description('List all profiles')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const manager = getProfileManager();
      const profiles = await manager.list();
      const active = await manager.getActive();
      if (options.json) {
        console.log(JSON.stringify({ profiles, active }, null, 2));
      } else {
        if (profiles.length === 0) {
          console.log('No profiles found.');
        } else {
          for (const p of profiles) {
            const marker = p.name === active ? ' (active)' : '';
            console.log(`  - ${p.name}${marker}`);
          }
        }
      }
    });

  // profile create <name>
  cmd
    .command('create <name>')
    .description('Create a profile from the current configuration')
    .action(async (name: string) => {
      const manager = getProfileManager();
      const profile = await manager.create(name);
      console.log(`Profile '${profile.name}' created.`);
    });

  // profile activate <name>
  cmd
    .command('activate <name>')
    .description('Switch to a profile')
    .action(async (name: string) => {
      const manager = getProfileManager();
      await manager.activate(name);
      console.log(`Profile '${name}' activated.`);
    });

  // profile delete <name>
  cmd
    .command('delete <name>')
    .description('Delete a profile')
    .action(async (name: string) => {
      const manager = getProfileManager();
      await manager.delete(name);
      console.log(`Profile '${name}' deleted.`);
    });

  return cmd;
}
