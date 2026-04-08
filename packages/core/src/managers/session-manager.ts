import { join } from 'path';
import { readdir, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
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
  projectDir?: string;
  historyFile?: string;
}

export interface SessionHistoryEntry {
  role: string;
  text: string;
  timestamp: string;
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

  async listAllSessions(): Promise<SessionInfo[]> {
    // 1. Get active sessions from sessions/*.json
    const activeSessions = await this.listSessions();
    const activeIds = new Set(activeSessions.map((s) => s.sessionId));

    // 2. Get historical sessions from projects/*/
    const projectsDir = join(this.claudeHome, 'projects');
    const historicalSessions: SessionInfo[] = [];

    if (await fileExists(projectsDir)) {
      let projectDirs: string[];
      try {
        projectDirs = await readdir(projectsDir);
      } catch {
        projectDirs = [];
      }

      for (const dirName of projectDirs) {
        const decodedPath = this.decodeProjectDirName(dirName);
        const dirPath = join(projectsDir, dirName);

        let dirStat;
        try {
          dirStat = await stat(dirPath);
        } catch {
          continue;
        }
        if (!dirStat.isDirectory()) continue;

        let entries: string[];
        try {
          entries = await readdir(dirPath);
        } catch {
          continue;
        }

        for (const entry of entries) {
          if (!entry.endsWith('.jsonl')) continue;
          const sessionId = entry.replace(/\.jsonl$/, '');

          // Skip if already in active sessions
          if (activeIds.has(sessionId)) {
            // Enrich the active session with project info
            const active = activeSessions.find((s) => s.sessionId === sessionId);
            if (active) {
              active.projectDir = decodedPath;
              active.historyFile = join(dirPath, entry);
            }
            continue;
          }

          // Parse the first line of the jsonl to get metadata
          const historyFile = join(dirPath, entry);
          const meta = await this.parseSessionMeta(historyFile);

          historicalSessions.push({
            pid: meta.pid ?? 0,
            sessionId,
            cwd: meta.cwd ?? decodedPath,
            startedAt: meta.startedAt ?? 0,
            alive: false,
            projectDir: decodedPath,
            historyFile,
          });
        }
      }
    }

    return [...activeSessions, ...historicalSessions];
  }

  async getSessionHistory(
    historyFile: string,
    limit: number = 20,
  ): Promise<SessionHistoryEntry[]> {
    if (!(await fileExists(historyFile))) return [];

    const entries: SessionHistoryEntry[] = [];

    try {
      const rl = createInterface({
        input: createReadStream(historyFile, { encoding: 'utf-8' }),
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line) as {
            type?: string;
            message?: { role?: string; content?: string | Array<{ type: string; text?: string }> };
            timestamp?: string;
          };

          // We want user messages (type === 'user')
          if (obj.type === 'user' && obj.message?.role === 'user') {
            let text = '';
            if (typeof obj.message.content === 'string') {
              text = obj.message.content;
            } else if (Array.isArray(obj.message.content)) {
              text = obj.message.content
                .filter((c) => c.type === 'text' && c.text)
                .map((c) => c.text!)
                .join('\n');
            }

            if (text) {
              entries.push({
                role: 'user',
                text,
                timestamp: obj.timestamp ?? '',
              });
            }
          }
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // file read error
    }

    // Return last N entries
    return entries.slice(-limit);
  }

  async getActiveSessions(): Promise<SessionInfo[]> {
    const all = await this.listSessions();
    return all.filter((s) => s.alive);
  }

  private decodeProjectDirName(dirName: string): string {
    // On Windows: C--repos-claude-go -> C:\repos\claude-go
    // On Unix: -home-user-project -> /home/user/project
    // The encoding replaces path separators and colons with dashes
    if (/^[A-Z]--/.test(dirName)) {
      // Windows path: starts with drive letter
      const drive = dirName[0];
      const rest = dirName.slice(2).replace(/-/g, '\\');
      return `${drive}:${rest}`;
    }
    // Unix path: starts with dash (for leading /)
    return dirName.replace(/-/g, '/');
  }

  private async parseSessionMeta(
    historyFile: string,
  ): Promise<{ pid?: number; cwd?: string; startedAt?: number }> {
    try {
      const rl = createInterface({
        input: createReadStream(historyFile, { encoding: 'utf-8' }),
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line) as {
            timestamp?: string;
            cwd?: string;
            sessionId?: string;
          };
          const startedAt = obj.timestamp
            ? new Date(obj.timestamp).getTime()
            : 0;
          rl.close();
          return {
            cwd: obj.cwd,
            startedAt,
          };
        } catch {
          break;
        }
      }
    } catch {
      // ignore
    }
    return {};
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
