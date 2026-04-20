#!/usr/bin/env node
import { Command } from 'commander';
import { makeStartCommand } from './commands/start.js';
import { makeListCommand } from './commands/list.js';
import { makeProfileCommand } from './commands/profile.js';
import { makeExportCommand } from './commands/export.js';
import { makeImportCommand } from './commands/import.js';
import { makeMcpServerCommand } from './commands/mcp-server.js';
import { makeGistCommand } from './commands/gist.js';

const program = new Command();

program
  .name('claude-config')
  .description('Claude configuration manager CLI')
  .version('1.1.0');

program.addCommand(makeStartCommand());
program.addCommand(makeListCommand());
program.addCommand(makeProfileCommand());
program.addCommand(makeExportCommand());
program.addCommand(makeImportCommand());
program.addCommand(makeGistCommand());
program.addCommand(makeMcpServerCommand());

program.parse(process.argv);
