'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { Tag } from '@/components/shared/tag';
import { useSessions, useSessionHistory } from '@/lib/use-data';

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
  projectDir?: string;
  historyFile?: string;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'unknown';
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

function truncatePath(path: string, maxLen = 50): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(path.length - maxLen + 3);
}

function CollapsibleSection({
  icon,
  label,
  count,
  defaultOpen,
  children,
}: {
  icon: string;
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#252530]"
        style={{ borderBottom: open ? '1px solid #2a2a35' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span
            className="text-sm font-semibold"
            style={{ color: label === 'Running' ? '#00b894' : '#636e72' }}
          >
            {label}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#2a2a35', color: '#b2bec3' }}
          >
            {count}
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: '#636e72',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function SessionRow({
  session,
  isLast,
  onClick,
}: {
  session: SessionInfo;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#252530]"
      style={{ borderBottom: isLast ? 'none' : '1px solid #2a2a35' }}
      onClick={onClick}
    >
      {/* Status dot */}
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
        style={{
          backgroundColor: session.alive ? '#00b894' : '#636e72',
        }}
      />

      <div className="flex-1 min-w-0">
        {/* Top row: PID + session ID + tags */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm font-semibold" style={{ color: '#ffffff' }}>
            {session.pid ? `PID ${session.pid}` : 'No PID'}
          </span>
          <span className="font-mono text-xs" style={{ color: '#636e72' }}>
            {truncateId(session.sessionId)}
          </span>
          {session.ide && (
            <Tag
              label={`${session.ide.name} (${session.ide.transport})`}
              variant="purple"
            />
          )}
          {session.projectConfig?.hasClaudeMd && (
            <span className="text-xs" style={{ color: '#b2bec3' }} title="CLAUDE.md">
              📄
            </span>
          )}
          {session.projectConfig?.hasMcpJson && (
            <span className="text-xs" style={{ color: '#b2bec3' }} title=".mcp.json">
              🔌
            </span>
          )}
        </div>

        {/* Working directory */}
        <p className="font-mono text-xs truncate" style={{ color: '#b2bec3' }}>
          {session.cwd}
        </p>

        {/* Started at */}
        <span className="text-xs" style={{ color: '#636e72' }}>
          Started {formatRelativeTime(session.startedAt)}
        </span>
      </div>

      <svg
        className="w-4 h-4 shrink-0 mt-0.5"
        style={{ color: '#636e72' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}

function SessionDetailContent({ session }: { session: SessionInfo }) {
  const { data: history, isLoading: historyLoading } = useSessionHistory(
    session.historyFile ?? null,
  );

  return (
    <div className="space-y-5">
      {/* Metadata */}
      <section>
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: '#636e72' }}
        >
          Metadata
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-xs" style={{ color: '#636e72' }}>
              PID
            </span>
            <code className="text-xs font-mono" style={{ color: '#a29bfe' }}>
              {session.pid || 'N/A'}
            </code>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs" style={{ color: '#636e72' }}>
              Session ID
            </span>
            <code
              className="text-xs font-mono text-right break-all"
              style={{ color: '#b2bec3' }}
            >
              {session.sessionId}
            </code>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs" style={{ color: '#636e72' }}>
              Working Directory
            </span>
            <code
              className="text-xs font-mono text-right break-all"
              style={{ color: '#b2bec3' }}
            >
              {session.cwd}
            </code>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs" style={{ color: '#636e72' }}>
              Started At
            </span>
            <span className="text-xs" style={{ color: '#b2bec3' }}>
              {session.startedAt
                ? new Date(session.startedAt).toLocaleString()
                : 'Unknown'}
            </span>
          </div>
          {session.ide && (
            <div className="flex justify-between gap-4">
              <span className="text-xs" style={{ color: '#636e72' }}>
                IDE
              </span>
              <span className="text-xs" style={{ color: '#b2bec3' }}>
                {session.ide.name} ({session.ide.transport})
              </span>
            </div>
          )}
          {session.projectDir && (
            <div className="flex justify-between gap-4">
              <span className="text-xs" style={{ color: '#636e72' }}>
                Project Directory
              </span>
              <code
                className="text-xs font-mono text-right break-all"
                style={{ color: '#b2bec3' }}
              >
                {session.projectDir}
              </code>
            </div>
          )}
        </div>
      </section>

      {/* Project Config */}
      {session.projectConfig && (
        <section>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: '#636e72' }}
          >
            Project Config
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.projectConfig.hasClaudeMd && (
              <Tag label="CLAUDE.md" variant="blue" />
            )}
            {session.projectConfig.hasMcpJson && (
              <Tag label=".mcp.json" variant="purple" />
            )}
            {session.projectConfig.hasProjectSettings && (
              <Tag label="Project Settings" variant="orange" />
            )}
            {!session.projectConfig.hasClaudeMd &&
              !session.projectConfig.hasMcpJson &&
              !session.projectConfig.hasProjectSettings && (
                <span className="text-xs" style={{ color: '#636e72' }}>
                  No project config files found
                </span>
              )}
          </div>
        </section>
      )}

      {/* Instruction History */}
      <section>
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: '#636e72' }}
        >
          Instruction History
        </h3>

        {!session.historyFile ? (
          <p className="text-xs" style={{ color: '#636e72' }}>
            No history file available for this session.
          </p>
        ) : historyLoading ? (
          <p className="text-xs" style={{ color: '#b2bec3' }}>
            Loading history...
          </p>
        ) : !history || history.length === 0 ? (
          <p className="text-xs" style={{ color: '#636e72' }}>
            No user messages found in session history.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ backgroundColor: '#16161d' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <Tag label="user" variant="blue" />
                  {entry.timestamp && (
                    <span className="text-xs" style={{ color: '#636e72' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs whitespace-pre-wrap break-words mt-2"
                  style={{ color: '#b2bec3' }}
                >
                  {entry.text.length > 500
                    ? entry.text.slice(0, 500) + '...'
                    : entry.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function SessionsPage() {
  const { data: sessionsRaw, isLoading } = useSessions();
  const sessions = (sessionsRaw ?? []) as SessionInfo[];
  const [selected, setSelected] = useState<SessionInfo | null>(null);
  const [search, setSearch] = useState('');

  // Filter sessions by search
  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.cwd.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q) ||
        String(s.pid).includes(q) ||
        (s.projectDir ?? '').toLowerCase().includes(q),
    );
  }, [sessions, search]);

  // Split into running and grouped-by-project
  const running = useMemo(
    () =>
      filtered
        .filter((s) => s.alive)
        .sort((a, b) => b.startedAt - a.startedAt),
    [filtered],
  );

  const projectGroups = useMemo(() => {
    const terminated = filtered
      .filter((s) => !s.alive)
      .sort((a, b) => b.startedAt - a.startedAt);
    const groups: Record<string, SessionInfo[]> = {};
    for (const s of terminated) {
      const key = s.projectDir || s.cwd || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    // Sort groups by most recent session in each
    return Object.entries(groups).sort(([, a], [, b]) => {
      const aMax = Math.max(...a.map((s) => s.startedAt || 0));
      const bMax = Math.max(...b.map((s) => s.startedAt || 0));
      return bMax - aMax;
    });
  }, [filtered]);

  const totalCount = sessions.length;

  return (
    <div>
      <Header
        title="Sessions"
        subtitle={
          !isLoading
            ? `${running.length} running, ${totalCount} total`
            : 'Loading sessions...'
        }
      >
        {/* Search box */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#636e72' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by cwd, ID, PID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg text-sm w-64 outline-none transition-colors"
            style={{
              backgroundColor: '#1e1e28',
              border: '1px solid #2a2a35',
              color: '#ffffff',
            }}
          />
        </div>
      </Header>

      {isLoading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-lg mb-2" style={{ color: '#636e72' }}>
            {search ? 'No matching sessions' : 'No sessions found'}
          </p>
          <p className="text-sm" style={{ color: '#4a4a55' }}>
            {search
              ? 'Try a different search term.'
              : 'Sessions appear here when Claude Code instances are running or have conversation history.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Running sessions */}
          {running.length > 0 && (
            <CollapsibleSection
              icon="🟢"
              label="Running"
              count={running.length}
              defaultOpen={true}
            >
              {running.map((session, i) => (
                <SessionRow
                  key={session.sessionId}
                  session={session}
                  isLast={i === running.length - 1}
                  onClick={() => setSelected(session)}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Project groups for terminated sessions */}
          {projectGroups.map(([projectPath, groupSessions]) => (
            <CollapsibleSection
              key={projectPath}
              icon="📁"
              label={truncatePath(projectPath)}
              count={groupSessions.length}
              defaultOpen={projectGroups.length <= 3}
            >
              {groupSessions.map((session, i) => (
                <SessionRow
                  key={session.sessionId}
                  session={session}
                  isLast={i === groupSessions.length - 1}
                  onClick={() => setSelected(session)}
                />
              ))}
            </CollapsibleSection>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selected.pid ? `PID ${selected.pid}` : 'Session'}`
            : ''
        }
        subtitle={selected?.sessionId}
        tags={
          selected
            ? [
                {
                  label: selected.alive ? 'Running' : 'Terminated',
                  variant: selected.alive ? 'green' : 'gray',
                },
              ]
            : []
        }
      >
        {selected && <SessionDetailContent session={selected} />}
      </DetailPanel>
    </div>
  );
}
