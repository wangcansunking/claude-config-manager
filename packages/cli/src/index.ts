#!/usr/bin/env node
import { Command } from 'commander';
import { makeStartCommand } from './commands/start.js';
import { makeListCommand } from './commands/list.js';
import { makeProfileCommand } from './commands/profile.js';
import { makeExportCommand } from './commands/export.js';
import { makeImportCommand } from './commands/import.js';
import { makeMcpServerCommand } from './commands/mcp-server.js';
import { makeGistCommand } from './commands/gist.js';
import { runTui } from './tui/runtime.js';

async function main() {
  // No subcommand and no flags → launch TUI.
  if (process.argv.length === 2) {
    const code = await runTui();
    process.exit(code);
  }

  const program = new Command();
  program
    .name('claude-config')
    .description('Claude configuration manager CLI')
    .version('1.2.0');

  program.addCommand(makeStartCommand());
  program.addCommand(makeListCommand());
  program.addCommand(makeProfileCommand());
  program.addCommand(makeExportCommand());
  program.addCommand(makeImportCommand());
  program.addCommand(makeGistCommand());
  program.addCommand(makeMcpServerCommand());

  program.parse(process.argv);
}

void main();
