export interface SessionInfo {
    pid: number;
    sessionId: string;
    cwd: string;
    startedAt: number;
    alive: boolean;
    name?: string;
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
export declare class SessionManager {
    private claudeHome;
    constructor(claudeHome: string);
    listAllSessions(): Promise<SessionInfo[]>;
    private parseHistoryIndex;
    private enrichWithActiveSessions;
    private enrichWithProjectDirs;
    getSessionHistory(historyFile: string, limit?: number): Promise<SessionHistoryEntry[]>;
    getActiveSessions(): Promise<SessionInfo[]>;
    private decodeProjectDirName;
    private isProcessAlive;
    private getIdeInfo;
    private getProjectConfig;
}
//# sourceMappingURL=session-manager.d.ts.map