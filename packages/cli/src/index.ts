#!/usr/bin/env node
import { Command } from 'commander';
import { makeStartCommand } from './commands/start.js';
import { makeListCommand } from './commands/list.js';
import { makeProfileCommand } from './commands/profile.js';
import { makeExportCommand } from './commands/export.js';
import { makeImportCommand } from './commands/import.js';
import { makeMcpServerCommand } from './commands/mcp-server.js';

const program = new Command();

program
  .name('claude-config')
  .description('Claude configuration manager CLI')
  .version('1.0.0-draft');

program.addCommand(makeStartCommand());
program.addCommand(makeListCommand());
program.addCommand(makeProfileCommand());
program.addCommand(makeExportCommand());
program.addCommand(makeImportCommand());
program.addCommand(makeMcpServerCommand());

program.parse(process.argv);
