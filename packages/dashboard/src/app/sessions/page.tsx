'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { SearchBox } from '@/components/shared/search-box';
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
  lastMessage?: string;
  ide?: IdeInfo;
  projectConfig?: ProjectConfig;
  projectDir?: string;
  historyFile?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'unknown';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  // Older than 30 days — show date
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function truncatePath(path: string, maxLen = 60): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(path.length - maxLen + 3);
}

function truncateMessage(msg: string, maxLen = 120): string {
  if (!msg) return '';
  const oneLine = msg.replace(/\n/g, ' ').trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + '...';
}

// ---------------------------------------------------------------------------
// CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  icon,
  label,
  count,
  defaultOpen,
  labelColor,
  children,
}: {
  icon: string;
  label: string;
  count: number;
  defaultOpen?: boolean;
  labelColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#28282c]"
        style={{ borderBottom: open ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span
            className="text-sm font-medium"
            style={{ color: labelColor ?? '#8a8f98' }}
          >
            {label}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#d0d6e0' }}
          >
            {count}
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: '#8a8f98',
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

// ---------------------------------------------------------------------------
// SessionRow
// ---------------------------------------------------------------------------

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
      className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#28282c]"
      style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.05)' }}
      onClick={onClick}
    >
      {/* Status dot */}
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
        style={{
          backgroundColor: session.alive ? '#27a644' : '#8a8f98',
        }}
      />

      <div className="flex-1 min-w-0">
        {/* Top row: session ID + PID + IDE + config icons */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="font-mono text-sm font-medium"
            style={{ color: '#7170ff' }}
          >
            {session.sessionId}
          </span>
          {session.pid > 0 && (
            <Tag label={`PID ${session.pid}`} variant="gray" />
          )}
          {session.ide && (
            <Tag
              label={`${session.ide.name} (${session.ide.transport})`}
              variant="purple"
            />
          )}
          {session.projectConfig?.hasClaudeMd && (
            <span className="text-xs" style={{ color: '#d0d6e0' }} title="CLAUDE.md">
              📄
            </span>
          )}
          {session.projectConfig?.hasMcpJson && (
            <span className="text-xs" style={{ color: '#d0d6e0' }} title=".mcp.json">
              🔌
            </span>
          )}
          {session.projectConfig?.hasProjectSettings && (
            <span className="text-xs" style={{ color: '#d0d6e0' }} title="Project Settings">
              ⚙️
            </span>
          )}
        </div>

        {/* Working directory */}
        <p className="font-mono text-xs truncate" style={{ color: '#d0d6e0' }}>
          {session.cwd}
        </p>

        {/* Time + last message */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs shrink-0" style={{ color: '#8a8f98' }}>
            {formatRelativeTime(session.startedAt)}
          </span>
          {session.lastMessage && (
            <span
              className="text-sm truncate"
              style={{ color: '#d0d6e0' }}
            >
              💬 {truncateMessage(session.lastMessage)}
            </span>
          )}
        </div>
      </div>

      <svg
        className="w-4 h-4 shrink-0 mt-0.5"
        style={{ color: '#8a8f98' }}
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

// ---------------------------------------------------------------------------
// SessionSlidePanel — wide slide-from-right panel (60% width)
// ---------------------------------------------------------------------------

function SessionSlidePanel({
  session,
  onClose,
}: {
  session: SessionInfo | null;
  onClose: () => void;
}) {
  const open = session !== null;

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <>
      {/* Dimmed overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full flex flex-col"
        style={{
          width: '60%',
          minWidth: '480px',
          maxWidth: '900px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease-in-out',
          boxShadow: open ? '-8px 0 32px rgba(0, 0, 0, 0.4)' : 'none',
        }}
      >
        {session && <SessionPanelContent session={session} onClose={onClose} />}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// SessionPanelContent — inner content for the slide panel
// ---------------------------------------------------------------------------

function SessionPanelContent({
  session,
  onClose,
}: {
  session: SessionInfo;
  onClose: () => void;
}) {
  const { data: history, isLoading: historyLoading } = useSessionHistory(
    session.historyFile ?? null,
  );

  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(
      (entry: { text: string; timestamp?: string }) =>
        entry.text.toLowerCase().includes(q),
    );
  }, [history, historySearch]);

  return (
    <>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: '#0f1011' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Status dot */}
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{
              backgroundColor: session.alive ? '#27a644' : '#8a8f98',
            }}
          />
          <span className="text-base font-medium" style={{ color: '#f7f8f8' }}>
            {session.pid > 0 ? `PID ${session.pid}` : 'Session'}
          </span>
          <Tag
            label={session.alive ? 'Running' : 'Terminated'}
            variant={session.alive ? 'green' : 'gray'}
          />
          {session.ide && (
            <Tag
              label={`${session.ide.name} (${session.ide.transport})`}
              variant="purple"
            />
          )}
        </div>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-[#28282c]"
          style={{ color: '#d0d6e0' }}
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ---- Metadata Section ---- */}
        <section>
          <h3
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: '#8a8f98' }}
          >
            Metadata
          </h3>
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: '#0f1011' }}
          >
            <MetaRow label="Session ID">
              <code className="text-xs font-mono break-all" style={{ color: '#7170ff' }}>
                {session.sessionId}
              </code>
            </MetaRow>
            {session.pid > 0 && (
              <MetaRow label="PID">
                <code className="text-xs font-mono" style={{ color: '#7170ff' }}>
                  {session.pid}
                </code>
              </MetaRow>
            )}
            <MetaRow label="Working Directory">
              <code className="text-xs font-mono break-all" style={{ color: '#d0d6e0' }}>
                {session.cwd}
              </code>
            </MetaRow>
            {session.projectDir && session.projectDir !== session.cwd && (
              <MetaRow label="Project Directory">
                <code className="text-xs font-mono break-all" style={{ color: '#d0d6e0' }}>
                  {session.projectDir}
                </code>
              </MetaRow>
            )}
            <MetaRow label="Started">
              <span className="text-xs" style={{ color: '#d0d6e0' }}>
                {session.startedAt
                  ? `${new Date(session.startedAt).toLocaleString()} (${formatRelativeTime(session.startedAt)})`
                  : 'Unknown'}
              </span>
            </MetaRow>
            {session.ide && (
              <MetaRow label="IDE">
                <span className="text-xs" style={{ color: '#d0d6e0' }}>
                  {session.ide.name}
                  <span style={{ color: '#8a8f98' }}> via </span>
                  {session.ide.transport}
                </span>
              </MetaRow>
            )}
            {session.projectConfig && (
              <MetaRow label="Project Config">
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
                      <span className="text-xs" style={{ color: '#8a8f98' }}>
                        None detected
                      </span>
                    )}
                </div>
              </MetaRow>
            )}
          </div>
        </section>

        {/* ---- Instruction History Section ---- */}
        <section>
          <h3
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: '#8a8f98' }}
          >
            Instruction History
          </h3>

          {!session.historyFile ? (
            <p className="text-xs" style={{ color: '#8a8f98' }}>
              No history file available for this session.
            </p>
          ) : historyLoading ? (
            <div className="flex items-center gap-2 py-4">
              <span
                className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  borderTopColor: '#7170ff',
                }}
              />
              <span className="text-xs" style={{ color: '#d0d6e0' }}>
                Loading history...
              </span>
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-xs" style={{ color: '#8a8f98' }}>
              No user messages found in session history.
            </p>
          ) : (
            <>
              {/* History search */}
              <div className="mb-3">
                <SearchBox
                  value={historySearch}
                  onChange={setHistorySearch}
                  placeholder="Filter instructions..."
                />
              </div>

              {/* History count */}
              <p className="text-xs mb-3" style={{ color: '#8a8f98' }}>
                {filteredHistory.length} of {history.length} message{history.length !== 1 ? 's' : ''}
              </p>

              {/* Scrollable instruction list */}
              <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: '#8a8f98' }}>
                    No messages match your filter.
                  </p>
                ) : (
                  filteredHistory.map(
                    (entry: { text: string; timestamp?: string; role?: string }, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg p-3"
                        style={{ backgroundColor: '#0f1011' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Tag label={entry.role ?? 'user'} variant="blue" />
                          {entry.timestamp && (
                            <span className="text-xs" style={{ color: '#8a8f98' }}>
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs whitespace-pre-wrap break-words mt-2"
                          style={{ color: '#d0d6e0' }}
                        >
                          {entry.text.length > 800
                            ? entry.text.slice(0, 800) + '...'
                            : entry.text}
                        </p>
                      </div>
                    ),
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MetaRow — simple label/value row used in the metadata section
// ---------------------------------------------------------------------------

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-xs shrink-0" style={{ color: '#8a8f98' }}>
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SessionsPage() {
  const { data: sessionsRaw, isLoading } = useSessions();
  const sessions = (sessionsRaw ?? []) as SessionInfo[];
  const [selected, setSelected] = useState<SessionInfo | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'recent'>('all');

  // Filter sessions by search
  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.cwd.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q) ||
        String(s.pid).includes(q) ||
        (s.lastMessage ?? '').toLowerCase().includes(q) ||
        (s.projectDir ?? '').toLowerCase().includes(q),
    );
  }, [sessions, search]);

  // Running sessions (alive) sorted most recent first
  const running = useMemo(
    () =>
      filtered
        .filter((s) => s.alive)
        .sort((a, b) => b.startedAt - a.startedAt),
    [filtered],
  );

  // Non-alive sessions grouped by projectDir/cwd
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

  // Last 10 active sessions (sorted by most recent startedAt)
  const recentSessions = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 10),
    [filtered],
  );

  const totalCount = sessions.length;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#08090a]">
        <Header
          title="Sessions"
          subtitle={
            !isLoading
              ? `${running.length} running, ${totalCount} total`
              : 'Loading sessions...'
          }
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'recent' ? '#5e6ad2' : 'transparent',
              color: tab === 'recent' ? '#f7f8f8' : '#8a8f98',
            }}
            onClick={() => setTab('recent')}
          >
            Recent (10)
          </button>
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'all' ? '#5e6ad2' : 'transparent',
              color: tab === 'all' ? '#f7f8f8' : '#8a8f98',
            }}
            onClick={() => setTab('all')}
          >
            All Sessions
          </button>
          <div className="flex-1" />
          <div className="w-72">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search sessions..."
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#d0d6e0' }}>Loading...</p>
      ) : tab === 'recent' ? (
        /* Recent tab — flat list of last 10 */
        recentSessions.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <p className="text-sm" style={{ color: '#8a8f98' }}>No recent sessions.</p>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            {recentSessions.map((session, i) => (
              <SessionRow
                key={session.sessionId}
                session={session}
                isLast={i === recentSessions.length - 1}
                onClick={() => setSelected(session)}
              />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <p className="text-lg mb-2" style={{ color: '#8a8f98' }}>
            {search ? 'No matching sessions' : 'No sessions found'}
          </p>
          <p className="text-sm" style={{ color: '#62666d' }}>
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
              labelColor="#27a644"
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

      {/* Wide slide-from-right detail panel */}
      <SessionSlidePanel
        session={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
