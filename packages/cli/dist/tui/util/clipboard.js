import { spawn } from 'child_process';
import { platform } from 'os';
export async function copyToClipboard(text) {
    const cmd = platform() === 'darwin' ? ['pbcopy', []]
        : platform() === 'win32' ? ['clip', []]
            : ['xclip', ['-selection', 'clipboard']];
    return await new Promise((resolve) => {
        try {
            const p = spawn(cmd[0], cmd[1]);
            p.stdin.write(text);
            p.stdin.end();
            p.on('close', (code) => resolve({ ok: code === 0, via: cmd[0] }));
            p.on('error', () => resolve({ ok: false, via: cmd[0] }));
        }
        catch {
            resolve({ ok: false, via: cmd[0] });
        }
    });
}
//# sourceMappingURL=clipboard.js.map