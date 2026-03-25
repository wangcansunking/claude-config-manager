import { Command } from 'commander';

export function makeStartCommand(): Command {
  const cmd = new Command('start');
  cmd
    .description('Start the Next.js dashboard server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('--no-open', 'Do not open browser automatically')
    .action((options: { port: string; open: boolean }) => {
      const port = options.port;
      console.log(`Starting dashboard on http://localhost:${port}...`);
    });
  return cmd;
}
