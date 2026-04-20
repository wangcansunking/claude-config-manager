import { Command } from 'commander';
import { ProfileManager } from '@ccm/core';
import { homedir } from 'os';
import { join } from 'path';
import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { scrubSecrets, findResidualSecrets, REDACTED } from '../lib/scrub.js';

const execFile = promisify(execFileCb);

async function ensureGhAvailable(): Promise<void> {
  try {
    await execFile('gh', ['--version']);
  } catch {
    throw new Error(
      "The `gh` CLI is required for gist sync but wasn't found on PATH.\n" +
        'Install it with `brew install gh` (macOS) or see https://cli.github.com/',
    );
  }
}

function extractGistId(input: string): string {
  // Accept full URLs (https://gist.github.com/<user>/<id>) or bare ids.
  const m = input.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i);
  if (m) return m[1]!;
  if (/^[a-f0-9]{20,}$/i.test(input)) return input;
  throw new Error(`Not a recognizable gist id or URL: ${input}`);
}

function makePushCommand(): Command {
  const cmd = new Command('push');
  cmd
    .description('Upload a profile to a GitHub Gist (secrets scrubbed)')
    .argument('<profile>', 'Profile name to push')
    .option('-d, --description <desc>', 'Gist description', 'Claude Code config profile (scrubbed)')
    .option('--public', 'Create a public gist (default: secret/unlisted)', false)
    .option('--dry-run', 'Print the scrubbed JSON that would be uploaded and stop', false)
    .action(
      async (
        profileName: string,
        opts: { description: string; public: boolean; dryRun: boolean },
      ) => {
        await ensureGhAvailable();

        const home = join(homedir(), '.claude');
        const manager = new ProfileManager(home);
        const raw = await manager.exportProfile(profileName);
        const parsed = JSON.parse(raw) as unknown;
        const scrubbed = scrubSecrets(parsed);
        const scrubbedJson = JSON.stringify(scrubbed, null, 2);

        const residual = findResidualSecrets(scrubbed);
        if (residual.length > 0) {
          console.error(
            `Refusing to push — ${residual.length} value(s) still match known secret patterns after key/env scrubbing:`,
          );
          for (const hit of residual) {
            console.error(`  - ${hit.path}: ${hit.patternName} (matched "${hit.match}")`);
          }
          console.error(
            '\nFix by removing the offending value from the source profile, then re-run.',
          );
          process.exit(2);
        }

        if (opts.dryRun) {
          console.log(scrubbedJson);
          console.error(
            `\n[dry-run] ${opts.public ? 'PUBLIC' : 'secret'} gist would be created with the JSON above.`,
          );
          console.error(`[dry-run] Every value under any "env" block was redacted as ${REDACTED}.`);
          return;
        }

        // Write to tempfile so gh gist create can give it a nice filename.
        const dir = await mkdtemp(join(tmpdir(), 'ccm-gist-'));
        const fileName = `ccm-profile-${profileName}.json`;
        const filePath = join(dir, fileName);
        await writeFile(filePath, scrubbedJson, 'utf-8');

        const args = ['gist', 'create', filePath, '--desc', opts.description];
        if (opts.public) args.push('--public');

        let url: string;
        try {
          const { stdout } = await execFile('gh', args);
          url = stdout.trim();
        } finally {
          await unlink(filePath).catch(() => {});
        }

        console.log(`Pushed profile '${profileName}' to ${url}`);
        console.log(`Pull elsewhere with: claude-config gist pull ${url}`);
      },
    );
  return cmd;
}

function makePullCommand(): Command {
  const cmd = new Command('pull');
  cmd
    .description('Import a profile from a GitHub Gist')
    .argument('<id-or-url>', 'Gist id or full gist URL')
    .option('--activate', 'Activate the profile after import', false)
    .option('--replace', 'Replace existing profile instead of merging', false)
    .action(async (input: string, opts: { activate: boolean; replace: boolean }) => {
      await ensureGhAvailable();

      const gistId = extractGistId(input);
      // `gh gist view --raw <id>` prints the gist file contents to stdout.
      // If the gist has multiple files, it prints all of them concatenated —
      // we only create single-file gists above, so that's fine.
      const { stdout } = await execFile('gh', ['gist', 'view', '--raw', gistId]);
      const data = stdout;

      const parsed = JSON.parse(data) as { name?: string };
      const name = parsed.name ?? '(unknown)';

      const home = join(homedir(), '.claude');
      const manager = new ProfileManager(home);
      const strategy = opts.replace ? 'replace' : 'merge';
      const profile = await manager.importProfile(data, strategy);
      console.log(`Profile '${profile.name}' imported from gist ${gistId} (strategy: ${strategy}).`);

      if (opts.activate) {
        await manager.activate(profile.name);
        console.log(`Profile '${profile.name}' activated.`);
      } else {
        console.log(`Run \`claude-config profile activate ${name}\` to switch to it.`);
      }
    });
  return cmd;
}

export function makeGistCommand(): Command {
  const cmd = new Command('gist');
  cmd.description('Sync profiles to/from GitHub Gist (secrets scrubbed before upload)');
  cmd.addCommand(makePushCommand());
  cmd.addCommand(makePullCommand());
  return cmd;
}
