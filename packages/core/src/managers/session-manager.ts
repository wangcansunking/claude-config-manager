import { join } from 'path';
import { readdir, stat, readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { readJsonFile, fileExists } from '../utils/file-ops.js';

export interface SessionInfo {
  pid: number;
  sessionId: string;
  cwd: string;
  startedAt: number;
  alive: boolean;
  lastMessage?: string;
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

  // List ALL sessions by combining:
  // 1. Active sessions from sessions dir
  // 2. All sessions from history.jsonl (primary index)
  // 3. Session dirs from projects dir
  async listAllSessions(): Promise<SessionInfo[]> {
    const sessionMap = new Map<string, SessionInfo>();

    // 1. Parse history.jsonl — the most complete session index
    await this.parseHistoryIndex(sessionMap);

    // 2. Enrich with active session data (PID, alive status)
    await this.enrichWithActiveSessions(sessionMap);

    // 3. Enrich with project dir info + history file paths
    await this.enrichWithProjectDirs(sessionMap);

    // 4. Sort: alive first, then by startedAt descending
    const sessions = Array.from(sessionMap.values());
    sessions.sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.startedAt - a.startedAt;
    });

    return sessions;
  }

  // Parse history.jsonl to discover all sessions
  private async parseHistoryIndex(sessionMap: Map<string, SessionInfo>): Promise<void> {
    const historyPath = join(this.claudeHome, 'history.jsonl');
    if (!(await fileExists(historyPath))) return;

    try {
      const content = await readFile(historyPath, 'utf-8');
      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line) as {
            display?: string;
            timestamp?: number;
            project?: string;
            sessionId?: string;
          };
          if (!entry.sessionId) continue;

          const existing = sessionMap.get(entry.sessionId);
          if (existing) {
            // Update with latest timestamp and message
            if (entry.timestamp && entry.timestamp > existing.startedAt) {
              // Keep startedAt as earliest, but track last activity
            }
            if (entry.display) {
              existing.lastMessage = entry.display;
            }
          } else {
            sessionMap.set(entry.sessionId, {
              pid: 0,
              sessionId: entry.sessionId,
              cwd: entry.project ?? '',
              startedAt: entry.timestamp ?? 0,
              alive: false,
              lastMessage: entry.display,
              projectDir: entry.project,
            });
          }
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // can't read history
    }
  }

  // Read active sessions from sessions dir
  private async enrichWithActiveSessions(sessionMap: Map<string, SessionInfo>): Promise<void> {
    const sessionsDir = join(this.claudeHome, 'sessions');
    if (!(await fileExists(sessionsDir))) return;

    let files: string[];
    try {
      files = await readdir(sessionsDir);
    } catch {
      return;
    }

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

        const existing = sessionMap.get(data.sessionId);
        if (existing) {
          existing.pid = data.pid;
          existing.alive = alive;
          existing.cwd = data.cwd;
          existing.startedAt = data.startedAt;
          existing.ide = ide;
          existing.projectConfig = projectConfig;
        } else {
          sessionMap.set(data.sessionId, {
            ...data,
            alive,
            ide,
            projectConfig,
          });
        }
      } catch {
        // skip
      }
    }
  }

  // Scan projects dir for history files
  private async enrichWithProjectDirs(sessionMap: Map<string, SessionInfo>): Promise<void> {
    const projectsDir = join(this.claudeHome, 'projects');
    if (!(await fileExists(projectsDir))) return;

    let projectDirs: string[];
    try {
      projectDirs = await readdir(projectsDir);
    } catch {
      return;
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

      // .jsonl files are conversation logs
      for (const entry of entries) {
        if (!entry.endsWith('.jsonl')) continue;
        const sessionId = entry.replace(/\.jsonl$/, '');
        const historyFile = join(dirPath, entry);

        const existing = sessionMap.get(sessionId);
        if (existing) {
          existing.historyFile = historyFile;
          if (!existing.projectDir) existing.projectDir = decodedPath;
          // Load project config if not already loaded
          if (!existing.projectConfig) {
            existing.projectConfig = await this.getProjectConfig(existing.cwd || decodedPath);
          }
        }
      }

      // Session ID subdirectories (some sessions only have dirs, not .jsonl)
      for (const entry of entries) {
        if (entry.endsWith('.jsonl')) continue;
        const entryPath = join(dirPath, entry);
        let entryStat;
        try {
          entryStat = await stat(entryPath);
        } catch {
          continue;
        }
        if (!entryStat.isDirectory()) continue;
        // Skip 'memory' and other non-UUID dirs
        if (!/^[0-9a-f]{8}-/.test(entry)) continue;

        if (!sessionMap.has(entry)) {
          sessionMap.set(entry, {
            pid: 0,
            sessionId: entry,
            cwd: decodedPath,
            startedAt: entryStat.mtimeMs,
            alive: false,
            projectDir: decodedPath,
          });
        }
      }
    }
  }

  async getSessionHistory(
    historyFile: string,
    limit: number = 50,
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

    return entries.slice(-limit);
  }

  async getActiveSessions(): Promise<SessionInfo[]> {
    const all = await this.listAllSessions();
    return all.filter((s) => s.alive);
  }

  private decodeProjectDirName(dirName: string): string {
    if (/^[A-Z]--/.test(dirName)) {
      const drive = dirName[0];
      const rest = dirName.slice(2).replace(/-/g, '\\');
      return `${drive}:${rest}`;
    }
    return dirName.replace(/-/g, '/');
  }

  private isProcessAlive(pid: number): boolean {
    if (!pid) return false;
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
    if (!pid) return undefined;
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
    if (!cwd) return { hasMcpJson: false, hasClaudeMd: false, hasProjectSettings: false };
    return {
      hasMcpJson: await fileExists(join(cwd, '.mcp.json')),
      hasClaudeMd: await fileExists(join(cwd, 'CLAUDE.md')),
      hasProjectSettings: await fileExists(join(cwd, '.claude', 'settings.json')),
    };
  }
}
