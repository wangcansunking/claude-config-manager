import { Command } from 'commander';
import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveDashboardServer } from '../lib/assets.js';

export function makeStartCommand(): Command {
  const cmd = new Command('start');
  cmd
    .description('Start the Claude Config Manager dashboard')
    .option('-p, --port <port>', 'Port to listen on', '3399')
    .option('--no-open', 'Do not open browser automatically')
    .option('--dev', 'Start in development mode (Vite + tsx watch)')
    .action(async (options: { port: string; open: boolean; dev: boolean }) => {
      const port = options.port;

      let child;
      if (options.dev) {
        // Dev mode (Vite + tsx watch) only makes sense inside the monorepo.
        const here = dirname(fileURLToPath(import.meta.url));
        const dashboardDir = resolve(here, '..', '..', '..', 'dashboard');
        console.log(`Starting dashboard (dev) on http://localhost:${port}...`);
        child = spawn('npm', ['run', 'dev'], {
          cwd: dashboardDir,
          stdio: 'inherit',
          shell: true,
          env: { ...process.env, PORT: port },
        });
      } else {
        const serverPath = resolveDashboardServer(import.meta.url);
        if (!serverPath) {
          console.error(
            'Could not locate the dashboard server bundle. Try reinstalling the package.',
          );
          process.exit(1);
          return;
        }
        console.log(`Starting dashboard on http://localhost:${port}...`);
        child = spawn(process.execPath, [serverPath], {
          cwd: dirname(serverPath),
          stdio: 'inherit',
          env: { ...process.env, PORT: port },
        });
      }

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
