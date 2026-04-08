'use client';

import { Header } from '@/components/layout/header';
import { Tag } from '@/components/shared/tag';
import { useSessions } from '@/lib/use-data';

interface ProjectConfig {
  hasMcpJson: boolean;
  hasClaudeMd: boolean;
  hasProjectSettings: boolean;
}

interface IdeInfo {
  name: string;
  transport: string;
}

interface SessionInfo {
  pid: number;
  sessionId: string;
  cwd: string;
  startedAt: number;
  alive: boolean;
  ide?: IdeInfo;
  projectConfig?: ProjectConfig;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return id.slice(0, len) + '...';
}

export default function SessionsPage() {
  const { data: sessionsRaw, isLoading } = useSessions();
  const sessions = (sessionsRaw ?? []) as SessionInfo[];

  // Sort: alive sessions first, then by startedAt descending
  const sorted = [...sessions].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return b.startedAt - a.startedAt;
  });

  const activeCount = sessions.filter((s) => s.alive).length;

  return (
    <div>
      <Header
        title="Sessions"
        subtitle={`Active Claude Code instances${!isLoading ? ` (${activeCount} active)` : ''}`}
      />

      {isLoading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : sorted.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-lg mb-2" style={{ color: '#636e72' }}>
            No sessions found
          </p>
          <p className="text-sm" style={{ color: '#4a4a55' }}>
            Sessions appear here when Claude Code instances are running.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((session) => (
            <div
              key={session.sessionId}
              className={`rounded-xl p-5 transition-colors ${
                session.alive
                  ? 'hover:border-[#3a3a45]'
                  : 'opacity-50'
              }`}
              style={{
                backgroundColor: '#1e1e28',
                border: '1px solid #2a2a35',
              }}
            >
              {/* Top row: status + PID + session ID + tags */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Status dot */}
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: session.alive ? '#00b894' : '#636e72',
                    }}
                  />
                  <span className="font-mono text-sm" style={{ color: '#ffffff' }}>
                    PID {session.pid}
                  </span>
                  <span className="font-mono text-xs" style={{ color: '#636e72' }}>
                    {truncateId(session.sessionId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {session.ide && (
                    <Tag label={`${session.ide.name} (${session.ide.transport})`} variant="purple" />
                  )}
                  <Tag
                    label={session.alive ? 'alive' : 'terminated'}
                    variant={session.alive ? 'green' : 'gray'}
                  />
                </div>
              </div>

              {/* Working directory */}
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#636e72' }}>
                  Working Directory
                </p>
                <p className="font-mono text-sm truncate" style={{ color: '#b2bec3' }}>
                  {session.cwd}
                </p>
              </div>

              {/* Bottom row: started at + project config indicators */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#636e72' }}>
                  Started {formatRelativeTime(session.startedAt)}
                </span>

                {session.projectConfig && (
                  <div className="flex items-center gap-3">
                    {session.projectConfig.hasClaudeMd && (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#b2bec3' }}>
                        <span>📄</span> CLAUDE.md
                      </span>
                    )}
                    {session.projectConfig.hasMcpJson && (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#b2bec3' }}>
                        <span>🔌</span> .mcp.json
                      </span>
                    )}
                    {session.projectConfig.hasProjectSettings && (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#b2bec3' }}>
                        <span>⚙️</span> Project settings
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
