import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

export function makeStartCommand(): Command {
  const cmd = new Command('start');
  cmd
    .description('Start the Claude Config Manager dashboard')
    .option('-p, --port <port>', 'Port to listen on', '3399')
    .option('--no-open', 'Do not open browser automatically')
    .option('--dev', 'Start in development mode')
    .action(async (options: { port: string; open: boolean; dev: boolean }) => {
      const port = options.port;
      const __dirname = resolve(fileURLToPath(import.meta.url), '..');
      const dashboardDir = resolve(__dirname, '..', '..', 'dashboard');

      console.log(`Starting dashboard on http://localhost:${port}...`);

      const nextCmd = options.dev ? 'dev' : 'start';
      const child = spawn('npx', ['next', nextCmd, '-p', port], {
        cwd: dashboardDir,
        stdio: 'inherit',
        shell: true,
      });

      // Auto-open browser after a delay
      if (options.open) {
        setTimeout(() => {
          const url = `http://localhost:${port}`;
          const openCmd =
            process.platform === 'win32'
              ? 'start'
              : process.platform === 'darwin'
                ? 'open'
                : 'xdg-open';
          spawn(openCmd, [url], { shell: true, stdio: 'ignore' });
        }, 3000);
      }

      child.on('close', (code) => {
        process.exit(code ?? 0);
      });
    });
  return cmd;
}
