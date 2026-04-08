import { join } from 'path';
import { readdir } from 'fs/promises';
import { readJsonFile, fileExists } from '../utils/file-ops';

export interface SessionInfo {
  pid: number;
  sessionId: string;
  cwd: string;
  startedAt: number;
  alive: boolean;
  ide?: {
    name: string;
    transport: string;
  };
  projectConfig?: {
    hasMcpJson: boolean;
    hasClaudeMd: boolean;
    hasProjectSettings: boolean;
  };
}

export class SessionManager {
  constructor(private claudeHome: string) {}

  async listSessions(): Promise<SessionInfo[]> {
    const sessionsDir = join(this.claudeHome, 'sessions');
    if (!(await fileExists(sessionsDir))) return [];

    let files: string[];
    try {
      files = await readdir(sessionsDir);
    } catch {
      return [];
    }

    const sessions: SessionInfo[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = (await readJsonFile(join(sessionsDir, file))) as {
          pid: number;
          sessionId: string;
          cwd: string;
          startedAt: number;
        };

        const alive = this.isProcessAlive(data.pid);
        const ide = await this.getIdeInfo(data.pid);
        const projectConfig = await this.getProjectConfig(data.cwd);

        sessions.push({
          ...data,
          alive,
          ide,
          projectConfig,
        });
      } catch {
        // skip invalid session files
      }
    }

    return sessions;
  }

  async getActiveSessions(): Promise<SessionInfo[]> {
    const all = await this.listSessions();
    return all.filter((s) => s.alive);
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  private async getIdeInfo(
    pid: number,
  ): Promise<{ name: string; transport: string } | undefined> {
    const lockFile = join(this.claudeHome, 'ide', `${pid}.lock`);
    try {
      const data = (await readJsonFile(lockFile)) as {
        ideName?: string;
        transport?: string;
      };
      if (data.ideName) {
        return { name: data.ideName, transport: data.transport ?? 'unknown' };
      }
    } catch {
      // no IDE lock file
    }
    return undefined;
  }

  private async getProjectConfig(
    cwd: string,
  ): Promise<SessionInfo['projectConfig']> {
    return {
      hasMcpJson: await fileExists(join(cwd, '.mcp.json')),
      hasClaudeMd: await fileExists(join(cwd, 'CLAUDE.md')),
      hasProjectSettings: await fileExists(join(cwd, '.claude', 'settings.json')),
    };
  }
}
